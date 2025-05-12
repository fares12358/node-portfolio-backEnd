const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();
const API_SECRET = process.env.API_SECRET_TOKEN;
const protect = async (req, res, next) => {
    try {
        let token = req.headers["authorization"];

        if (!token) {
            return res.status(403).json({ message: "Forbidden: Missing token" });
        }

        const tokenParts = token.split(" ");
        if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer" || tokenParts[1] !== API_SECRET) {
            return res.status(403).json({ message: "Forbidden: Invalid token" });
        }
        next();
    } catch (error) {
        res.status(401).json({ message: "Token failed", error: error.message });
    }
}



module.exports = { protect};
