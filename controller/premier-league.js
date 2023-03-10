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
        return data ? `https:${data.endpoint}` : null;
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
const parseRole = (role) => {
    switch (role) {
        case "Goalkeeper":
            return "GK"
            break
        case "Defender":
            return "D"
            break;
        case "Midfielder":
            return "M"
            break;
        case "Forward":
            return "F"
            break;
    }
}

const retrieveIso2Nationality = async () => {
    const data = await new Promise((res, rej) => {
        db.all("SELECT alpha_2_code, en_short_name FROM countries", [], (err, row) => {
            if (err) {
                rej(err)
            }
            else {
                res(row)
            }
        })
    })
    return data
}
export const getPlayers = async (req, res) => {
    const index = 1
    const { data } = await instance.get(`https://www.premierleague.com/clubs/${index}/club/squad`)
    const $ = cheerio.load(data)
    const nationalities = await retrieveIso2Nationality()
    console.log(nationalities)
    const resp = []

    $('.squadListContainer li a').each((index, element) => {
        const src = $(element).find(".statCardImg").attr("data-player")
        const number = $(element).find('.number').text().trim();
        const fullName = $(element).find('.name').text().trim();
        const [name, surname] = fullName.split(' ');
        const role = parseRole($(element).find('.position').text().trim());
        const nationality = $(element).find('.nationality .playerCountry').text().trim();
        const natIndex = nationalities.findIndex(v => v.en_short_name == nationality)

        const record = natIndex !== -1 ? nationalities[natIndex].alpha_2_code : nationality

        resp.push({
            number: number, name: name, surname: surname, image: `https://resources.premierleague.com/premierleague/photos/players/110x140/${src}.png`, role: role, nationality: record
        })
    });
    return res.send({ status: true, data: resp })
}


export const getStandings = async (req, res) => {
    const { data } = await instance.get("https://www.premierleague.com/tables")
    const $ = cheerio.load(data)

    const response = await new Promise(async (res, rej) => {
        const response = []
        const promises = []

        $(".tableBodyContainer tr").each((index, element) => {
            if ($(element).attr("class") == "expandable") return

            const team_id = parseInt($(element).attr("data-filtered-table-row-abbr"))
            let data = {
                id: team_id,
                name: "",
                abbreviation: "",
                logo: null,
                played: 0,
                draw: 0,
                lost: 0,
                won: 0,
                position: 1,
                points: 0,
                goalsFor: 0,
                goalsAgainst: 0
            }

            let td = $(element).find(".long")
            data.name = td.text()
            td = $(element).find(".short")
            data.abbreviation = td.text()
            td = $(element).find(".points")
            data.points = parseInt(td.text())

            $(element).find("td").each((index, column) => {
                switch (index) {
                    case 1:
                        const pos = $(column).find(".value").text()
                        data.position = parseInt(pos)
                        break
                    case 3:
                        data.played = parseInt($(column).text())
                        break
                    case 4:
                        data.won = parseInt($(column).text())
                        break
                    case 5:
                        data.draw = parseInt($(column).text())
                        break
                    case 6:
                        data.lost = parseInt($(column).text())
                        break
                    case 7:
                        data.goalsFor = parseInt($(column).text())
                        break
                    case 8:
                        data.goalsAgainst = parseInt($(column).text())
                        break
                }
            })

            response.push(data)
            promises.push(retrieveTeamLogo(team_id))
        })

        // Wait for all logo promises to complete
        const logos = await Promise.all(promises)

        // Assign logos to data objects
        response.forEach((data, index) => {
            data.logo = logos[index]
        })

        res(response)
    })

    res.send(response)
}