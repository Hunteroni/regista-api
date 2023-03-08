import { Router } from "express";
import { getDays, getFormations, getPlayers, getResults, getStandings } from "../controller/serie-a.js";

const router = Router()

router.get("/results/:id", getResults)

router.get("/days", getDays)

router.get("/standings", getStandings)

router.get("/players/:slug", getPlayers)

router.get("/formations/:slug", getFormations)

export default router