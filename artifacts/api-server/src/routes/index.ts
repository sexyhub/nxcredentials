import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import credentialsRouter from "./credentials";
import tagsRouter from "./tags";
import spacesRouter from "./spaces";
import statsRouter from "./stats";
import settingsRouter from "./settings";
import vaultRouter from "./vault";
import serviceTypesRouter from "./service-types";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(credentialsRouter);
router.use(tagsRouter);
router.use(spacesRouter);
router.use(statsRouter);
router.use(settingsRouter);
router.use(vaultRouter);
router.use(serviceTypesRouter);

export default router;
