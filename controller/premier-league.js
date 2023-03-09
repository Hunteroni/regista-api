import axios from "axios"
import * as cheerio from "cheerio"
import db from "../db/conn.js";

const instance = axios.create({
    headers: {
        Origin: 'https://www.premierleague.com',
    },
});

export default instance;

export const getDays = async (req, res) => {
    try {
        const { data } = await instance.get("https://www.premierleague.com/match/74911");
        const $ = cheerio.load(data);

        const dropdownList = $('ul.dropdownList');
        const matchweekList = dropdownList.find('li');

        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();

        const afterWinter = currentMonth <= 6 ? true : false

        const matchweeks = matchweekList.map((index, element) => {
            const title = $(element).find('.week').text().trim();
            const match_day_id = parseInt($(element).find('a').attr('href').match(/matchweek\/(\d+)\//)[1]);
            const matchWeekDays = $(element).find('time').text().trim();

            let played = true;


            const startDate = matchWeekDays.split(' - ')[0]
            const currentYear = currentDate.getFullYear()
            const fullDateString = `${startDate} ${currentYear}`;
            const date = new Date(fullDateString);
            if (afterWinter == 1 && date.getMonth() > 6) date.setFullYear(date.getFullYear() - 1)
            if (date > currentDate) {
                played = false;
            }

            return { title, match_day_id, played, };
        }).get();

        res.send({ status: true, data: matchweeks });
    } catch (error) {
        console.log(error);
        res.status(502).send({ status: false });
    }
};

const switchStatus = (phase) => {
    switch (phase) {
        case "F":
            return 2
            break;
        case "U":
            return 0
            break;
        default:
            return 1
            break;
    }
}

const scrapeTeamLogo = async (id) => {
    const { data } = await instance.get(`https://www.premierleague.com/clubs/${id}`)
    const $ = cheerio.load(data)
    const src = $(".clubBadgeFallback").attr("src")
    return src

}

const retrieveTeamLogo = async (id) => {
    try {
        const data = await new Promise((resolve, reject) => {
            db.get("SELECT * FROM pl_logos WHERE team_id = ?", [id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
        return data ? data.endpoint : null;
    } catch (error) {
        console.log(error);
        return null;
    }
}
export const getResults = async (req, res) => {
    try {
        const { id } = req.params
        const { data } = await instance.get(`https://footballapi.pulselive.com/football/fixtures?page=0&gameweeks=${id}`);
        const response = await Promise.all(data.content.map(async v => {
            const home_team_logo = await retrieveTeamLogo(v.teams[0].team.club.id)
            const away_team_logo = await retrieveTeamLogo(v.teams[1].team.club.id)

            return ({
                match_id: v.id,
                slug_id: v.id,
                date: new Date(v.provisionalKickoff.millis),
                minutes_played: v.clock.secs / 60,
                match_status: switchStatus(v.phase),
                home_team_name: v.teams[0].team.name,
                home_team_logo: home_team_logo,
                home_team_abbr: v.teams[0].team.club.abbr,
                home_team_id: v.teams[0].team.club.id,
                home_goal: v.teams[0].score,
                away_team_name: v.teams[1].team.name,
                away_team_logo: away_team_logo,
                away_team_abbr: v.teams[1].team.club.abbr,
                away_team_id: v.teams[1].team.club.id,
                away_goal: v.teams[1].score
            })
        }))
        res.send(response)
    } catch (error) {
        res.status(502).send({ status: false })
    }
}

export const updateLogos = async (req, res) => {

    await new Promise((resolve, reject) => {
        db.run("DELETE FROM pl_logos", (err, row) => {
            if (err) {
                reject(false)
            }
            else {
                resolve(true)
            }
        })
    })
    const { data } = await instance.get("https://www.premierleague.com/clubs")
    const $ = cheerio.load(data)
    const sql = "INSERT INTO pl_logos VALUES (?, ?)"
    let status = true
    await Promise.all($(".dataContainer > li > a").each(async (_, element) => {
        const href = $(element).attr("href")
        // extract the number from the href attribute
        const id = parseInt(href.match(/\/(\d+)\//)[1])
        const logo = await scrapeTeamLogo(id)
        try {
            await db.run(sql, [id, logo])
            console.log(`${logo} inserted`)
        }
        catch (err) {
            status = false
            console.log("Error inserting a new logo")
        }
    }).get())

    res.send({ status: status })
}