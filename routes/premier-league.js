import { Router } from "express";
import { getDays, getResults, updateLogos, getPlayers, getStandings } from "../controller/premier-league.js";
const router = Router()


router.get("/days", getDays)

router.get("/results/:id", getResults)

router.patch("/logos", updateLogos)

router.get("/players/:id", getPlayers)

router.get("/standings", getStandings)

export default router