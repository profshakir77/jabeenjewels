import { useState, useRef } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  max?: number;
}

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

async function uploadFile(file: File): Promise<string> {
  // 1. Request a presigned upload URL from the backend
  const metaRes = await fetch(
    `${BASE}/api/storage/uploads/request-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        name: file.name,
        size: file.size,
        contentType: file.type,
      }),
    }
  );

  // Try to read the backend response
  const metaData = await metaRes.json().catch(() => ({}));

  if (!metaRes.ok) {
    console.error("Upload URL request failed:", {
      status: metaRes.status,
      statusText: metaRes.statusText,
      response: metaData,
    });

    throw new Error(
      metaData?.error ||
        `Failed to get upload URL (${metaRes.status})`
    );
  }

  const { uploadURL, objectPath } = metaData;

  if (!uploadURL || !objectPath) {
    console.error("Invalid upload response:", metaData);
    throw new Error("Invalid upload URL response from server");
  }

  // 2. Upload the file directly to object storage
  const uploadRes = await fetch(uploadURL, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!uploadRes.ok) {
    console.error("Direct upload failed:", {
      status: uploadRes.status,
      statusText: uploadRes.statusText,
    });

    throw new Error(
      `Direct file upload failed (${uploadRes.status})`
    );
  }

  // 3. Return the URL used by the application to display the image
  return `${BASE}/api/storage${objectPath}`;
}

export function ImageUploader({
  images,
  onChange,
  max = 8,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadError(null);
    setUploading(true);

    try {
      const urls: string[] = [];

      for (const file of Array.from(files)) {
        if (images.length + urls.length >= max) break;

        // Basic image validation
        if (!file.type.startsWith("image/")) {
          throw new Error(`${file.name} is not a valid image file`);
        }

        const url = await uploadFile(file);
        urls.push(url);
      }

      if (urls.length > 0) {
        onChange([...images, ...urls]);
      }
    } catch (error) {
      console.error("Upload error:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Upload failed. Please try again.";

      setUploadError(message);
    } finally {
      setUploading(false);

      // Allow selecting the same file again
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const remove = (index: number) => {
    const next = [...images];
    next.splice(index, 1);
    onChange(next);
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />

      <div className="grid grid-cols-2 gap-2">
        {images.map((img, index) => (
          <div
            key={`${img}-${index}`}
            className="relative aspect-square border border-border rounded-lg overflow-hidden group"
          >
            <img
              src={img}
              className="w-full h-full object-cover"
              alt={`Product image ${index + 1}`}
            />

            <button
              type="button"
              onClick={() => remove(index)}
              disabled={uploading}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {images.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-square border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin mb-1" />
            ) : (
              <ImagePlus className="w-6 h-6 mb-1" />
            )}

            <span className="text-xs">
              {uploading ? "Uploading…" : "Add Image"}
            </span>
          </button>
        )}
      </div>

      {uploadError && (
        <p className="text-xs text-destructive mt-2 break-words">
          {uploadError}
        </p>
      )}

      <p className="text-xs text-muted-foreground mt-2">
        Upload product photos (max {max}). Supports JPG, PNG, WebP.
      </p>
    </div>
  );
}
