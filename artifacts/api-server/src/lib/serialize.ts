import type { Product } from "@workspace/db";
import type { Coupon } from "@workspace/db";
import type { Order } from "@workspace/db";
import type { User } from "@workspace/db";
import type { Address } from "@workspace/db";

export function serializeProduct(product: Product) {
  return {
    ...product,
    price: parseFloat(product.price),
    mrp: parseFloat(product.mrp),
    rating: parseFloat(product.rating),
  };
}

export function serializeCoupon(coupon: Coupon) {
  return {
    ...coupon,
    value: parseFloat(coupon.value),
  };
}

export function serializeOrder(order: Order) {
  return {
    ...order,
    subtotal: parseFloat(order.subtotal),
    discount: parseFloat(order.discount),
    deliveryCharge: parseFloat(order.deliveryCharge),
    total: parseFloat(order.total),
  };
}

export function serializeUser(user: User) {
  return {
    ...user,
    walletBalance: parseFloat(user.walletBalance),
  };
}

export function serializeAddress(address: Address) {
  return {
    ...address,
    lat: address.lat != null ? parseFloat(address.lat) : null,
    lng: address.lng != null ? parseFloat(address.lng) : null,
  };
}
