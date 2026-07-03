import { Router, type IRouter } from "express";
import { verifyPin, issueAdminToken } from "../lib/admin-auth";

const router: IRouter = Router();

router.post("/admin/verify-pin", (req, res): void => {
  const pin = req.body?.pin;
  if (typeof pin !== "string" || pin.length === 0) {
    res.status(400).json({ error: "pin is required" });
    return;
  }

  if (!verifyPin(pin)) {
    res.status(401).json({ valid: false });
    return;
  }

  res.json({ valid: true, token: issueAdminToken() });
});

export default router;
