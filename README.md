# Agora Node Token Server
This is an example of a simple Node/Express server that generates a token for Agora applications. 

### Run the server ###
Install the dependencies
```node
npm install
```
Start the service
```node
npm start
```

### Generate the Token ###
The endpoint generates a token uisng: `channelName` _(String)_ , the `uid` _(Int)_, and a `role` _('subscriber' or 'publisher')_. 
`(optional)` Pass `expirationTime` _(integer)_ to represent the token lifetime in seconds.

**endpoint structure** 
```
?channelName=&uid=&role=&expireTime=
```

response:
``` 
{"token":" "} 
```
