import express from "express"
import bodyParser from "body-parser";
import cors from "cors"
import dotenv from "dotenv"
import seriea from "./routes/serie-a.js"
import premierleague from "./routes/premier-league.js"
import authRoutes from "./routes/auth.js"
import db from "./db/conn.js";
import checkAuth from "./helpers/authentication.js";


dotenv.config()
const app = express()


app.use(cors())

app.use(bodyParser.json())

//middleware to check authentication, consider developing your own in your app
app.use(checkAuth)

app.use("/serie-a/", seriea)

app.use("/premier-league/", premierleague)

app.use("/auth/", authRoutes)

app.listen(process.env.PORT, () => console.log(`API Starting on port: ${process.env.PORT}`))