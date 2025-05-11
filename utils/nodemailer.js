const nodemailer=require('nodemailer')
const dotenv = require('dotenv');
dotenv.config();
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.nodemailer_user,
        pass: process.env.nodemailer_pass,
    },
});
module.exports = transporter;