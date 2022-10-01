
const nodemailer = require("nodemailer");
require('dotenv').config()
async function sendEmail(data) {

    let transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    
    var message = "Email message";
    if(data.valid){
        message = "Hi, <br><br>\
        This email is sent as reminder for Domain SSL Watchdog.\
        <br>Watched Domain " + JSON.stringify(data.domainName) + " SSL Certificate is about to expire on <b>" + data.validTo + "</b> which is in <b>" + data.daysRemaining + "</b> days.</br></br>";
    } else {
        // Epired, send RED ALERT!
        message = "Hi, <br><br>\
        This email is sent as reminder for Domain SSL Watchdog.\
        <br>Watched Domain " + JSON.stringify(data.domainName) + " SSL Certificate has expired on <b>" + data.validTo + "</b></br></br>";
    }

    let info = await transporter.sendMail({
    from: '"SSL Monitoring " <'+process.env.SMTP_FROM+'>',
    to: process.env.NOTIFY_EMAIL,
    subject: "SSL Status",
    text: "SSL Monitoring service",
    html: message,
    });

}

 module.exports.sendEmail = sendEmail;