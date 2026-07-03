import { useState } from "react";
import { PageLayout } from "@/components/layout";
import {
  useGetAnalyticsSummary,
  getGetAnalyticsSummaryQueryKey,
  useGetLowStockProducts,
  getGetLowStockProductsQueryKey,
  useListProducts,
  getListProductsQueryKey,
  useListCategories,
  getListCategoriesQueryKey,
  useListBanners,
  getListBannersQueryKey,
  useCreateCategory,
  useDeleteCategory,
  useCreateBanner,
  useUpdateBanner,
  useDeleteBanner,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useVerifyAdminPin,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getAdminToken, setAdminToken, clearAdminToken } from "@/lib/admin-auth";
import { LogOut } from "lucide-react";
import { ImageUploadField } from "@/components/image-upload-field";

type Tab = "overview" | "products" | "categories" | "banners" | "lowstock";

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function Admin() {
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(() => Boolean(getAdminToken()));
  const [pinError, setPinError] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const queryClient = useQueryClient();
  const verifyPin = useVerifyAdminPin();

  const { data: analytics } = useGetAnalyticsSummary({
    query: { enabled: unlocked, queryKey: getGetAnalyticsSummaryQueryKey() },
  });
  const { data: lowStock } = useGetLowStockProducts({
    query: { enabled: unlocked, queryKey: getGetLowStockProductsQueryKey() },
  });
  const { data: products } = useListProducts(undefined, {
    query: { enabled: unlocked, queryKey: getListProductsQueryKey() },
  });
  const { data: categories } = useListCategories({
    query: { enabled: unlocked, queryKey: getListCategoriesQueryKey() },
  });
  const { data: banners } = useListBanners({
    query: { enabled: unlocked, queryKey: getListBannersQueryKey() },
  });

  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const deleteBanner = useDeleteBanner();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("");
  const [newBannerTitle, setNewBannerTitle] = useState("");
  const [newBannerImage, setNewBannerImage] = useState("");
  const [newBannerLink, setNewBannerLink] = useState("");

  const [newProduct, setNewProduct] = useState({
    categoryId: "",
    name: "",
    description: "",
    price: "",
    mrp: "",
    unit: "",
    imageUrl: "",
    stock: "",
    lowStockThreshold: "10",
  });

  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editProduct, setEditProduct] = useState({
    categoryId: "",
    name: "",
    description: "",
    price: "",
    mrp: "",
    unit: "",
    imageUrl: "",
    stock: "",
    lowStockThreshold: "10",
  });

  const startEditProduct = (p: NonNullable<typeof products>[number]) => {
    setEditingProductId(p.id);
    setEditProduct({
      categoryId: String(p.categoryId),
      name: p.name,
      description: p.description,
      price: String(p.price),
      mrp: String(p.mrp),
      unit: p.unit,
      imageUrl: p.imageUrl,
      stock: String(p.stock),
      lowStockThreshold: String(p.lowStockThreshold),
    });
  };

  const cancelEditProduct = () => {
    setEditingProductId(null);
  };

  const saveEditProduct = () => {
    if (editingProductId == null) return;
    if (!editProduct.categoryId || !editProduct.name || !editProduct.price || !editProduct.mrp || !editProduct.unit) {
      alert("Please fill category, name, price, mrp, unit");
      return;
    }
    updateProduct.mutate(
      {
        id: editingProductId,
        data: {
          categoryId: Number(editProduct.categoryId),
          name: editProduct.name,
          description: editProduct.description,
          price: Number(editProduct.price),
          mrp: Number(editProduct.mrp),
          unit: editProduct.unit,
          imageUrl: editProduct.imageUrl,
          stock: Number(editProduct.stock || 0),
          lowStockThreshold: Number(editProduct.lowStockThreshold || 10),
        },
      },
      {
        onSuccess: () => {
          setEditingProductId(null);
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetLowStockProductsQueryKey() });
        },
      },
    );
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError("");
    verifyPin.mutate(
      { data: { pin } },
      {
        onSuccess: (result) => {
          if (result.valid && result.token) {
            setAdminToken(result.token);
            setUnlocked(true);
          } else {
            setPinError("Incorrect PIN");
          }
        },
        onError: () => {
          setPinError("Incorrect PIN");
        },
      },
    );
  };

  const handleLogout = () => {
    clearAdminToken();
    setUnlocked(false);
    setPin("");
  };

  if (!unlocked) {
    return (
      <PageLayout hideNav>
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
          <div className="bg-card p-6 rounded-2xl shadow-lg border border-border w-full max-w-sm text-center">
            <h1 className="text-2xl font-bold mb-2">Store Management</h1>
            <p className="text-sm text-muted-foreground mb-6">Enter PIN to access store management</p>
            <form onSubmit={handleUnlock} className="space-y-4">
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="****"
                className="w-full text-center text-2xl tracking-widest p-4 rounded-xl border-2 border-border focus:border-primary outline-none"
                maxLength={4}
              />
              {pinError && <p className="text-sm text-destructive font-medium">{pinError}</p>}
              <button
                type="submit"
                disabled={verifyPin.isPending}
                className="w-full bg-secondary text-white py-3 rounded-xl font-bold hover:bg-secondary/90 transition-colors disabled:opacity-60"
              >
                {verifyPin.isPending ? "Verifying..." : "Unlock"}
              </button>
            </form>
          </div>
        </div>
      </PageLayout>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "products", label: "Products" },
    { key: "categories", label: "Categories" },
    { key: "banners", label: "Banners" },
    { key: "lowstock", label: "Low Stock" },
  ];

  return (
    <PageLayout hideNav>
      <div className="p-4 pb-24">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-destructive transition-colors px-3 py-1.5 rounded-lg border border-border"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto mb-6 -mx-4 px-4 pb-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border ${
                tab === t.key ? "bg-primary text-white border-primary" : "bg-card border-border text-muted-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && analytics && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
                <p className="text-xs text-muted-foreground font-medium mb-1">Revenue</p>
                <p className="text-xl font-bold text-primary">₹{analytics.totalRevenue}</p>
              </div>
              <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
                <p className="text-xs text-muted-foreground font-medium mb-1">Orders</p>
                <p className="text-xl font-bold">{analytics.totalOrders}</p>
              </div>
              <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
                <p className="text-xs text-muted-foreground font-medium mb-1">Active Orders</p>
                <p className="text-xl font-bold">{analytics.activeOrderCount}</p>
              </div>
              <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
                <p className="text-xs text-muted-foreground font-medium mb-1">Products</p>
                <p className="text-xl font-bold">{analytics.totalProducts}</p>
              </div>
            </div>

            <button
              onClick={() => {
                if (!products) return;
                downloadCsv("products.csv", [
                  ["ID", "Name", "Category", "Price", "MRP", "Stock", "Unit"],
                  ...products.map((p) => [p.id, p.name, p.categoryId, p.price, p.mrp, p.stock, p.unit]),
                ]);
              }}
              className="w-full bg-secondary text-white py-3 rounded-xl font-bold"
            >
              Export Products CSV
            </button>
          </div>
        )}

        {tab === "lowstock" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Products at or below their restock threshold.</p>
            {(lowStock ?? []).length === 0 && <p className="text-sm text-muted-foreground">No low-stock items 🎉</p>}
            {(lowStock ?? []).map((p) => (
              <div key={p.id} className="bg-card p-4 rounded-xl border border-destructive/40 flex justify-between items-center">
                <div>
                  <p className="font-bold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">Threshold: {p.lowStockThreshold}</p>
                </div>
                <p className="font-bold text-destructive">{p.stock} left</p>
              </div>
            ))}
          </div>
        )}

        {tab === "categories" && (
          <div className="space-y-4">
            <div className="bg-card p-4 rounded-xl border border-border space-y-2">
              <p className="font-bold text-sm">Add Category</p>
              <input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name"
                className="w-full border border-border p-2 rounded-lg text-sm"
              />
              <input
                value={newCategoryIcon}
                onChange={(e) => setNewCategoryIcon(e.target.value)}
                placeholder="Icon name (lucide, e.g. carrot)"
                className="w-full border border-border p-2 rounded-lg text-sm"
              />
              <button
                onClick={() => {
                  if (!newCategoryName) return;
                  createCategory.mutate(
                    { data: { name: newCategoryName, icon: newCategoryIcon || "shopping-basket" } },
                    {
                      onSuccess: () => {
                        setNewCategoryName("");
                        setNewCategoryIcon("");
                        queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
                      },
                    },
                  );
                }}
                className="w-full bg-primary text-white py-2 rounded-lg font-bold text-sm"
              >
                Add
              </button>
            </div>
            {(categories ?? []).map((c) => (
              <div key={c.id} className="bg-card p-3 rounded-xl border border-border flex justify-between items-center">
                <span className="font-semibold text-sm">{c.name}</span>
                <button
                  onClick={() =>
                    deleteCategory.mutate(
                      { id: c.id },
                      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() }) },
                    )
                  }
                  className="text-destructive text-xs font-bold"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === "banners" && (
          <div className="space-y-4">
            <div className="bg-card p-4 rounded-xl border border-border space-y-2">
              <p className="font-bold text-sm">Add Banner</p>
              <input
                value={newBannerTitle}
                onChange={(e) => setNewBannerTitle(e.target.value)}
                placeholder="Title"
                className="w-full border border-border p-2 rounded-lg text-sm"
              />
              <input
                value={newBannerImage}
                onChange={(e) => setNewBannerImage(e.target.value)}
                placeholder="Image URL"
                className="w-full border border-border p-2 rounded-lg text-sm"
              />
              <input
                value={newBannerLink}
                onChange={(e) => setNewBannerLink(e.target.value)}
                placeholder="Link text (e.g. Shop Now)"
                className="w-full border border-border p-2 rounded-lg text-sm"
              />
              <button
                onClick={() => {
                  if (!newBannerTitle || !newBannerImage) return;
                  createBanner.mutate(
                    { data: { title: newBannerTitle, imageUrl: newBannerImage, linkText: newBannerLink || "Shop Now", active: true } },
                    {
                      onSuccess: () => {
                        setNewBannerTitle("");
                        setNewBannerImage("");
                        setNewBannerLink("");
                        queryClient.invalidateQueries({ queryKey: getListBannersQueryKey() });
                      },
                    },
                  );
                }}
                className="w-full bg-primary text-white py-2 rounded-lg font-bold text-sm"
              >
                Add
              </button>
            </div>
            {(banners ?? []).map((b) => (
              <div key={b.id} className="bg-card p-3 rounded-xl border border-border flex justify-between items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{b.title}</p>
                  <p className="text-xs text-muted-foreground">{b.active ? "Active" : "Inactive"}</p>
                </div>
                <button
                  onClick={() =>
                    updateBanner.mutate(
                      { id: b.id, data: { active: !b.active } },
                      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListBannersQueryKey() }) },
                    )
                  }
                  className="text-xs font-bold text-primary"
                >
                  {b.active ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() =>
                    deleteBanner.mutate(
                      { id: b.id },
                      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListBannersQueryKey() }) },
                    )
                  }
                  className="text-destructive text-xs font-bold"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === "products" && (
          <div className="space-y-4">
            <div className="bg-card p-4 rounded-xl border border-border space-y-2">
              <p className="font-bold text-sm">Add Product</p>
              <select
                value={newProduct.categoryId}
                onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })}
                className="w-full border border-border p-2 rounded-lg text-sm"
              >
                <option value="">Select category</option>
                {(categories ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                placeholder="Product name"
                className="w-full border border-border p-2 rounded-lg text-sm"
              />
              <input
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                placeholder="Description"
                className="w-full border border-border p-2 rounded-lg text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  placeholder="Price"
                  type="number"
                  className="border border-border p-2 rounded-lg text-sm"
                />
                <input
                  value={newProduct.mrp}
                  onChange={(e) => setNewProduct({ ...newProduct, mrp: e.target.value })}
                  placeholder="MRP"
                  type="number"
                  className="border border-border p-2 rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                  placeholder="Stock"
                  type="number"
                  className="border border-border p-2 rounded-lg text-sm"
                />
                <input
                  value={newProduct.unit}
                  onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                  placeholder="Unit (e.g. 1 kg)"
                  className="border border-border p-2 rounded-lg text-sm"
                />
              </div>
              <ImageUploadField
                value={newProduct.imageUrl}
                onChange={(dataUri) => setNewProduct({ ...newProduct, imageUrl: dataUri })}
              />
              <button
                onClick={() => {
                  if (!newProduct.categoryId || !newProduct.name || !newProduct.price || !newProduct.mrp || !newProduct.unit) {
                    alert("Please fill category, name, price, mrp, unit");
                    return;
                  }
                  createProduct.mutate(
                    {
                      data: {
                        categoryId: Number(newProduct.categoryId),
                        name: newProduct.name,
                        description: newProduct.description,
                        price: Number(newProduct.price),
                        mrp: Number(newProduct.mrp),
                        unit: newProduct.unit,
                        imageUrl: newProduct.imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600",
                        stock: Number(newProduct.stock || 0),
                        lowStockThreshold: Number(newProduct.lowStockThreshold || 10),
                        isBestSeller: false,
                        isNewArrival: true,
                      },
                    },
                    {
                      onSuccess: () => {
                        setNewProduct({
                          categoryId: "",
                          name: "",
                          description: "",
                          price: "",
                          mrp: "",
                          unit: "",
                          imageUrl: "",
                          stock: "",
                          lowStockThreshold: "10",
                        });
                        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
                        queryClient.invalidateQueries({ queryKey: getGetLowStockProductsQueryKey() });
                      },
                    },
                  );
                }}
                className="w-full bg-primary text-white py-2 rounded-lg font-bold text-sm"
              >
                Add Product
              </button>
            </div>

            {(products ?? []).map((p) =>
              editingProductId === p.id ? (
                <div key={p.id} className="bg-card p-4 rounded-xl border-2 border-primary space-y-2">
                  <p className="font-bold text-sm">Edit Product</p>
                  <select
                    value={editProduct.categoryId}
                    onChange={(e) => setEditProduct({ ...editProduct, categoryId: e.target.value })}
                    className="w-full border border-border p-2 rounded-lg text-sm"
                  >
                    <option value="">Select category</option>
                    {(categories ?? []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <input
                    value={editProduct.name}
                    onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                    placeholder="Product name"
                    className="w-full border border-border p-2 rounded-lg text-sm"
                  />
                  <input
                    value={editProduct.description}
                    onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })}
                    placeholder="Description"
                    className="w-full border border-border p-2 rounded-lg text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={editProduct.price}
                      onChange={(e) => setEditProduct({ ...editProduct, price: e.target.value })}
                      placeholder="Price"
                      type="number"
                      className="border border-border p-2 rounded-lg text-sm"
                    />
                    <input
                      value={editProduct.mrp}
                      onChange={(e) => setEditProduct({ ...editProduct, mrp: e.target.value })}
                      placeholder="MRP"
                      type="number"
                      className="border border-border p-2 rounded-lg text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={editProduct.stock}
                      onChange={(e) => setEditProduct({ ...editProduct, stock: e.target.value })}
                      placeholder="Stock"
                      type="number"
                      className="border border-border p-2 rounded-lg text-sm"
                    />
                    <input
                      value={editProduct.unit}
                      onChange={(e) => setEditProduct({ ...editProduct, unit: e.target.value })}
                      placeholder="Unit (e.g. 1 kg)"
                      className="border border-border p-2 rounded-lg text-sm"
                    />
                  </div>
                  <ImageUploadField
                    value={editProduct.imageUrl}
                    onChange={(dataUri) => setEditProduct({ ...editProduct, imageUrl: dataUri })}
                  />
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={saveEditProduct}
                      disabled={updateProduct.isPending}
                      className="flex-1 bg-primary text-white py-2 rounded-lg font-bold text-sm disabled:opacity-60"
                    >
                      {updateProduct.isPending ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      onClick={cancelEditProduct}
                      className="flex-1 bg-muted text-foreground py-2 rounded-lg font-bold text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div key={p.id} className="bg-card p-3 rounded-xl border border-border flex justify-between items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-muted/40 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-lg">🛍️</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">₹{p.price} • Stock: {p.stock}</p>
                  </div>
                  <button onClick={() => startEditProduct(p)} className="text-xs font-bold text-primary">
                    Edit
                  </button>
                  <button
                    onClick={() =>
                      deleteProduct.mutate(
                        { id: p.id },
                        { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() }) },
                      )
                    }
                    className="text-destructive text-xs font-bold"
                  >
                    Delete
                  </button>
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
