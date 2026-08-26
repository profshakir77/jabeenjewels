import { Readable } from 'stream';
import { z } from 'zod';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { Router, type IRouter, type Request, type Response } from 'express';
import multer from 'multer';
import { requireAdmin } from '../middleware/requireAdmin';
import { uploadToFtp } from '../lib/ftpUpload';

// ── Simple in-memory cache for public objects ─────────────────────────────────
// Avoids hitting GCS on every request (sidecar round-trip is slow).
interface CachedObject { buf: Buffer; contentType: string; expiresAt: number; }
const publicObjectCache = new Map<string, CachedObject>();
const PUBLIC_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCached(key: string): CachedObject | null {
  const entry = publicObjectCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { publicObjectCache.delete(key); return null; }
  return entry;
}
function setCached(key: string, buf: Buffer, contentType: string) {
  publicObjectCache.set(key, { buf, contentType, expiresAt: Date.now() + PUBLIC_CACHE_TTL_MS });
}
// ─────────────────────────────────────────────────────────────────────────────

const RequestUploadUrlBody = z.object({
  name: z.string(),
  size: z.number(),
  contentType: z.string(),
});

const RequestUploadUrlResponse = z.object({
  uploadURL: z.string(),
  objectPath: z.string(),
  metadata: z.object({ name: z.string(), size: z.number(), contentType: z.string() }).optional(),
});

import { ObjectPermission } from '../lib/objectAcl';
import {
  ObjectNotFoundError,
  ObjectStorageService,
} from '../lib/objectStorage';

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB, matches the old Blob limit
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    cb(null, allowed.includes(file.mimetype));
  },
});

function hasAuthenticatedSession(
  req: Request,
): req is Request & { isAuthenticated: () => boolean } {
  if (
    !('isAuthenticated' in req) ||
    typeof req.isAuthenticated !== 'function'
  ) {
    return false;
  }

  return req.isAuthenticated();
}

/**
 * POST /storage/uploads/upload-file
 *
 * Direct file upload -> pushed to cPanel via FTP -> returns public URL.
 * Replaces the old Vercel Blob presigned-URL flow below.
 */
router.post(
  '/storage/uploads/upload-file',
  requireAdmin,
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const result = await uploadToFtp(req.file.buffer, req.file.originalname);

      res.json({
        uploadURL: result.url,
        objectPath: result.url,
        metadata: {
          name: req.file.originalname,
          size: req.file.size,
          contentType: req.file.mimetype,
        },
      });
    } catch (error) {
  req.log.error({ err: error }, 'Error uploading file via FTP');
  res.status(500).json({
    error: 'Failed to upload file',
    detail: error instanceof Error ? error.message : String(error),
  });
}
  },
);

/**
 * POST /storage/uploads/request-url
 *
 * LEGACY — Vercel Blob presigned-URL flow. No longer used by the client
 * (see upload-file above) but left in place in case of rollback.
 * Requires auth middleware so public callers cannot mint write-capable URLs.
 */
router.post(
  '/storage/uploads/request-url',
  requireAdmin,
  async (req: Request, res: Response) => {
    const body = req.body as HandleUploadBody;

    try {
      const jsonResponse = await handleUpload({
        body,
        request: req,
        onBeforeGenerateToken: async () => ({
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          addRandomSuffix: true,
          maximumSizeInBytes: 10 * 1024 * 1024,
        }),
        onUploadCompleted: async ({ blob }) => {
          console.log('Upload completed:', blob.url);
        },
      });

      res.json(jsonResponse);
    } catch (error) {
      req.log.error({ err: error }, 'Error generating upload URL');
      res.status(400).json({ error: (error as Error).message });
    }
  },
);

/**
 * GET /storage/public-objects/*
 *
 * Serve public assets from PUBLIC_OBJECT_SEARCH_PATHS.
 * These are unconditionally public — no authentication or ACL checks.
 * IMPORTANT: Always provide this endpoint when object storage is set up.
 */
router.get(
  '/storage/public-objects/*filePath',
  async (req: Request, res: Response) => {
    try {
      const raw = req.params.filePath;
      const filePath = Array.isArray(raw) ? raw.join('/') : raw;

      // Serve from cache if available
      const cached = getCached(filePath);
      if (cached) {
        res.setHeader('Content-Type', cached.contentType);
        res.setHeader('Cache-Control', 'public, max-age=300');
        res.setHeader('X-Cache', 'HIT');
        res.send(cached.buf);
        return;
      }

      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        res.status(404).json({ error: 'File not found' });
        return;
      }

      const response = await objectStorageService.downloadObject(file);
      const contentType = response.headers.get('content-type') || 'application/octet-stream';

      // Buffer the response so we can cache and send it
      const arrayBuf = await response.arrayBuffer();
      const buf = Buffer.from(arrayBuf);
      setCached(filePath, buf, contentType);

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.setHeader('X-Cache', 'MISS');
      res.send(buf);
    } catch (error) {
      req.log.error({ err: error }, 'Error serving public object');
      res.status(500).json({ error: 'Failed to serve public object' });
    }
  },
);

/**
 * GET /storage/objects/*
 *
 * Serve object entities from PRIVATE_OBJECT_DIR.
 * These are served from a separate path from /public-objects and can optionally
 * be protected with authentication or ACL checks based on the use case.
 */
router.get('/storage/objects/*path', async (req: Request, res: Response) => {
  try {
    const raw = req.params.path;
    const wildcardPath = Array.isArray(raw) ? raw.join('/') : raw;
    const objectPath = `/objects/${wildcardPath}`;
    const objectFile =
      await objectStorageService.getObjectEntityFile(objectPath);

    // --- Protected route example (uncomment when using replit-auth) ---
    // if (!req.isAuthenticated()) {
    //   res.status(401).json({ error: "Unauthorized" });
    //   return;
    // }
    // const canAccess = await objectStorageService.canAccessObjectEntity({
    //   userId: req.user.id,
    //   objectFile,
    //   requestedPermission: ObjectPermission.READ,
    // });
    // if (!canAccess) {
    //   res.status(403).json({ error: "Forbidden" });
    //   return;
    // }

    const response = await objectStorageService.downloadObject(objectFile);

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));

    if (response.body) {
      const nodeStream = Readable.fromWeb(
        response.body as ReadableStream<Uint8Array>,
      );
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      req.log.warn({ err: error }, 'Object not found');
      res.status(404).json({ error: 'Object not found' });
      return;
    }
    req.log.error({ err: error }, 'Error serving object');
    res.status(500).json({ error: 'Failed to serve object' });
  }
});

export default router;
