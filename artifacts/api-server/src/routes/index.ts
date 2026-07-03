import { Router, type IRouter } from "express";
import healthRouter from "./health";
import categoriesRouter from "./categories";
import productsRouter from "./products";
import reviewsRouter from "./reviews";
import usersRouter from "./users";
import addressesRouter from "./addresses";
import ordersRouter from "./orders";
import couponsRouter from "./coupons";
import bannersRouter from "./banners";
import analyticsRouter from "./analytics";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(adminRouter);
router.use(categoriesRouter);
router.use(productsRouter);
router.use(reviewsRouter);
router.use(usersRouter);
router.use(addressesRouter);
router.use(ordersRouter);
router.use(couponsRouter);
router.use(bannersRouter);
router.use(analyticsRouter);

export default router;
