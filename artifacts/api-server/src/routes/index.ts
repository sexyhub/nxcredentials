import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import credentialsRouter from "./credentials";
import categoriesRouter from "./categories";
import statsRouter from "./stats";
import settingsRouter from "./settings";
import vaultRouter from "./vault";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(credentialsRouter);
router.use(categoriesRouter);
router.use(statsRouter);
router.use(settingsRouter);
router.use(vaultRouter);

export default router;
