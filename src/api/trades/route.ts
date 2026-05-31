import { Router } from "express";
import * as repo from "./repo.js";

const router = Router();

router.get("/", repo.GET);

export default router;
