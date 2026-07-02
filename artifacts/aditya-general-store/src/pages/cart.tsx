import { useState } from "react";
import { PageLayout } from "@/components/layout";
import { useCart } from "@/hooks/use-cart";
import { useValidateCoupon } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Trash2 } from "lucide-react";
import type { CartItem } from "@/hooks/use-cart";

export default function Cart() {
  const { items, updateQuantity, removeItem, getSubtotal } = useCart();
  const [, setLocation] = useLocation();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const validateCoupon = useValidateCoupon();

  const subtotal = getSubtotal();
  const deliveryCharge = subtotal > 500 ? 0 : 40;

  // Calculate quantity based 10% discount
  const quantityDiscount = items.reduce((acc: number, item: CartItem) => {
    if (item.quantity >= 10) {
      return acc + (item.price * item.quantity * 0.1);
    }
    return acc;
  }, 0);

  const total = subtotal - quantityDiscount - discount + deliveryCharge;

  const handleValidateCoupon = () => {
    if (!couponCode) return;
    validateCoupon.mutate(
      { data: { code: couponCode, subtotal } },
      {
        onSuccess: (result) => {
          if (result.valid) {
            setDiscount(result.discount);
            setAppliedCode(couponCode.toUpperCase());
            alert(`Coupon applied! ${result.message ?? ""}`);
          } else {
            setDiscount(0);
            setAppliedCode("");
            alert(result.message ?? "Invalid coupon code.");
          }
        },
        onError: () => {
          setDiscount(0);
          setAppliedCode("");
          alert("Could not validate coupon. Please try again.");
        },
      },
    );
  };

  if (items.length === 0) {
    return (
      <PageLayout>
        <div className="p-4 flex flex-col items-center justify-center min-h-[70vh]">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-xl font-bold text-foreground">Your cart is empty</h2>
          <p className="text-muted-foreground mb-8 text-center mt-2">Add items to start shopping for your daily needs.</p>
          <Link href="/">
            <button className="bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg">Browse Products</button>
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="p-4 pb-32">
        <h1 className="text-2xl font-bold mb-6">Your Cart</h1>
        
        <div className="space-y-4 mb-8">
          {items.map((item: CartItem) => (
            <div key={item.productId} className="flex bg-card p-3 rounded-xl shadow-sm border border-border gap-4 items-center relative">
              <div className="w-20 h-20 bg-muted/30 rounded-lg flex items-center justify-center">
                {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" /> : "🛍️"}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm leading-tight mb-1">{item.name}</h3>
                <p className="text-xs text-muted-foreground mb-2">{item.unit}</p>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-primary">₹{item.price}</span>
                  <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-2 py-1">
                    <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center font-bold text-lg">-</button>
                    <span className="font-bold text-sm min-w-[20px] text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center font-bold text-lg">+</button>
                  </div>
                </div>
              </div>
              {item.quantity >= 10 && (
                <div className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                  10% OFF applied
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-card p-4 rounded-xl border border-border shadow-sm mb-6">
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Coupon Code" 
              className="flex-1 bg-background border border-border rounded-lg px-3 text-sm outline-none focus:border-primary"
              value={couponCode}
              onChange={e => setCouponCode(e.target.value)}
            />
            <button onClick={handleValidateCoupon} className="bg-secondary text-white px-4 py-2 rounded-lg text-sm font-bold">Apply</button>
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border shadow-sm space-y-3 mb-8">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">₹{subtotal.toFixed(2)}</span>
          </div>
          {quantityDiscount > 0 && (
            <div className="flex justify-between text-sm text-accent">
              <span>Bulk Discount (10%)</span>
              <span className="font-medium">-₹{quantityDiscount.toFixed(2)}</span>
            </div>
          )}
          {discount > 0 && (
            <div className="flex justify-between text-sm text-primary">
              <span>Coupon Discount {appliedCode && `(${appliedCode})`}</span>
              <span className="font-medium">-₹{discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Delivery Charge</span>
            <span className="font-medium">{deliveryCharge === 0 ? <span className="text-green-600 font-bold">FREE</span> : `₹${deliveryCharge}`}</span>
          </div>
          <div className="border-t border-border pt-3 flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-primary">₹{total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 p-4 bg-background border-t border-border shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-40 max-w-md mx-auto">
        <button 
          onClick={() => setLocation("/checkout")}
          className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg relative overflow-hidden ripple-container"
        >
          Checkout • ₹{total.toFixed(2)}
        </button>
      </div>
    </PageLayout>
  );
}
