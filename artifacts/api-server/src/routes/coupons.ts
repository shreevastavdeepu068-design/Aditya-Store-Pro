import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, couponsTable } from "@workspace/db";
import {
  ValidateCouponBody,
  ListCouponsResponse,
  ValidateCouponResponse,
} from "@workspace/api-zod";
import { serializeCoupon } from "../lib/serialize";

const router: IRouter = Router();

router.get("/coupons", async (_req, res): Promise<void> => {
  const coupons = await db.select().from(couponsTable).where(eq(couponsTable.active, true));
  res.json(ListCouponsResponse.parse(coupons.map(serializeCoupon)));
});

router.post("/coupons/validate", async (req, res): Promise<void> => {
  const parsed = ValidateCouponBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { code, subtotal } = parsed.data;
  const [coupon] = await db
    .select()
    .from(couponsTable)
    .where(eq(couponsTable.code, code.toUpperCase()));

  if (!coupon || !coupon.active) {
    res.json(ValidateCouponResponse.parse({ valid: false, discount: 0, message: "Invalid or expired coupon code" }));
    return;
  }

  const value = parseFloat(coupon.value);
  const discount = coupon.type === "percent" ? Math.round((subtotal * value) / 100) : value;

  res.json(
    ValidateCouponResponse.parse({
      valid: true,
      discount: Math.min(discount, subtotal),
      message: coupon.description,
    }),
  );
});

export default router;
