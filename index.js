import express from "express"
import bodyParser from "body-parser";
import cors from "cors"
import dotenv from "dotenv"
import seriea from "./routes/serie-a.js"
import premierleague from "./routes/premier-league.js"



dotenv.config()
const app = express()
app.use(cors())
app.use(bodyParser.json())

app.use("/serie-a/", seriea)

app.use("/premier-league/", premierleague)


app.listen(process.env.PORT, () => console.log(`API Starting on port: ${process.env.PORT}`))