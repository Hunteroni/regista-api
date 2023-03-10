//Basic authentication logic, consider using your own authentication methods
import db from "../db/conn.js"

const verifyAuthToken = async (method, token, ip) => {
    if (token == process.env.SECRET) {
        return true
    }
    if (method == "GET") {
        const hasRecord = await new Promise((resolve, reject) => {
            db.get("SELECT * from tokens where id = ? and ip = ?", [token, ip], (err, row) => {
                if (err) {
                    reject(false)
                }
                else {
                    row ? resolve(true) : resolve(false)
                }
            })
        })
        if (hasRecord) {
            return true
        }
        else {
            return false
        }
    }
    else {
        return false
    }
}

const checkAuth = async (req, res, next) => {
    const token = req.headers.authorization;
    if (token && token.startsWith("Bearer ")) {
        const authToken = token.slice(7);
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
        const tokenVerified = await verifyAuthToken(req.method, authToken, ip)
        if (tokenVerified) {
            return next();
        }
    }
    res.status(401).send("Unauthorized");
}

export default checkAuth