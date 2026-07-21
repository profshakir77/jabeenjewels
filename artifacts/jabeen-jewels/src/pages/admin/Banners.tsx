import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  useListBanners, useCreateBanner, useUpdateBanner, useDeleteBanner,
  getListBannersQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Loader2, ImagePlus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

async function uploadBannerImage(file: File): Promise<string> {
  const metaRes = await fetch(`${BASE}/api/storage/uploads/request-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
  });
  if (!metaRes.ok) throw new Error("Failed to get upload URL");
  const { uploadURL, objectPath } = await metaRes.json();
  const uploadRes = await fetch(uploadURL, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  if (!uploadRes.ok) throw new Error("Upload failed");
  return `${BASE}/api/storage${objectPath}`;
}

interface BannerForm {
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  buttonText: string;
  isActive: boolean;
  sortOrder: number;
}

const emptyForm: BannerForm = {
  title: "", subtitle: "", imageUrl: "", linkUrl: "", buttonText: "Shop Now", isActive: true, sortOrder: 1,
};

export default function AdminBanners() {
  const { data: banners, isLoading } = useListBanners();
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const deleteBanner = useDeleteBanner();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<BannerForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { document.title = "Banners | Admin | Jabeen Jewels"; }, []);

  const openNew = () => { setEditingId(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (b: NonNullable<typeof banners>[0]) => {
    setEditingId(b.id);
    setForm({ title: b.title, subtitle: b.subtitle ?? "", imageUrl: b.imageUrl ?? "", linkUrl: b.linkUrl ?? "", buttonText: b.buttonText ?? "Shop Now", isActive: b.isActive ?? true, sortOrder: b.sortOrder ?? 1 });
    setOpen(true);
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files?.[0]) return;
    setUploading(true);
    try {
      const url = await uploadBannerImage(files[0]);
      setForm(f => ({ ...f, imageUrl: url }));
    } catch {
      toast({ title: "Image upload failed", variant: "destructive" });
    } finally { setUploading(false); }
  };

  const handleSave = () => {
    const payload = { ...form };
    const invalidate = () => queryClient.invalidateQueries({ queryKey: getListBannersQueryKey() });
    if (editingId) {
      updateBanner.mutate({ id: editingId, data: payload }, {
        onSuccess: () => { toast({ title: "Banner updated" }); setOpen(false); invalidate(); },
        onError: () => toast({ title: "Failed to update banner", variant: "destructive" }),
      });
    } else {
      createBanner.mutate({ data: payload }, {
        onSuccess: () => { toast({ title: "Banner created" }); setOpen(false); invalidate(); },
        onError: () => toast({ title: "Failed to create banner", variant: "destructive" }),
      });
    }
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteBanner.mutate({ id: deleteId }, {
      onSuccess: () => { toast({ title: "Banner deleted" }); setDeleteId(null); queryClient.invalidateQueries({ queryKey: getListBannersQueryKey() }); },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
    });
  };

  const isPending = createBanner.isPending || updateBanner.isPending;

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Banners</h1>
          <p className="text-muted-foreground mt-1">Manage homepage hero banners and slider images.</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Add Banner</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="animate-pulse h-64 bg-muted rounded-xl" />
          ))
        ) : banners?.length === 0 ? (
          <div className="col-span-full text-center py-16 text-muted-foreground bg-card border border-border rounded-xl">
            No banners yet. Click "Add Banner" to create your first hero slide.
          </div>
        ) : (
          banners?.map(banner => (
            <div key={banner.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="aspect-[21/9] bg-gradient-to-br from-[hsl(341,16%,47%)] to-[hsl(341,16%,30%)] relative">
                {banner.imageUrl ? (
                  <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-white/50 text-sm">No image uploaded</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-4">
                  <p className="text-white/80 text-xs">{banner.subtitle}</p>
                  <p className="text-white font-bold text-lg leading-tight">{banner.title}</p>
                </div>
                {!banner.isActive && (
                  <div className="absolute top-2 right-2 bg-destructive text-white text-xs px-2 py-1 rounded">Inactive</div>
                )}
                <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">#{banner.sortOrder}</div>
              </div>
              <div className="p-4 flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(banner)}><Edit className="h-4 w-4 mr-1" />Edit</Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(banner.id)}>
                  <Trash2 className="h-4 w-4 mr-1" />Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Banner" : "New Banner"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Banner Image */}
            <div>
              <Label className="mb-2 block">Banner Image</Label>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e.target.files)} />
              {form.imageUrl ? (
                <div className="relative aspect-[21/9] rounded-lg overflow-hidden border border-border group">
                  <img src={form.imageUrl} className="w-full h-full object-cover" alt="" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <Button size="sm" type="button" variant="secondary" onClick={() => fileRef.current?.click()} disabled={uploading}>
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                      Change
                    </Button>
                    <Button size="sm" type="button" variant="destructive" onClick={() => setForm(f => ({ ...f, imageUrl: "" }))}><X className="h-4 w-4" /></Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-full aspect-[21/9] border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/40 transition-colors disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="h-8 w-8 animate-spin mb-2" /> : <ImagePlus className="h-8 w-8 mb-2" />}
                  <span className="text-sm">{uploading ? "Uploading…" : "Click to upload banner image"}</span>
                  <span className="text-xs mt-1">Recommended: 1920×640px</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              <Label>Heading</Label>
              <Input placeholder="e.g. Timeless Beauty, Made for You" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Subheading</Label>
              <Input placeholder="e.g. Discover our exquisite collection" value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Button Text</Label>
                <Input placeholder="Shop Now" value={form.buttonText} onChange={e => setForm(f => ({ ...f, buttonText: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Link URL</Label>
                <Input placeholder="/shop" value={form.linkUrl} onChange={e => setForm(f => ({ ...f, linkUrl: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input type="number" min={1} value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 1 }))} />
              </div>
              <div className="flex items-center gap-3 pt-7">
                <Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} id="isActive" />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isPending || uploading}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Save Changes" : "Create Banner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete banner?</AlertDialogTitle>
            <AlertDialogDescription>This will remove the banner from the homepage permanently.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
