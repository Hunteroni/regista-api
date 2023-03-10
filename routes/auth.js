import { Router } from "express";
import { checkAuthorization, deleteAuthorization, putAuthorization } from "../controller/auth.js";

const router = Router()


router.put("/", putAuthorization)

router.delete("/", deleteAuthorization)

router.post("/", checkAuthorization)

export default router