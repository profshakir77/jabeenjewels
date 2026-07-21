import { useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListBanners } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

export default function AdminBanners() {
  const { data: banners, isLoading } = useListBanners();

  useEffect(() => {
    document.title = "Banners | Admin | Jabeen Jewels";
  }, []);

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Banners</h1>
          <p className="text-muted-foreground mt-1">Manage homepage slider banners.</p>
        </div>
        <Button>Add Banner</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="animate-pulse h-64 bg-muted rounded-xl" />
        ) : banners?.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground bg-card border border-border rounded-xl">
            No banners active. Add one to show on the homepage.
          </div>
        ) : (
          banners?.map(banner => (
            <div key={banner.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="aspect-[21/9] bg-muted relative">
                <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                {!banner.isActive && (
                  <div className="absolute top-2 right-2 bg-destructive text-white text-xs px-2 py-1 rounded">Inactive</div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg">{banner.title}</h3>
                <p className="text-sm text-muted-foreground">{banner.subtitle}</p>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm">Edit</Button>
                  <Button variant="ghost" size="sm" className="text-destructive">Delete</Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
}
