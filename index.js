'use strict';
require('dotenv').config()
const fs            = require('fs');
const logger        = require('./utilities/logger')
const sendEmail     = require('./utilities/emailer')
const slackAlert    = require('./utilities/slack')
const sslChecker    = require("ssl-checker");
const cron          = require('node-cron');
const cron_weekly   = require('node-cron');

var CheckInterval   = parseInt(process.env.CHECK_INTERVAL);                                                             // check CheckInterval in ms
const domainList    = process.env.DOMAIN_LIST;
const configuration = process.env.APP_CONFIGURATION;
const isProduction  = process.env.NODE_ENV === "production" ? true : false;
let didRun          = false;

var isEmailAlerts   = false;
var isSlackAlerts   = true;
var SOFT_LIMIT      = 20;
var WARNING_LIMIT   = 10;
var CRITICAL_LIMIT  = 0;

console.log("Running in " + process.env.NODE_ENV + " mode...");

if(!didRun){
    checkLimits();                                                                                                      // Check alert limits set in ENV on every run
    runChecks();                                                                                                        // Auto run for very first time with no delays                                                                                                                                                                                                                             
}

if(!isProduction){                                                                                                      // Used only for development and debugging
    setInterval(() => {
        logger.log(" >>> Executing check <<< \n");
        didRun = true;
        runChecks();
    }, CheckInterval); 
}

if(isProduction){    
    cron.schedule('0 0 0 * * *', () => {
        console.log(' >>> Executing check at 00:00 at Europe/Dublin timezone');
        didRun = true;
        checkLimits();
        runChecks();
      }, {
        scheduled: true,
        timezone: "Europe/Dublin"
    });


    // Schedule weekly Uptime and Online status report
    cron_weekly.schedule('5 8 * * 7', () => {
        console.log(' >>> Executing on Sun at 08:05 at Europe/Dublin timezone');
        sendOnlineStatus();
      }, {
        scheduled: true,
        timezone: "Europe/Dublin"
    });
}

function runChecks(){
    console.log("Last runtime date and time: " + Date("Y-m-d hh:mm:ss"));
    try {
        var rawdata = fs.readFileSync(domainList);
        var domains = JSON.parse(rawdata);
    } catch (error) {
        logger.log(error);
        return;        
    }
    
    try {
        logger.log("Checking domains: \n================= ");
        domains.forEach(site => {
            logger.log(site.domain);
            sslChecker(site.domain, 'GET', 443).then(function(result){
                verifyResults(result);
            });
        });
    } catch (error) {
        logger.log(error);
        return;        
    }
}

function checkLimits(){                                                                                                 // Read and set limits to global vars
    try {
        var config = fs.readFileSync(configuration);
        var data = JSON.parse(config);
    } catch (error) {
        logger.log(error);
        return;        
    }
    logger.log("=== Configuration: ==== ");
    logger.log(data);

    SOFT_LIMIT      = data[0].SOFT_REMINDER;
    WARNING_LIMIT   = data[0].WARNING_REMINDER;
    CRITICAL_LIMIT  = data[0].CRITICAL_REMINDER;
    isEmailAlerts   = data[0].EMAIL_ALERTS;
    isSlackAlerts   = data[0].SLACK_ALERTS;
}

async function verifyResults(response){
    

    var notification = {                                                                                                // Parse data into new clean object
        domainName: response.validFor,                                                                                  // Array type - all domains covered by Cert
        validFrom: response.validFrom.replace(/T/, ' ').replace(/\..+/, ''),
        validTo: response.validTo.replace(/T/, ' ').replace(/\..+/, ''),
        valid: response.valid,
        daysRemaining: response.daysRemaining
    }
    
    if(response.rejectedFor){
        console.log("Hostname not reachable: " + response.rejectedFor);
        logger.log(response);
        notification.rejectedFor = response.rejectedFor;
        notification.domainName = response.rejectedFor;
    }

    var days = response.daysRemaining;
    var type = "";                                                                                                      // Notification type
    
    if(response.validFor){
        // Check for Soft limit
        if(days <= SOFT_LIMIT && days >= (SOFT_LIMIT - 3)){
            console.log("Soft email");
            type = "soft"
            if(isEmailAlerts){sendEmail.sendEmail(notification);}
            if(isSlackAlerts){slackAlert.slackAlert(notification, type);}
        }

        // Check for Warning limit
        if(days <= WARNING_LIMIT && days >= (WARNING_LIMIT - 3)){
            console.log("Warning email");
            type = "warning"
            if(isEmailAlerts){sendEmail.sendEmail(notification);}
            if(isSlackAlerts){slackAlert.slackAlert(notification, type);} 
        }

        // Check for Critical limit
        if(days <= CRITICAL_LIMIT){
            console.log("Critical email"); 
            type = "critical"       
            if(isEmailAlerts){sendEmail.sendEmail(notification);}
            if(isSlackAlerts){slackAlert.slackAlert(notification, type);}
        }
    }

}

function sendOnlineStatus(){
    // This will be sent once a week
    const type = "online_status";
    const notification = {                                                                                                // Parse data into new clean object
        domainName: 0,                                                                                                    // Array type - all domains covered by Cert
        validFrom: "NONE",
        validTo: "NONE",
        valid: true,
    }
    if(isSlackAlerts){slackAlert.slackAlert(notification, type);} 
}





