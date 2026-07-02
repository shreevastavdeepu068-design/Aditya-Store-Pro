import { useState } from "react";
import { PageLayout } from "@/components/layout";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useCreateOrder } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import type { CartItem } from "@/hooks/use-cart";

export default function Checkout() {
  const { items, getSubtotal, clearCart } = useCart();
  const { userId } = useAuth();
  const [, setLocation] = useLocation();
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "upi" | "razorpay" | "phonepe" | "googlepay">("cod");

  const createOrder = useCreateOrder();

  const paymentOptions: { value: typeof paymentMethod; label: string; icon: string }[] = [
    { value: "razorpay", label: "Razorpay", icon: "💳" },
    { value: "phonepe", label: "PhonePe", icon: "📲" },
    { value: "googlepay", label: "Google Pay", icon: "🅖" },
    { value: "upi", label: "UPI", icon: "📱" },
    { value: "cod", label: "Cash on Delivery", icon: "💵" },
  ];

  const handlePlaceOrder = () => {
    if (!address) return alert("Please enter delivery address");
    
    createOrder.mutate({
      data: {
        userId,
        items: items.map((i: CartItem) => ({ productId: i.productId, quantity: i.quantity })),
        paymentMethod,
        addressLine: address
      }
    }, {
      onSuccess: (order) => {
        clearCart();
        setLocation(`/order-success/${order.id}`);
      }
    });
  };

  return (
    <PageLayout>
      <div className="p-4 pb-32">
        <h1 className="text-2xl font-bold mb-6">Checkout</h1>
        
        <div className="mb-6 space-y-2">
          <h2 className="font-bold text-lg">Delivery Address</h2>
          <textarea 
            value={address}
            onChange={e => setAddress(e.target.value)}
            className="w-full bg-card border border-border p-3 rounded-xl min-h-[100px] outline-none focus:border-primary"
            placeholder="Enter your full address (e.g. Near Post Office, Main Road...)"
          />
        </div>

        <div className="mb-8 space-y-3">
          <h2 className="font-bold text-lg">Payment Method</h2>

          {paymentOptions.map((opt) => (
            <div
              key={opt.value}
              onClick={() => setPaymentMethod(opt.value)}
              className={`p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between ${paymentMethod === opt.value ? "border-primary bg-primary/5" : "border-border bg-card"}`}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{opt.icon}</div>
                <span className="font-bold">{opt.label}</span>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === opt.value ? "border-primary" : "border-muted-foreground"}`}>
                {paymentMethod === opt.value && <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>}
              </div>
            </div>
          ))}
          <p className="text-[11px] text-muted-foreground text-center pt-1">
            Payments are simulated for this demo — no real transaction is made.
          </p>
        </div>

      </div>

      <div className="fixed bottom-16 left-0 right-0 p-4 bg-background border-t border-border shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-40 max-w-md mx-auto">
        <button 
          onClick={handlePlaceOrder}
          disabled={createOrder.isPending}
          className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-50"
        >
          {createOrder.isPending ? "Processing..." : "Place Order"}
        </button>
      </div>
    </PageLayout>
  );
}
