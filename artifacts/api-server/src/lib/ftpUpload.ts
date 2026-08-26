import SftpClient from 'ssh2-sftp-client';
import path from 'path';
import crypto from 'crypto';

const FTP_HOST = process.env.FTP_HOST!;
const FTP_USER = process.env.FTP_USER!;
const FTP_PASSWORD = process.env.FTP_PASSWORD!;
const PUBLIC_BASE_URL = process.env.IMAGES_PUBLIC_BASE_URL || 'https://images.techtutorinstitute.com';
// The remote directory path uploads land in — matches the FTP account's
// configured root, e.g. /home/techlhme/images.techtutorinstitute.com
const REMOTE_DIR = process.env.SFTP_REMOTE_DIR || '/';

interface UploadResult {
  url: string;
  filename: string;
}

/**
 * Uploads a file buffer to the cPanel server via SFTP (port 22) and
 * returns its public URL.
 *
 * Uses SFTP rather than plain FTP because plain FTP requires a second,
 * dynamically-negotiated data connection that Vercel's serverless
 * network cannot complete (connections hang until function timeout).
 * SFTP tunnels everything through a single connection, avoiding that
 * problem entirely.
 */
export async function uploadToFtp(
  buffer: Buffer,
  originalName: string,
): Promise<UploadResult> {
  const ext = path.extname(originalName) || '';
  const safeName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;

  const sftp = new SftpClient();

  try {
    await sftp.connect({
      host: FTP_HOST,
      port: 22,
      username: FTP_USER,
      password: FTP_PASSWORD,
      readyTimeout: 15000,
    });

    const remotePath =
      REMOTE_DIR === '/' ? `/${safeName}` : `${REMOTE_DIR}/${safeName}`;

    await sftp.put(buffer, remotePath);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`SFTP upload failed: ${message}`);
  } finally {
    await sftp.end().catch(() => {});
  }

  return {
    url: `${PUBLIC_BASE_URL}/${safeName}`,
    filename: safeName,
  };
}