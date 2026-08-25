import { Client } from 'basic-ftp';
import { Readable } from 'stream';
import path from 'path';
import crypto from 'crypto';

const FTP_HOST = process.env.FTP_HOST!;
const FTP_USER = process.env.FTP_USER!;
const FTP_PASSWORD = process.env.FTP_PASSWORD!;
const PUBLIC_BASE_URL = process.env.IMAGES_PUBLIC_BASE_URL || 'https://images.techtutorinstitute.com';

interface UploadResult {
  url: string;
  filename: string;
}

/**
 * Uploads a file buffer to the cPanel server via FTP and returns its public URL.
 */
export async function uploadToFtp(
  buffer: Buffer,
  originalName: string,
): Promise<UploadResult> {
  const ext = path.extname(originalName) || '';
  const safeName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;

  const client = new Client();
  client.ftp.verbose = false;

  try {
    await client.access({
      host: FTP_HOST,
      user: FTP_USER,
      password: FTP_PASSWORD,
      secure: false, // set true if using explicit FTPS and it works in your environment
    });

    const readable = Readable.from(buffer);
    await client.uploadFrom(readable, safeName);
  } finally {
    client.close();
  }

  return {
    url: `${PUBLIC_BASE_URL}/${safeName}`,
    filename: safeName,
  };
}
