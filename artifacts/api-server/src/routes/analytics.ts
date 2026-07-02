import { Router, type IRouter } from "express";
import { db, ordersTable, productsTable } from "@workspace/db";
import {
  GetAnalyticsSummaryResponse,
  GetRevenueSeriesResponse,
  GetLowStockProductsResponse,
} from "@workspace/api-zod";
import { serializeProduct } from "../lib/serialize";

const router: IRouter = Router();

router.get("/analytics/summary", async (_req, res): Promise<void> => {
  const orders = await db.select().from(ordersTable);
  const products = await db.select().from(productsTable);

  const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
  const activeOrderCount = orders.filter((order) => order.status !== "delivered").length;
  const lowStockCount = products.filter((product) => product.stock <= product.lowStockThreshold).length;

  res.json(
    GetAnalyticsSummaryResponse.parse({
      totalRevenue,
      activeOrderCount,
      totalOrders: orders.length,
      totalProducts: products.length,
      lowStockCount,
    }),
  );
});

router.get("/analytics/revenue-series", async (_req, res): Promise<void> => {
  const orders = await db.select().from(ordersTable);
  const days: { date: string; revenue: number; orders: number }[] = [];
  const now = new Date();

  for (let i = 13; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    const dateStr = day.toISOString().slice(0, 10);
    const dayOrders = orders.filter((order) => order.createdAt.toISOString().slice(0, 10) === dateStr);
    days.push({
      date: dateStr,
      revenue: dayOrders.reduce((sum, order) => sum + parseFloat(order.total), 0),
      orders: dayOrders.length,
    });
  }

  res.json(GetRevenueSeriesResponse.parse(days));
});

router.get("/analytics/low-stock", async (_req, res): Promise<void> => {
  const products = await db.select().from(productsTable);
  const lowStock = products.filter((product) => product.stock <= product.lowStockThreshold);
  res.json(GetLowStockProductsResponse.parse(lowStock.map(serializeProduct)));
});

export default router;
