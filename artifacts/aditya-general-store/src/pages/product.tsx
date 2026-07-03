import { useState } from "react";
import { PageLayout } from "@/components/layout";
import { useParams } from "wouter";
import { useGetProduct } from "@workspace/api-client-react";
import { useCart } from "@/hooks/use-cart";
import { Check } from "lucide-react";

export default function ProductPage() {
  const { id } = useParams();
  const { data: product, isLoading } = useGetProduct(Number(id));
  const addItem = useCart((s) => s.addItem);
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      imageUrl: product.imageUrl ?? undefined,
      unit: product.unit,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="p-4 flex flex-col items-center justify-center min-h-[50vh] space-y-4 animate-pulse">
          <div className="w-full aspect-square bg-muted rounded-2xl"></div>
          <div className="w-3/4 h-6 bg-muted rounded"></div>
          <div className="w-1/2 h-4 bg-muted rounded"></div>
        </div>
      </PageLayout>
    );
  }

  if (!product) {
    return (
      <PageLayout>
        <div className="p-4 text-center mt-20">Product not found.</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="pb-24 bg-white min-h-[100dvh]">
        <div className="w-full aspect-square bg-muted/30 p-8 flex items-center justify-center relative">
           {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" />
            ) : (
              <div className="text-6xl">🛍️</div>
            )}
        </div>
        <div className="p-4">
          <h1 className="text-2xl font-bold text-foreground leading-tight mb-2">{product.name}</h1>
          <p className="text-sm text-muted-foreground mb-4">{product.unit}</p>
          
          <div className="flex items-end gap-2 mb-6">
            <span className="text-3xl font-bold text-primary">₹{product.price}</span>
            {product.mrp > product.price && (
              <span className="text-sm text-muted-foreground line-through mb-1">₹{product.mrp}</span>
            )}
          </div>

          <p className="text-sm text-foreground/80 leading-relaxed mb-8">{product.description || "Fresh and high quality local product from Aditya General Store."}</p>

          <button
            onClick={handleAddToCart}
            className="w-full bg-primary text-white font-bold text-lg py-4 rounded-xl shadow-lg hover:bg-primary/90 active:scale-95 transition-all mb-4 flex items-center justify-center gap-2"
          >
            {added ? (
              <>
                <Check size={20} /> Added to Cart
              </>
            ) : (
              "Add to Cart"
            )}
          </button>
        </div>
      </div>
    </PageLayout>
  );
}
