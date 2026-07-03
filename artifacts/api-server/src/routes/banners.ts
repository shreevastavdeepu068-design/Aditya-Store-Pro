import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, bannersTable } from "@workspace/db";
import {
  CreateBannerBody,
  UpdateBannerBody,
  UpdateBannerParams,
  DeleteBannerParams,
  ListBannersResponse,
  CreateBannerResponse,
  UpdateBannerResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/require-admin";

const router: IRouter = Router();

router.get("/banners", async (_req, res): Promise<void> => {
  const banners = await db.select().from(bannersTable).orderBy(bannersTable.id);
  res.json(ListBannersResponse.parse(banners));
});

router.post("/banners", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateBannerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [banner] = await db.insert(bannersTable).values(parsed.data).returning();
  res.status(201).json(CreateBannerResponse.parse(banner));
});

router.patch("/banners/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateBannerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateBannerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [banner] = await db
    .update(bannersTable)
    .set(parsed.data)
    .where(eq(bannersTable.id, params.data.id))
    .returning();
  if (!banner) {
    res.status(404).json({ error: "Banner not found" });
    return;
  }
  res.json(UpdateBannerResponse.parse(banner));
});

router.delete("/banners/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteBannerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [banner] = await db
    .delete(bannersTable)
    .where(eq(bannersTable.id, params.data.id))
    .returning();
  if (!banner) {
    res.status(404).json({ error: "Banner not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
