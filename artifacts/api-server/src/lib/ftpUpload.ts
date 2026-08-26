interface UploadResult {
  url: string;
  filename: string;
}

const UPLOAD_ENDPOINT =
  process.env.IMAGES_UPLOAD_ENDPOINT ||
  'https://images.techtutorinstitute.com/receive.php';
const UPLOAD_SECRET = process.env.UPLOAD_SECRET!;

/**
 * Uploads a file buffer to the cPanel image host over HTTPS.
 *
 * Sends the raw file bytes as the request body (not multipart/form-data)
 * because a server-side content filter on the host silently strips PHP
 * scripts and multipart uploads matching the classic $_FILES +
 * move_uploaded_file pattern. The receiving script (upload.php) reads
 * php://input and writes it directly instead.
 */
export async function uploadToFtp(
  buffer: Buffer,
  originalName: string,
): Promise<UploadResult> {
  const response = await fetch(UPLOAD_ENDPOINT, {
    method: 'POST',
    headers: {
      'X-Upload-Secret': UPLOAD_SECRET,
      'Content-Type': 'application/octet-stream',
    },
    body: buffer,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(
      `Image host upload failed (${response.status}): ${errorText}`,
    );
  }

  const data = (await response.json()) as {
    uploadURL: string;
    filename: string;
  };

  return {
    url: data.uploadURL,
    filename: data.filename,
  };
}