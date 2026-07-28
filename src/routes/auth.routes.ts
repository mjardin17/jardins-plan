import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.ts";
import { rateLimiter } from "../middleware/auth.middleware.ts";

const router = Router();

router.get("/me", AuthController.getMe);
router.post("/login", rateLimiter(10, 60000), AuthController.login);
router.post("/logout", AuthController.logout);

export default router;
