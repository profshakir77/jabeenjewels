import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useGetProduct, useCreateProduct, useUpdateProduct, useListCategories, getListProductsQueryKey, getGetProductQueryKey } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, X, Plus, Package } from "lucide-react";
import { ImageUploader } from "@/components/ImageUploader";
import { useQueryClient } from "@tanstack/react-query";

const colorEntrySchema = z.object({
  name: z.string().min(1, "Color name required"),
  quantity: z.coerce.number().min(0, "Must be 0 or more"),
});

const productSchema = z.object({
  name: z.string().min(2, "Name is required"),
  slug: z.string().min(2, "Slug is required"),
  description: z.string().optional(),
  price: z.coerce.number().min(1, "Price must be greater than 0"),
  salePrice: z.coerce.number().optional().nullable(),
  categoryId: z.coerce.number().min(1, "Category is required"),
  images: z.array(z.string()).default([]),
  inStock: z.boolean().default(true),
  stockQuantity: z.coerce.number().optional().nullable(),
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isOnSale: z.boolean().default(false),
  material: z.string().optional(),
  colors: z.array(colorEntrySchema).default([]),
});

type ProductValues = z.infer<typeof productSchema>;

export default function ProductForm() {
  const { id } = useParams();
  const isEditing = !!id && id !== "new";
  const productId = parseInt(id || "0");

  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newColorName, setNewColorName] = useState("");
  const [newColorQty, setNewColorQty] = useState<number>(0);

  const { data: categories } = useListCategories();
  const { data: product, isLoading: isProductLoading } = useGetProduct(productId, {
    query: { enabled: isEditing }
  });

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<ProductValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      price: 0,
      salePrice: null,
      categoryId: 0,
      images: [],
      inStock: true,
      stockQuantity: null,
      isFeatured: false,
      isNewArrival: false,
      isOnSale: false,
      material: "",
      colors: [],
    },
  });

  useEffect(() => {
    document.title = isEditing ? "Edit Product | Admin" : "New Product | Admin";
    if (isEditing && product) {
      const rawColors = (product as any).colors;
      // normalise: old text[] → [{name, quantity}], already-correct objects pass through
      const colors: {name: string; quantity: number}[] = Array.isArray(rawColors)
        ? rawColors.map((c: any) =>
            typeof c === "string" ? { name: c, quantity: 0 } : { name: c.name ?? "", quantity: c.quantity ?? 0 }
          )
        : [];

      form.reset({
        ...product,
        images: product.images || [],
        salePrice: product.salePrice || null,
        stockQuantity: product.stockQuantity || null,
        description: product.description || "",
        material: product.material || "",
        colors,
      });
    }
  }, [isEditing, product, form]);

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

  const onNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    form.setValue("name", e.target.value);
    if (!isEditing && !form.getValues("slug")) {
      form.setValue("slug", generateSlug(e.target.value), { shouldValidate: true });
    }
  };

  const addColor = () => {
    const trimmed = newColorName.trim();
    if (!trimmed) return;
    const current = form.getValues("colors") || [];
    if (!current.find(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      form.setValue("colors", [...current, { name: trimmed, quantity: newColorQty }]);
    }
    setNewColorName("");
    setNewColorQty(0);
  };

  const removeColor = (idx: number) => {
    const current = form.getValues("colors") || [];
    form.setValue("colors", current.filter((_, i) => i !== idx));
  };

  const updateColorField = (idx: number, field: "name" | "quantity", value: string | number) => {
    const current = [...(form.getValues("colors") || [])];
    current[idx] = { ...current[idx], [field]: value };
    form.setValue("colors", current);
  };

  const onSubmit = (data: ProductValues) => {
    if (isEditing) {
      updateMutation.mutate({ id: productId, data: data as any }, {
        onSuccess: () => {
          toast({ title: "Product updated successfully" });
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetProductQueryKey(productId) });
          setLocation("/admin/products");
        },
        onError: () => toast({ title: "Failed to update product", variant: "destructive" })
      });
    } else {
      createMutation.mutate({ data: data as any }, {
        onSuccess: () => {
          toast({ title: "Product created successfully" });
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          setLocation("/admin/products");
        },
        onError: () => toast({ title: "Failed to create product", variant: "destructive" })
      });
    }
  };

  if (isEditing && isProductLoading) {
    return <AdminLayout><div className="flex h-32 items-center justify-center"><Loader2 className="animate-spin" /></div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{isEditing ? "Edit Product" : "Add New Product"}</h1>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card border border-border p-6 rounded-xl space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Ruby Kundan Necklace" {...field} onChange={(e) => {
                          field.onChange(e);
                          onNameChange(e);
                        }} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL Slug</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value ? String(field.value) : ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories?.map((cat) => (
                              <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe the piece..." className="min-h-[150px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Pricing & Inventory */}
              <div className="bg-card border border-border p-6 rounded-xl space-y-6">
                <h3 className="font-semibold text-lg">Pricing & Inventory</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (PKR)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="salePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sale Price (Optional)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormDescription>Leave empty if not on sale</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
                  <FormField
                    control={form.control}
                    name="inStock"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">In Stock</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="stockQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Overall Stock Quantity</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g. 25" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormDescription>Used when no per-color stock is set</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Colors & Stock */}
              <div className="bg-card border border-border p-6 rounded-xl space-y-5">
                <div>
                  <h3 className="font-semibold text-lg">Color Variants & Stock</h3>
                  <p className="text-sm text-muted-foreground mt-1">Add each color with its own stock quantity. Customers will see availability per color.</p>
                </div>

                <FormField
                  control={form.control}
                  name="colors"
                  render={({ field }) => (
                    <FormItem>
                      {/* Existing color rows */}
                      {field.value && field.value.length > 0 && (
                        <div className="space-y-2 mb-4">
                          <div className="grid grid-cols-[1fr_120px_36px] gap-2 px-1">
                            <span className="text-xs font-medium text-muted-foreground">Color Name</span>
                            <span className="text-xs font-medium text-muted-foreground">Stock Qty</span>
                            <span />
                          </div>
                          {field.value.map((color, idx) => (
                            <div key={idx} className="grid grid-cols-[1fr_120px_36px] gap-2 items-center">
                              <Input
                                value={color.name}
                                onChange={e => updateColorField(idx, "name", e.target.value)}
                                placeholder="e.g. Gold"
                                className="h-9"
                              />
                              <div className="relative">
                                <Package className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                  type="number"
                                  min={0}
                                  value={color.quantity}
                                  onChange={e => updateColorField(idx, "quantity", parseInt(e.target.value) || 0)}
                                  className="h-9 pl-7"
                                  placeholder="0"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-muted-foreground hover:text-destructive"
                                onClick={() => removeColor(idx)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add new color row */}
                      <div className="grid grid-cols-[1fr_120px_36px] gap-2 items-center pt-2 border-t border-dashed border-border">
                        <Input
                          placeholder="New color (e.g. Rose Gold)"
                          value={newColorName}
                          onChange={e => setNewColorName(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addColor(); } }}
                          className="h-9"
                        />
                        <div className="relative">
                          <Package className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            type="number"
                            min={0}
                            placeholder="Qty"
                            value={newColorQty || ""}
                            onChange={e => setNewColorQty(parseInt(e.target.value) || 0)}
                            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addColor(); } }}
                            className="h-9 pl-7"
                          />
                        </div>
                        <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={addColor}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {(!field.value || field.value.length === 0) && (
                        <p className="text-xs text-muted-foreground mt-2">Enter a color name and quantity, then press Enter or click +.</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="material"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Material</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 18K Gold, Sterling Silver" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-card border border-border p-6 rounded-xl space-y-6">
                <h3 className="font-semibold text-lg">Images</h3>
                <FormField
                  control={form.control}
                  name="images"
                  render={({ field }) => (
                    <FormItem>
                      <ImageUploader
                        images={field.value}
                        onChange={field.onChange}
                        max={8}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="bg-card border border-border p-6 rounded-xl space-y-6">
                <h3 className="font-semibold text-lg">Display Options</h3>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="isFeatured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Featured</FormLabel>
                          <FormDescription>Show on homepage</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isNewArrival"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">New Arrival</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isOnSale"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">On Sale</FormLabel>
                          <FormDescription>Requires Sale Price</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 sticky bottom-0 bg-background/80 backdrop-blur-md p-4 border-t border-border -mx-6 md:-mx-8">
            <Button type="button" variant="outline" onClick={() => window.history.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Product"}
            </Button>
          </div>
        </form>
      </Form>
    </AdminLayout>
  );
}
