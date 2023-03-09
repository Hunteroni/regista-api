import { Router } from "express";
import { getDays, getResults, updateLogos } from "../controller/premier-league.js";
const router = Router()


router.get("/days", getDays)

router.get("/results/:id", getResults)

router.patch("/logos", updateLogos)

export default router