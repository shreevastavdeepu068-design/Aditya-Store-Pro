import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, reviewsTable, productsTable } from "@workspace/db";
import {
  CreateProductReviewBody,
  ListProductReviewsParams,
  CreateProductReviewParams,
  ListProductReviewsResponse,
  CreateProductReviewResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/products/:id/reviews", async (req, res): Promise<void> => {
  const params = ListProductReviewsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const reviews = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.productId, params.data.id))
    .orderBy(reviewsTable.createdAt);
  res.json(ListProductReviewsResponse.parse(reviews));
});

router.post("/products/:id/reviews", async (req, res): Promise<void> => {
  const params = CreateProductReviewParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateProductReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, params.data.id));
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const [review] = await db
    .insert(reviewsTable)
    .values({ ...parsed.data, productId: params.data.id })
    .returning();

  const newReviewCount = product.reviewCount + 1;
  const newRating =
    (parseFloat(product.rating) * product.reviewCount + parsed.data.rating) / newReviewCount;

  await db
    .update(productsTable)
    .set({ reviewCount: newReviewCount, rating: newRating.toFixed(1) })
    .where(eq(productsTable.id, params.data.id));

  res.status(201).json(CreateProductReviewResponse.parse(review));
});

export default router;
