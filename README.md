# Agora Node Token Server
Petzen's Node Token server for video call.

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
