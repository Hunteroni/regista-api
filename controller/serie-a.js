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

function capitalizeName(name) {
    // Convert the name to all lowercase
    const lowerCaseName = name.toLowerCase();

    // Get the first character of the name and capitalize it
    const firstChar = lowerCaseName.charAt(0).toUpperCase();

    // Get the rest of the characters in the name
    const restOfName = lowerCaseName.slice(1);

    // Combine the first character and the rest of the name
    const capitalized = firstChar + restOfName;

    return capitalized;
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
                slug_id: `${homeSlug}-${awaySlug}-${v.match_id}`,
                date: v.date_time,
                minutes_played: v.minutes_played,
                live_timing: v.live_timing,
                match_status: v.match_status,
                home_team_name: v.home_team_name,
                home_team_logo: v.home_team_logo,
                home_team_abbr: v.home_team_short_name,
                home_team_id: v.home_netco_id,
                home_schema: v.home_schema,
                home_goal: v.home_goal,
                away_team_name: v.away_team_name,
                away_team_logo: v.away_team_logo,
                away_team_abbr: v.away_team_short_name,
                away_team_id: v.away_netco_id,
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
        const response = data.data.map(v => ({ title: v.title, match_day_id: v.id_category, played: v.category_status == "TO BE PLAYED" ? false : true }))
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
            data.data[key].forEach(v => { response.push({ name: capitalizeName(v.name), surname: capitalizeName(v.surname), image: v.head_shot, nationality: v.nationality, role: role }) })
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