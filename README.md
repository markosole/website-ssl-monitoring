# website-ssl-monitoring
Nodejs Website SSL monitoring application with multisite list and notifications through Slack and Email. 
App runs Cron job at midnight every day and checks all domains listed in ` domains.json `. SSL certificate will be checked for each domain and alert will be generated and sent through Emails and Slack if configured and enabled. 


# Features
 - Three levels of alerts: Soft, Warning, Critical. Each levels has configurable number of days for SSL comparison
 - Slack alerts through Webhook
 - Email alert using SMTP
 - Unlimited number of Watched domains
 - No external services involved
 
 
 # Configuration
 App has two configuratio files, Domain list ` domains.json ` and ` configuration.json `
 
 > domains.json
 Populate the list with domains you want to watch.
 ```
    { 
        "domain": "google.com"
    },
    { 
        "domain": "yahoo.com"
    }
 
 ```
 
 > configuration.json
 Here you can configure number of days for reminders with 3 levels. Each level has 3 days negative offset and for SOFT_REMINDER system will send reminders of SSL is about to expire in 15, 14 and 13 day. All three levels will work the same way.

 ```
 
    { 
        "SOFT_REMINDER": 15,
        "WARNING_REMINDER": 6,
        "CRITICAL_REMINDER": 3,
        "EMAIL_ALERTS": false,
        "SLACK_ALERTS": true
    }
    
```
# Installation

` npm install `

# Ho to run it

In development

node index.js

In production

` pm2 start index.js `
