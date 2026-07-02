import { Router, type IRouter } from "express";
import { eq, inArray } from "drizzle-orm";
import { db, ordersTable, productsTable, usersTable, orderStatusValues } from "@workspace/db";
import type { OrderItemRecord } from "@workspace/db";
import {
  CreateOrderBody,
  UpdateOrderStatusBody,
  ListUserOrdersParams,
  GetOrderParams,
  UpdateOrderStatusParams,
  ListUserOrdersResponse,
  CreateOrderResponse,
  GetOrderResponse,
  UpdateOrderStatusResponse,
} from "@workspace/api-zod";
import { serializeOrder } from "../lib/serialize";

const router: IRouter = Router();

const DELIVERY_CHARGE = 30;
const FREE_DELIVERY_THRESHOLD = 500;
const BULK_QUANTITY_THRESHOLD = 10;
const BULK_DISCOUNT_RATE = 0.1;

function generateOtp(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

router.get("/users/:id/orders", async (req, res): Promise<void> => {
  const params = ListUserOrdersParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.userId, params.data.id))
    .orderBy(ordersTable.createdAt);
  res.json(ListUserOrdersResponse.parse(orders.reverse().map(serializeOrder)));
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { userId, items, paymentMethod, couponCode, addressLine } = parsed.data;

  if (items.length === 0) {
    res.status(400).json({ error: "Order must contain at least one item" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const productIds = items.map((item) => item.productId);
  const products = await db.select().from(productsTable).where(inArray(productsTable.id, productIds));
  const productMap = new Map(products.map((product) => [product.id, product]));

  const orderItems: OrderItemRecord[] = [];
  let subtotal = 0;
  let bulkDiscount = 0;

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) {
      res.status(400).json({ error: `Product ${item.productId} not found` });
      return;
    }
    const unitPrice = parseFloat(product.price);
    let lineTotal = unitPrice * item.quantity;

    if (item.quantity >= BULK_QUANTITY_THRESHOLD) {
      bulkDiscount += lineTotal * BULK_DISCOUNT_RATE;
    }

    const buy2Get1Sets = Math.floor(item.quantity / 3);
    if (buy2Get1Sets > 0) {
      bulkDiscount += buy2Get1Sets * unitPrice;
    }

    orderItems.push({
      productId: product.id,
      name: product.name,
      quantity: item.quantity,
      unitPrice,
      lineTotal,
    });
    subtotal += lineTotal;
  }

  let discount = bulkDiscount;
  let couponMessage: string | undefined;
  if (couponCode) {
    const { couponsTable } = await import("@workspace/db");
    const [coupon] = await db
      .select()
      .from(couponsTable)
      .where(eq(couponsTable.code, couponCode.toUpperCase()));
    if (coupon && coupon.active) {
      const value = parseFloat(coupon.value);
      const couponDiscount = coupon.type === "percent" ? (subtotal * value) / 100 : value;
      discount += couponDiscount;
      couponMessage = coupon.code;
    }
  }

  if (user.isFirstOrder) {
    discount += subtotal * 0.05;
  }

  discount = Math.min(discount, subtotal);
  const afterDiscount = subtotal - discount;
  const deliveryCharge = afterDiscount >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
  const total = afterDiscount + deliveryCharge;
  const loyaltyPointsEarned = Math.floor(total / 10);

  const [order] = await db
    .insert(ordersTable)
    .values({
      userId,
      items: orderItems,
      subtotal: subtotal.toFixed(2),
      discount: discount.toFixed(2),
      deliveryCharge: deliveryCharge.toFixed(2),
      total: total.toFixed(2),
      paymentMethod,
      status: "pending",
      couponCode: couponMessage ?? null,
      deliveryOtp: generateOtp(),
      addressLine,
      loyaltyPointsEarned,
    })
    .returning();

  await db
    .update(usersTable)
    .set({
      isFirstOrder: false,
      loyaltyPoints: user.loyaltyPoints + loyaltyPointsEarned,
    })
    .where(eq(usersTable.id, userId));

  for (const item of orderItems) {
    const product = productMap.get(item.productId);
    if (product) {
      await db
        .update(productsTable)
        .set({ stock: Math.max(0, product.stock - item.quantity) })
        .where(eq(productsTable.id, item.productId));
    }
  }

  res.status(201).json(CreateOrderResponse.parse(serializeOrder(order)));
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, params.data.id));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(GetOrderResponse.parse(serializeOrder(order)));
});

router.get("/orders/:id/invoice", async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [rawOrder] = await db.select().from(ordersTable).where(eq(ordersTable.id, params.data.id));
  if (!rawOrder) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const order = serializeOrder(rawOrder);

  const items = order.items as OrderItemRecord[];
  const gstRate = 0.05;
  const taxableValue = order.subtotal - order.discount;
  const gstAmount = Math.round(taxableValue * gstRate * 100) / 100;

  const rowsHtml = items
    .map(
      (item) => `
      <tr>
        <td>${item.name}</td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:right">₹${item.unitPrice.toFixed(2)}</td>
        <td style="text-align:right">₹${item.lineTotal.toFixed(2)}</td>
      </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Invoice #${order.id} - Aditya General Store</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #222; max-width: 700px; margin: 24px auto; padding: 0 16px; }
  h1 { color: #e85d04; margin-bottom: 0; }
  .muted { color: #666; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th, td { border: 1px solid #ddd; padding: 8px; font-size: 13px; }
  th { background: #fdf1e6; text-align: left; }
  .totals { width: 260px; margin-left: auto; margin-top: 12px; }
  .totals div { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; }
  .totals .grand { font-weight: bold; font-size: 16px; border-top: 2px solid #222; padding-top: 8px; }
  .print-btn { margin: 16px 0; padding: 10px 20px; background: #e85d04; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; }
  @media print { .print-btn { display: none; } }
</style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
  <h1>Aditya General Store</h1>
  <p class="muted">Tajpur Road, Sidhpura, Kasganj &middot; GSTIN: 09ABCDE1234F1Z5</p>
  <hr />
  <p><strong>Tax Invoice</strong></p>
  <p class="muted">Invoice #: ${order.id} &nbsp;|&nbsp; Date: ${new Date(order.createdAt).toLocaleString("en-IN")}</p>
  <p class="muted">Billed To: ${order.addressLine}</p>
  <p class="muted">Payment Method: ${order.paymentMethod.toUpperCase()} &nbsp;|&nbsp; Status: ${order.status}</p>

  <table>
    <thead>
      <tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Line Total</th></tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>

  <div class="totals">
    <div><span>Subtotal</span><span>₹${order.subtotal.toFixed(2)}</span></div>
    <div><span>Discount</span><span>-₹${order.discount.toFixed(2)}</span></div>
    <div><span>Taxable Value</span><span>₹${taxableValue.toFixed(2)}</span></div>
    <div><span>GST (5%)</span><span>₹${gstAmount.toFixed(2)}</span></div>
    <div><span>Delivery Charge</span><span>₹${order.deliveryCharge.toFixed(2)}</span></div>
    <div class="grand"><span>Total Paid</span><span>₹${order.total.toFixed(2)}</span></div>
  </div>

  <p class="muted" style="margin-top: 32px;">This is a computer-generated invoice for demo purposes and does not represent a real GST filing.</p>
  <p class="muted">© 2026 Aditya General Store. All Rights Reserved.</p>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html");
  res.send(html);
});

router.patch("/orders/:id/status", async (req, res): Promise<void> => {
  const params = UpdateOrderStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, params.data.id));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const currentIndex = orderStatusValues.indexOf(order.status as (typeof orderStatusValues)[number]);
  const nextIndex = orderStatusValues.indexOf(parsed.data.status);

  if (nextIndex < currentIndex) {
    res.status(400).json({ error: "Cannot move order status backwards" });
    return;
  }

  if (parsed.data.status === "delivered") {
    if (parsed.data.deliveryOtp !== order.deliveryOtp) {
      res.status(400).json({ error: "Invalid delivery OTP" });
      return;
    }
  }

  const [updated] = await db
    .update(ordersTable)
    .set({ status: parsed.data.status })
    .where(eq(ordersTable.id, params.data.id))
    .returning();

  res.json(UpdateOrderStatusResponse.parse(serializeOrder(updated)));
});

export default router;
