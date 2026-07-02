import { PageLayout } from "@/components/layout";
import { useParams, Link } from "wouter";

export default function OrderSuccess() {
  const { id } = useParams();

  return (
    <PageLayout hideNav>
      <div className="min-h-screen bg-primary/10 flex flex-col items-center justify-center p-4">
        <div className="bg-card w-full max-w-sm p-8 rounded-3xl shadow-xl text-center border border-border">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">
            🎉
          </div>
          <h1 className="text-2xl font-bold mb-2 text-foreground">Order Placed!</h1>
          <p className="text-muted-foreground mb-6">Your order #{id} has been successfully placed. We'll deliver it soon.</p>
          
          <div className="space-y-3">
            <Link href={`/order-status/${id}`}>
              <button className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-sm hover:bg-primary/90">
                Track Order
              </button>
            </Link>
            <Link href="/">
              <button className="w-full bg-secondary/10 text-secondary font-bold py-3 rounded-xl shadow-sm hover:bg-secondary/20">
                Continue Shopping
              </button>
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
