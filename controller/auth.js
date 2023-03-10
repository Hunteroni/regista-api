//Basic authentication logic, consider using your own authentication methods
import db from "../db/conn.js";
import { v4 as uuidv4 } from "uuid"

export const checkAuthorization = async (req, res) => {
    const { ip } = req.query
    const response = await new Promise((resolve, reject) => {
        db.get("SELECT * FROM tokens where ip = ?", [ip], (err, row) => {
            if (err) {
                console.log(err)
                reject()
            }
            else {
                resolve(row)
            }
        })
    })
    if (response) {
        return res.send({
            status: true,
            token: response.id
        })
    }
    else {
        return res.send({
            status: false
        })
    }

}

export const deleteAuthorization = async (req, res) => {
    const { ip } = req.query;
    const response = await new Promise((resolve, reject) => {
        db.run("DELETE FROM tokens WHERE ip = ?", [ip], (err, row) => {
            if (!err) {
                resolve(true)
            }
            else {
                reject(false)
            }
        })
    })
    return res.send({ status: response })
}

export const putAuthorization = async (req, res) => {
    const { ip } = req.query;

    db.serialize(() => {
        // Begin the transaction
        db.run('BEGIN TRANSACTION');

        // Remove all tokens with the given IP address
        db.run('DELETE FROM tokens WHERE ip = ?', [ip], (err) => {
            if (err) {
                // Error occurred while deleting tokens, rollback the transaction
                db.run('ROLLBACK TRANSACTION', () => {
                    res.send({ status: false, token: null });
                });
            } else {
                // Insert the new token
                const id = uuidv4();
                db.run('INSERT INTO tokens VALUES (?, ?)', [id, ip], (err) => {
                    if (err) {
                        // Error occurred while inserting new token, rollback the transaction
                        db.run('ROLLBACK TRANSACTION', () => {
                            res.send({ status: false, token: null });
                        });
                    } else {
                        // All statements executed successfully, commit the transaction
                        db.run('COMMIT TRANSACTION', (err) => {
                            if (err) {
                                res.send({ status: false, token: null });
                            } else {
                                res.send({ status: true, token: id });
                            }
                        });
                    }
                });
            }
        });
    });
}