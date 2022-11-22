# Agora Node Token Server
This is an example of a simple Node/Express server that generates tokens for Agora applications. 

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template/huuDOY?referralCode=HTPdHX)

<a target="_blank" href="https://render.com/deploy?repo=https://github.com/AgoraIO-Community/Agora-Node-TokenServer">
  <img src="https://render.com/images/deploy-to-render-button.svg" alt="Deploy to Render">
</a>
<br /> <br />

[![Deploy on Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

### Run the server ###
- Install the dependencies
```node
npm install
```
- Create a copy of the `.env.example` file and save it as `.env`
- Add your Agora App ID and App Certificate:
```
APP_ID=ca123xxxxxx
APP_CERTIFICATE=12za123xxxxxx
```
You can obtain these values by selecting your project in the [Agora console projects section](https://console.agora.io/projects). Optionally, you can also define a port.

- Start the service
```node
npm start
```

## Endpoints ##

### Ping ###
**endpoint structure**
```
/ping
```
response:
``` 
{"message":"pong"} 
```

### RTC Token ###
The `rtc` token endpoint requires a `channelName`, `role` ('publisher' or 'audience'), `tokentype` ('uid' || 'userAccount') and the user's `uid` (type varies based on `tokentype` (example: `1000` for uid, `ekaansh` for userAccount). 
`(optional)` Pass an integer to represent the token lifetime in seconds.

**endpoint structure** 
```
/rtc/:channelName/:role/:tokentype/:uid/?expiry=
```

response:
``` 
{"rtcToken":" "} 
```

## RTM Token ##
The `rtm` token endpoint requires the user's `uid`. 
`(optional)` Pass an integer to represent the privelege lifetime in seconds.
**endpoint structure** 
```
/rtm/:uid/?expiry=
```

response:
``` 
{"rtmToken":" "} 
```

### Both Tokens ###
The `rte` token endpoint generates both the `rtc` and `rtm` tokens with a single request.
`(optional)` Pass an integer to represent the token lifetime in seconds.

**endpoint structure** 
```
/rte/:channelName/:role/:tokentype/:uid/?expiry=
```

response:
``` 
{
  "rtcToken":" ",
  "rtmToken":" " 
} 
```
