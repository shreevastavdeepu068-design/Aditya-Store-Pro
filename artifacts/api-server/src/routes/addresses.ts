import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, addressesTable } from "@workspace/db";
import {
  CreateUserAddressBody,
  ListUserAddressesParams,
  CreateUserAddressParams,
  DeleteAddressParams,
  ListUserAddressesResponse,
  CreateUserAddressResponse,
} from "@workspace/api-zod";
import { serializeAddress } from "../lib/serialize";

const router: IRouter = Router();

router.get("/users/:id/addresses", async (req, res): Promise<void> => {
  const params = ListUserAddressesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const addresses = await db
    .select()
    .from(addressesTable)
    .where(eq(addressesTable.userId, params.data.id))
    .orderBy(addressesTable.id);
  res.json(ListUserAddressesResponse.parse(addresses.map(serializeAddress)));
});

router.post("/users/:id/addresses", async (req, res): Promise<void> => {
  const params = CreateUserAddressParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateUserAddressBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { lat, lng, ...rest } = parsed.data;
  const [address] = await db
    .insert(addressesTable)
    .values({
      ...rest,
      userId: params.data.id,
      lat: lat != null ? String(lat) : undefined,
      lng: lng != null ? String(lng) : undefined,
    })
    .returning();
  res.status(201).json(CreateUserAddressResponse.parse(serializeAddress(address)));
});

router.delete("/addresses/:id", async (req, res): Promise<void> => {
  const params = DeleteAddressParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [address] = await db
    .delete(addressesTable)
    .where(eq(addressesTable.id, params.data.id))
    .returning();
  if (!address) {
    res.status(404).json({ error: "Address not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
