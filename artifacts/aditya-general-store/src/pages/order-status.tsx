import { PageLayout } from "@/components/layout";
import { useParams, Link } from "wouter";
import { useGetOrder, getGetOrderQueryKey } from "@workspace/api-client-react";

const STEPS: { key: string; label: string; icon: string }[] = [
  { key: "pending", label: "Order Placed", icon: "🛒" },
  { key: "accepted", label: "Accepted", icon: "✅" },
  { key: "packed", label: "Packed", icon: "📦" },
  { key: "out_for_delivery", label: "Out for Delivery", icon: "🛵" },
  { key: "delivered", label: "Delivered", icon: "🏠" },
];

export default function OrderStatus() {
  const { id } = useParams();
  const orderId = Number(id);
  const { data: order, isLoading } = useGetOrder(orderId, {
    query: { enabled: !Number.isNaN(orderId), refetchInterval: 5000, queryKey: getGetOrderQueryKey(orderId) },
  });

  if (isLoading || !order) {
    return (
      <PageLayout>
        <div className="p-4 pb-24">
          <div className="animate-pulse h-40 bg-muted rounded-xl" />
        </div>
      </PageLayout>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === order.status);
  const whatsappMessage = encodeURIComponent(
    `Hi, I have a question about my order #${order.id} from Aditya General Store (Total: ₹${order.total}).`,
  );

  return (
    <PageLayout>
      <div className="p-4 pb-24 space-y-6">
        <h1 className="text-2xl font-bold">Order #{order.id}</h1>

        <div className="bg-card border border-border rounded-xl p-4">
          <ol className="space-y-4">
            {STEPS.map((step, idx) => {
              const done = idx <= currentIndex;
              return (
                <li key={step.key} className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0 ${
                      done ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step.icon}
                  </div>
                  <div>
                    <p className={`font-semibold text-sm ${done ? "text-foreground" : "text-muted-foreground"}`}>
                      {step.label}
                    </p>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 ${idx < currentIndex ? "bg-primary" : "bg-muted"}`} />
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        {order.status === "out_for_delivery" && (
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Give this OTP to the delivery partner</p>
            <p className="text-3xl font-bold tracking-widest text-primary">{order.deliveryOtp}</p>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <h2 className="font-bold">Order Summary</h2>
          {order.items.map((item) => (
            <div key={item.productId} className="flex justify-between text-sm">
              <span>
                {item.name} x{item.quantity}
              </span>
              <span>₹{item.lineTotal}</span>
            </div>
          ))}
          <div className="border-t border-border pt-2 flex justify-between font-bold">
            <span>Total</span>
            <span>₹{order.total}</span>
          </div>
          <p className="text-xs text-muted-foreground pt-1">Delivering to: {order.addressLine}</p>
        </div>

        <div className="flex gap-2">
          <a
            href={`https://wa.me/919548924542?text=${whatsappMessage}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 bg-[#25D366] text-white font-bold py-3 rounded-xl text-center flex items-center justify-center gap-2"
          >
            💬 Chat on WhatsApp
          </a>
          <a
            href={`/api/orders/${order.id}/invoice`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 bg-secondary/10 text-secondary font-bold py-3 rounded-xl text-center"
          >
            🧾 Download Invoice
          </a>
        </div>

        <Link href="/">
          <button className="w-full text-sm text-muted-foreground font-semibold py-2">Continue Shopping</button>
        </Link>
      </div>
    </PageLayout>
  );
}
