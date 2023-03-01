import express from "express"
import bodyParser from "body-parser";
import fs from "fs"
import cors from "cors"
import axios from "axios";
import currSeason from "./functions/serie-a/currSeason.js";

const app = express()
app.use(cors())
app.use(bodyParser.json())
app.get('/results/:id', async (req, res) => {
    const { data } = await axios.get(`https://www.legaseriea.it/api/stats/live/match?extra_link&order=oldest&lang=it&match_day_id=${req.params.id}`)
    res.send(data)
});
app.get("/days", async (req, res) => {
    const { data } = await axios.get(`https://www.legaseriea.it/api/season/150052/championship/A/matchday?lang=${req.query.lang ? req.query.lang : "en"}`)
    const response = data.data.map(v => ({ title: v.title, id_category: v.id_category }))
    res.send({ status: true, error: [], data: response })
})
app.get("/standings", async (req, res) => {
    const seasonYear = currSeason()
    try {
        const { data } = await axios.get(`https://www.legaseriea.it/api/stats/live/Classificacompleta?CAMPIONATO=A&STAGIONE=${seasonYear}&TURNO=UNICO&GIRONE=UNI`)
        const response = data.data.map(v => ({
            name: v.Nome,
            completeName: v.NomeCompleto,
            abbreviation: v.NomeSintetico,
            slug: v.CODSQUADRA,
            draw: v.Pareggiate,
            drawHome: v.PareggiateCasa,
            drawAway: v.PareggiateFuori,
            lost: v.Perse,
            lostHome: v.PerseCasa,
            lostAway: v.PerseFuori,
            won: v.Vinte,
            wonHome: v.VinteCasa,
            wonAway: v.VinteFuori,
            position: v.PosCls,
            points: v.PuntiCls,
            pointsHome: v.PuntiClsCasa,
            pointsAway: v.PuntiClsFuori,
            goalsFor: v.RETIFATTE,
            goalsForHome: v.RetiFatteCasa,
            goalsForAway: v.RetiFatteFuori,
            goalsAgainst: v.RETISUBITE,
            goalsAgainstHome: v.RetiFatteCasa,
            goalsAgainstAway: v.RetiFatteFuori,

        }))
        return res.send({ status: true, data: response })
    }
    catch (err) {
        res.status(502)
        return res.send({ status: false })
    }

})
app.get("/players/:slug", async (req, res) => {

    try {
        const { data } = await axios.get(`https://www.legaseriea.it/api/team/${req.params.slug}/players`)
        const response = [];
        for (const key in data.data) {
            let role
            switch (key) {
                case "A":
                    role = "F"
                    break;
                case "C":
                    role = "M"
                    break;
                case "D":
                    role = "D"
                    break;
                case "P":
                    role = "GK"
                    break;
            }
            data.data[key].forEach(v => { response.push({ name: v.name, surname: v.surname, birthday: v.birth_day, image: v.head_shot, nationality: v.nationality, role: role, teamName: v.team_name, teamLogo: v.team_logo }) })
        }
        res.send({ status: true, data: response })
    }
    catch (err) {
        res.status(502)
        return res.send({ status: false })
    }

})


app.listen(5000)