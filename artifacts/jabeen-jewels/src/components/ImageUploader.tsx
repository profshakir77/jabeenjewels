import { useState, useRef } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  max?: number;
}

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

async function uploadFile(file: File): Promise<string> {
  // Step 1: Request presigned URL
  const metaRes = await fetch(`${BASE}/api/storage/uploads/request-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
  });
  if (!metaRes.ok) throw new Error("Failed to get upload URL");
  const { uploadURL, objectPath } = await metaRes.json();

  // Step 2: Upload directly to GCS
  const uploadRes = await fetch(uploadURL, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!uploadRes.ok) throw new Error("Upload failed");

  // Return the serving URL
  return `${BASE}/api/storage${objectPath}`;
}

export function ImageUploader({ images, onChange, max = 8 }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        if (images.length + urls.length >= max) break;
        const url = await uploadFile(file);
        urls.push(url);
      }
      onChange([...images, ...urls]);
    } catch (e) {
      console.error("Upload error", e);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const remove = (i: number) => {
    const next = [...images];
    next.splice(i, 1);
    onChange(next);
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="grid grid-cols-2 gap-2">
        {images.map((img, i) => (
          <div key={i} className="relative aspect-square border border-border rounded-lg overflow-hidden group">
            <img src={img} className="w-full h-full object-cover" alt="" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
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
            <span className="text-xs">{uploading ? "Uploading…" : "Add Image"}</span>
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-2">Upload product photos (max {max}). Supports JPG, PNG, WebP.</p>
    </div>
  );
}
