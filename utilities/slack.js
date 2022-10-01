
const https = require('https');
var slackHook = process.env.SLACK_HOOK;

async function slackAlert(data, type){
    console.log("Preparing to send Slack message...");
    var color = "";

    switch(type){
        case "soft":
            color = "#f5e042";
            break;
        case "warning":
            color = "#f59c42";
            break;
        case "critical":
            color = "f55142";
    } 
    
    var alertDetails = {
        'username': 'Website SSL alert',
        'text': 'Monitoring detected that one of SSL certificates expires soon.',
        'icon_emoji': ':bangbang:',
        'attachments': [{
          'color': color,
          'fields': [
              {
                "title": "Domain(s)",
                "value": JSON.stringify(data.domainName),
                "short": true
              },
              {
                "title": "Valid",
                "value": data.valid == 1 ? "true" : "false",
                "short": true
              },
              {
                "title": "Expires",
                "value": data.validTo,
                "short": true
              },
              {
                "title": "Days remaining",
                "value": data.daysRemaining,
                "short": true
              },
              {
                "title": data.rejectedFor ? "There was an error with resoling domain:" : "",
                "value": data.rejectedFor[0] + " Please check logs for details.",
                "short": false
              }
          ],
          "actions": [
            {
                "type": "button",
                "text": "Visit Website",
                "style": "primary",
                "url": "https://" + data.domainName[0]
            },
            {
                "type": "button",
                "text": "View on Dashboard",
                "style": "danger",
                "url": "https://#"
            }
        ]
        }]
    };
    /**
 * Handles the actual sending request. 
 * We're turning the https.request into a promise here for convenience
 * @param webhookURL
 * @param messageBody
 * @return {Promise}
 */
function sendSlackMessage (webhookURL, messageBody) {
    // make sure the incoming message body can be parsed into valid JSON
    try {
      messageBody = JSON.stringify(messageBody);
    } catch (e) {
      throw new Error('Failed to stringify messageBody', e);
    }
  
    // Promisify the https.request
    return new Promise((resolve, reject) => {
      // general request options, we defined that it's a POST request and content is JSON
      const requestOptions = {
        method: 'POST',
        header: {
          'Content-Type': 'application/json'
        }
      };
  
      // actual request
      const req = https.request(webhookURL, requestOptions, (res) => {
        let response = '';
  
  
        res.on('data', (d) => {
          response += d;
        });
  
        // response finished, resolve the promise with data
        res.on('end', () => {
          resolve(response);
        })
      });
  
      // there was an error, reject the promise
      req.on('error', (e) => {
        reject(e);
      });
  
      // send our message body (was parsed to JSON beforehand)
      req.write(messageBody);
      req.end();
    });
  }
  
  // main
  (async function () {
      
    console.log('Sending slack message...');
    try {
      const slackResponse = await sendSlackMessage(slackHook, alertDetails);
      console.log('Message response', slackResponse);
    } catch (e) {
      console.error('There was a error with the request', e);
    }
  })();
}

 module.exports.slackAlert = slackAlert;