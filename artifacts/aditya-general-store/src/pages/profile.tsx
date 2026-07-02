import { useState } from "react";
import { useLocation } from "wouter";
import { PageLayout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import type { CartItem } from "@/hooks/use-cart";
import {
  useCreateUser,
  useGetUser,
  getGetUserQueryKey,
  useListUserAddresses,
  getListUserAddressesQueryKey,
  useCreateUserAddress,
  useDeleteAddress,
  useListUserOrders,
  getListUserOrdersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const statusLabels: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  packed: "Packed",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
};

export default function Profile() {
  const { userId, setUserId, logout } = useAuth();
  const { addItem, clearCart } = useCart();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const isLoggedIn = userId !== 1;

  const [step, setStep] = useState<"choose" | "phone" | "otp">("choose");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [sentOtp, setSentOtp] = useState("");

  const createUser = useCreateUser();

  const { data: user } = useGetUser(userId, {
    query: { enabled: isLoggedIn, queryKey: getGetUserQueryKey(userId) },
  });
  const { data: addresses } = useListUserAddresses(userId, {
    query: { enabled: isLoggedIn, queryKey: getListUserAddressesQueryKey(userId) },
  });
  const { data: orders } = useListUserOrders(userId, {
    query: { enabled: isLoggedIn, queryKey: getListUserOrdersQueryKey(userId) },
  });
  const createAddress = useCreateUserAddress();
  const deleteAddress = useDeleteAddress();

  const [newAddress, setNewAddress] = useState({ label: "", line1: "", city: "Kasganj", pincode: "" });

  const handleSendOtp = () => {
    if (phone.length !== 10) return alert("Enter a valid 10-digit phone number");
    const code = String(Math.floor(1000 + Math.random() * 9000));
    setSentOtp(code);
    setStep("otp");
    alert(`Mock OTP sent to +91 ${phone}: ${code}\n(Real SMS not available in this demo)`);
  };

  const handleVerifyOtp = () => {
    if (otp !== sentOtp) return alert("Incorrect OTP");
    createUser.mutate(
      { data: { name: name || "Guest", phone } },
      {
        onSuccess: (u) => {
          setUserId(u.id);
          setStep("choose");
        },
      },
    );
  };

  const handleGoogleLogin = () => {
    const mockPhone = String(9000000000 + Math.floor(Math.random() * 99999999));
    createUser.mutate(
      { data: { name: "Google User", phone: mockPhone } },
      {
        onSuccess: (u) => {
          setUserId(u.id);
          alert("Signed in with Google (simulated — real Google login is unavailable in this demo).");
        },
      },
    );
  };

  const handleReorder = (order: NonNullable<typeof orders>[number]) => {
    clearCart();
    order.items.forEach((item) =>
      addItem({
        productId: item.productId,
        name: item.name,
        price: item.unitPrice,
        quantity: item.quantity,
        unit: "",
      } as CartItem),
    );
    setLocation("/cart");
  };

  if (!isLoggedIn) {
    return (
      <PageLayout>
        <div className="p-4 pb-24">
          <h1 className="text-2xl font-bold mb-6">Profile</h1>

          {step === "choose" && (
            <div className="space-y-3">
              <button
                onClick={handleGoogleLogin}
                className="w-full bg-white border-2 border-border py-3 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <span className="text-lg">🅖</span> Continue with Google
              </button>
              <button
                onClick={() => setStep("phone")}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                📱 Continue with Phone
              </button>
              <p className="text-[11px] text-muted-foreground text-center pt-2">
                Login is simulated for this demo — no real Google or SMS provider is used.
              </p>
            </div>
          )}

          {step === "phone" && (
            <div className="space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full border border-border p-3 rounded-xl"
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10-digit mobile number"
                className="w-full border border-border p-3 rounded-xl"
              />
              <button onClick={handleSendOtp} className="w-full bg-primary text-white py-3 rounded-xl font-bold">
                Send OTP
              </button>
              <button onClick={() => setStep("choose")} className="w-full text-sm text-muted-foreground">
                Back
              </button>
            </div>
          )}

          {step === "otp" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Enter the 4-digit OTP sent to +91 {phone}</p>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="OTP"
                className="w-full border border-border p-3 rounded-xl text-center text-2xl tracking-widest"
              />
              <button onClick={handleVerifyOtp} className="w-full bg-primary text-white py-3 rounded-xl font-bold">
                Verify & Continue
              </button>
            </div>
          )}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="p-4 pb-24 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{user?.name}</h1>
            <p className="text-sm text-muted-foreground">+91 {user?.phone}</p>
          </div>
          <button onClick={logout} className="text-sm font-bold text-destructive">
            Logout
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card p-4 rounded-xl border border-border">
            <p className="text-xs text-muted-foreground">Loyalty Points</p>
            <p className="text-xl font-bold text-primary">{user?.loyaltyPoints ?? 0}</p>
          </div>
          <div className="bg-card p-4 rounded-xl border border-border">
            <p className="text-xs text-muted-foreground">Wallet Balance</p>
            <p className="text-xl font-bold text-primary">₹{user?.walletBalance ?? 0}</p>
          </div>
        </div>

        <div>
          <h2 className="font-bold text-lg mb-2">Saved Addresses</h2>
          <div className="space-y-2 mb-3">
            {(addresses ?? []).map((addr) => (
              <div key={addr.id} className="bg-card p-3 rounded-xl border border-border flex justify-between items-center">
                <div>
                  <p className="font-semibold text-sm">{addr.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {addr.line1}, {addr.city} - {addr.pincode}
                  </p>
                </div>
                <button
                  onClick={() =>
                    deleteAddress.mutate(
                      { id: addr.id },
                      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListUserAddressesQueryKey(userId) }) },
                    )
                  }
                  className="text-destructive text-xs font-bold"
                >
                  Remove
                </button>
              </div>
            ))}
            {(addresses ?? []).length === 0 && <p className="text-sm text-muted-foreground">No saved addresses yet.</p>}
          </div>
          <div className="bg-card p-3 rounded-xl border border-border space-y-2">
            <input
              value={newAddress.label}
              onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
              placeholder="Label (e.g. Home)"
              className="w-full border border-border p-2 rounded-lg text-sm"
            />
            <input
              value={newAddress.line1}
              onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })}
              placeholder="Address line"
              className="w-full border border-border p-2 rounded-lg text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={newAddress.city}
                onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                placeholder="City"
                className="border border-border p-2 rounded-lg text-sm"
              />
              <input
                value={newAddress.pincode}
                onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                placeholder="Pincode"
                className="border border-border p-2 rounded-lg text-sm"
              />
            </div>
            <button
              onClick={() => {
                if (!newAddress.label || !newAddress.line1 || !newAddress.pincode) return;
                createAddress.mutate(
                  { id: userId, data: newAddress },
                  {
                    onSuccess: () => {
                      setNewAddress({ label: "", line1: "", city: "Kasganj", pincode: "" });
                      queryClient.invalidateQueries({ queryKey: getListUserAddressesQueryKey(userId) });
                    },
                  },
                );
              }}
              className="w-full bg-primary text-white py-2 rounded-lg font-bold text-sm"
            >
              Add Address
            </button>
          </div>
        </div>

        <div>
          <h2 className="font-bold text-lg mb-2">Order History</h2>
          <div className="space-y-3">
            {(orders ?? []).map((order) => (
              <div key={order.id} className="bg-card p-4 rounded-xl border border-border space-y-2">
                <div className="flex justify-between items-center">
                  <p className="font-bold text-sm">Order #{order.id}</p>
                  <span className="text-xs font-bold px-2 py-1 rounded-full bg-primary/10 text-primary">
                    {statusLabels[order.status] ?? order.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</p>
                <p className="text-sm font-semibold">₹{order.total}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setLocation(`/order-status/${order.id}`)}
                    className="flex-1 text-xs font-bold border border-border rounded-lg py-2"
                  >
                    Track Order
                  </button>
                  <button
                    onClick={() => handleReorder(order)}
                    className="flex-1 text-xs font-bold bg-primary text-white rounded-lg py-2"
                  >
                    Reorder
                  </button>
                </div>
              </div>
            ))}
            {(orders ?? []).length === 0 && <p className="text-sm text-muted-foreground">No orders yet.</p>}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
