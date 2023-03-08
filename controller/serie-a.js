import axios from "axios"


const currSeason = () => {
    const date = new Date()
    const year = date.getFullYear()
    if (date.getMonth() > 6) {
        return `${year}-${(year + 1).toString().slice(-2)}`
    }
    else {
        return `${year - 1}-${year.toString().slice(-2)}`
    }
}

export const getResults = async (req, res) => {
    try {
        const genericData = await axios.get(`https://www.legaseriea.it/api/stats/live/match?extra_link&order=oldest&lang=it&match_day_id=${req.params.id}`)
        const resp = genericData.data.data.map(v => {
            const splittedHomeSlug = v.home_team_url.split("/")
            const splittedAwaySlug = v.away_team_url.split("/")
            const homeSlug = splittedHomeSlug[splittedHomeSlug.length - 1];
            const awaySlug = splittedAwaySlug[splittedAwaySlug.length - 1];
            return ({
                match_id: v.match_id,
                slug: `${homeSlug}-${awaySlug}-${v.match_id}`,
                date: v.date_time,
                match_day_title: v.match_day_title,
                minutes_played: v.minutes_played,
                live_timing: v.live_timing,
                match_status: v.match_status,
                home_coach_image: v.home_coach_image,
                home_coach_name: v.home_coach_name,
                home_coach_surname: v.home_coach_surname,
                home_team_name: v.home_team_name,
                home_slug: v.home_netco_id,
                home_schema: v.home_schema,
                home_goal: v.home_goal,
                away_coach_image: v.away_coach_image,
                away_coach_name: v.away_coach_name,
                away_coach_surname: v.away_coach_surname,
                away_team_name: v.away_team_name,
                away_slug: v.away_netco_id,
                away_schema: v.away_schema,
                away_goal: v.away_goal,
            })
        })
        return res.send({ status: true, data: resp })
    }
    catch (err) {
        res.status(502)
        return res.send({ status: false })
    }

}

export const getDays = async (req, res) => {
    try {
        const { data } = await axios.get(`https://www.legaseriea.it/api/season/150052/championship/A/matchday?lang=${req.query.lang ? req.query.lang : "en"}`)
        console.log(data)
        const response = data.data.map(v => ({ title: v.title, match_id: v.id_category, status: v.category_status == "TO BE PLAYED" ? false : true }))
        return res.send({ status: true, data: response })
    }
    catch (err) {
        res.status(502)
        return res.send({ status: false })
    }

}

export const getStandings = async (req, res) => {
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

}

export const getPlayers = async (req, res) => {
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
}

export const getFormations = async (req, res) => {
    const slug = req.params.slug
    const { data } = await axios.get(`https://www.legaseriea.it/_next/data/zpYkqIDO-tq8Gq2eH4EHc/it/match/${slug}/formazione.json?slug=match&slug=${slug}&slug=formazione`)
    const startingObject = data.pageProps.page.body
    const desiredMatchInfos = startingObject.findIndex((v) => v.name == "LineUp")


    const local_formation = startingObject[desiredMatchInfos].body.local_formations.map(v => {
        let role
        switch (v.CODRUOLO) {
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
        return ({
            name: v.Nome,
            surname: v.Cognome,
            number: v.NUMEROMAGLIA,
            role: role,
            reserve: v.Riserva,
            entered: v.Enrato,
            left: v.Uscito,
            picture: v.player_medium_shot

        })
    })
    const visitor_formation = startingObject[desiredMatchInfos].body.visitor_formations.map(v => {
        let role
        switch (v.CODRUOLO) {
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
        return ({
            name: v.Nome,
            surname: v.Cognome,
            number: v.NUMEROMAGLIA,
            role: role,
            reserve: v.Riserva,
            entered: v.Enrato,
            left: v.Uscito,
            picture: v.player_medium_shot

        })
    })
    res.send({
        status: true,
        home: local_formation,
        away: visitor_formation
    })
}