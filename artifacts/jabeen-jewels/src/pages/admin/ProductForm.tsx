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
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, X, Plus } from "lucide-react";
import { ImageUploader } from "@/components/ImageUploader";
import { useQueryClient } from "@tanstack/react-query";

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
  colors: z.array(z.string()).default([]),
});

type ProductValues = z.infer<typeof productSchema>;

export default function ProductForm() {
  const { id } = useParams();
  const isEditing = !!id && id !== "new";
  const productId = parseInt(id || "0");
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [colorInput, setColorInput] = useState("");

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
      stockQuantity: 10,
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
      form.reset({
        ...product,
        images: product.images || [],
        salePrice: product.salePrice || null,
        stockQuantity: product.stockQuantity || null,
        description: product.description || "",
        material: product.material || "",
        colors: (product as any).colors || [],
      });
    }
  }, [isEditing, product, form]);

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const onNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    form.setValue("name", e.target.value);
    if (!isEditing && !form.getValues("slug")) {
      form.setValue("slug", generateSlug(e.target.value), { shouldValidate: true });
    }
  };

  const addColor = () => {
    const trimmed = colorInput.trim();
    if (!trimmed) return;
    const current = form.getValues("colors") || [];
    if (!current.includes(trimmed)) {
      form.setValue("colors", [...current, trimmed]);
    }
    setColorInput("");
  };

  const removeColor = (color: string) => {
    const current = form.getValues("colors") || [];
    form.setValue("colors", current.filter(c => c !== color));
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
                        <FormLabel>Stock Quantity</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g. 25" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormDescription>How many units available</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Colors & Material */}
              <div className="bg-card border border-border p-6 rounded-xl space-y-6">
                <h3 className="font-semibold text-lg">Colors & Material</h3>

                {/* Color tag input */}
                <FormField
                  control={form.control}
                  name="colors"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Available Colors</FormLabel>
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <Input
                            placeholder="e.g. Gold, Silver, Rose Gold"
                            value={colorInput}
                            onChange={e => setColorInput(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addColor(); } }}
                          />
                          <Button type="button" variant="outline" size="icon" onClick={addColor}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        {field.value && field.value.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {field.value.map(color => (
                              <Badge key={color} variant="secondary" className="gap-1 pr-1 text-sm">
                                {color}
                                <button
                                  type="button"
                                  onClick={() => removeColor(color)}
                                  className="ml-1 rounded-full hover:bg-muted p-0.5"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                        {(!field.value || field.value.length === 0) && (
                          <p className="text-xs text-muted-foreground">Type a color and press Enter or click + to add.</p>
                        )}
                      </div>
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
