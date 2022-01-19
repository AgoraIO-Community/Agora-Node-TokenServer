# How to Build a Token Server for Agora Applications using NodeJS
![](https://cdn-images-1.medium.com/max/1600/1*-VqtQPQsreSN7Fave3bmOw.png)

Note: This article was updated on 20-Dec-21 to use v2.0.0 of the NodeJS Token Server.

Security within video chat applications is a hot topic at the moment. As remote working and virtual events become more prolific, the need for security will increase.

Within the [Agora Platform](https://www.agora.io/?utm_source=medium&utm_medium=blog&utm_campaign=How_to_Build_a_Token_Server_for_Agora_Applications_using_NodeJS), one layer of security comes in the form of token authentication. A token, for those of you that don't know, is a dynamic key that is generated using a set of given inputs. The Agora Platform uses tokens to authenticate users.

Agora offers token security for both its RTC and RTM SDKs.  This guide will explain how to build a simple microservice using [NodeJS](https://nodejs.org) and [Express](https://expressjs.com) to generate both tokens.

## Prerequisites ##
- A basic understanding of JavaScript ES6, [NodeJS](https://nodejs.org), and [NPM](https://www.npmjs.com)
 _(minimal knowledge needed)_
- An understanding of how express web servers function (minimal knowledge needed)
- An Agora Developer Account (It's free! [Sign up here](https://www.agora.io/en/blog/how-to-get-started-with-agora?utm_source=medium&utm_medium=blog&utm_campaign=How_to_Build_a_Token_Server_for_Agora_Applications_using_NodeJS))

## Project Setup ##
To start our project we’ll create a new folder and open a terminal window at this folder.
In the terminal, we’ll run `npm init` to set up the node project. The create project prompt will appear. I used the default settings, but feel free to customize this portion.

Now that the project has been created, we can add our NPM dependencies ([express](https://www.npmjs.com/package/express), [agora-access-token](https://www.npmjs.com/package/agora-access-token) and [dotenv](https://www.npmjs.com/package/dotenv)) using:

```node
npm install express agora-access-token dotenv
```

## Build the Express server ##
Now that the project is set up, open the folder in your favorite code editor. Looking at the `package.json`, you’ll notice that the entry file is `index.js` but this file doesn’t exist in our project so we’ll have to create a new file and name it `index.js`.

Within the `index.js` we’ll start by requiring our modules. From express, we’ll need the express object and from `agora-access-token` we’ll leverage ES6's [destructuring assignments](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment) to extract references to the `RtcTokenBuilder` and `RtcRole` objects. We'll also use `dotenv` from it's package for our environment variables.

```javascript
const express = require('express');
const {RtcTokenBuilder, RtcRole} = require('agora-access-token');
const dotenv = require('dotenv');
```

Let’s define our constants by creating a `.env` file and adding our Agora Credenetials and the `PORT` we’re going to use to listen for requests
```
APP_ID=970XXXXX...
APP_CERTIFICATE=5CFXXXXX...
PORT=8080
```
Back in our `index.js`, we'll access these values using using environment variable, the `dotenv` package loads up environment variables from our `.env` file. We can specify a default port in case it's not defined.
```javascript
dotenv.config();
const PORT = process.env.PORT || 8080;
const APP_ID = process.env.APP_ID;
const APP_CERTIFICATE = process.env.APP_CERTIFICATE;
```

Next we’ll define our `app` constant that will instantiate our `Express` object and allow us to set up our server.

```javascript
const app = express();
```

Before we can set up the `GET` endpoint for our Express server, we’ll need to define the functions that are invoked when the endpoint is accessed. The first function (**`nocache`**) will apply the response headers, that force the browser to never cache the response so we ensure we always get a fresh token. You’ll notice we call the `next()` method at the end because this function is a middleware function which is the first in the series so we need to call `next()` let Express know to continue to the next middleware function in the series.

```javascript
const nocache = (_, resp, next) => {
  resp.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  resp.header('Expires', '-1');
  resp.header('Pragma', 'no-cache');
  next();
}
```

The second function (**`generateRTCToken`**) will handle the request and return the _JSON_ response. We’ll define the function for now and add the body once we finish setting up the Express server. This is the last function in the series so we don’t need the `next` parameter/function.

```javascript
const generateRTCToken = (req, resp) => { };
```

Let’s define a `GET` endpoint `/rtc`, passing in the **`nochache`** and **`generateRTCToken`** functions.

```javascript
app.get('/rtc/:channel/:role/:tokentype/:uid', nocache , generateRTCToken)
```
You'd notice the route contains `:<path>`, `:` marks the path as a variable, the user can pass in the values like channel name, user role, type of token and user UID to the route and we can access the data in our application.

As the last step for creating our Express server, we’ll implement the `.listen()` method and pass in the **`PORT`** and a callback once the server is ready and listening on the given port.

```javascript
app.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});
```

## Generate the Agora Token ##
Now that we have our Express server setup, we are ready to add the functionality to the **`generateRTCToken`** function. We’ll start by setting the response header to ensure we don’t run into any CORS issues.

```javascript
resp.header('Access-Control-Allow-Origin', '*');
```

### Get the Query Parameters ### 
Next we’ll check for the `channel` in our request parameters. This is a required parameter so if `channelName` is _`undefined`_ we need to return an error with a `500` response code and a JSON object with the error.

```javascript
const channelName = req.params.channel;
if (!channelName) {
    return resp.status(500).json({ 'error': 'channel is required' });
}
```

For **`uid`** and **`role`** we'll perform similar checks.
```javascript
let uid = req.params.uid;
if (!uid || uid === '') {
    return resp.status(500).json({ 'error': 'uid is required' });
}

let role;
if (req.params.role === 'publisher') {
    role = RtcRole.PUBLISHER;
} else if (req.params.role === 'audience') {
    role = RtcRole.SUBSCRIBER
} else {
    return resp.status(500).json({ 'error': 'role is incorrect' });
}
```
> **Please Note:** Only privilege is enforced by the Agora Platform by default. This is the join channel privilege, to enable the enforcement of other privileges you will need to make a request through [Agora Support](https://agora-ticket.agora.io).

The user can optionally pass in an **`expiry`** query parameter that will set the time for the token to expire. We can access the value, check if it exists otherwise we set a suitable default of 3600 seconds.

```javascript
let expireTime = req.query.expiry;
if (!expireTime || expireTime === '') {
    expireTime = 3600;
} else {
    expireTime = parseInt(expireTime, 10);
}
```

We'll calculate the expiration time, it needs to be an integer that represents the time since _Jan 1, 1970_. We’ll use the current time and add our expiration time to it.

```javascript
  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTime + expireTime;
```

### Build the Token ### 
Now that we have all our elements for our token we are ready to use the `RtcTokenBuilder` object to generate our token. We'll check the **`tokenType`** and call the appropriate method on the object passing in the required values.
```javascript
let token;
if (req.params.tokentype === 'userAccount') {
    token = RtcTokenBuilder.buildTokenWithAccount(APP_ID, APP_CERTIFICATE, channelName, uid, role, privilegeExpireTime);
} else if (req.params.tokentype === 'uid') {
    token = RtcTokenBuilder.buildTokenWithUid(APP_ID, APP_CERTIFICATE, channelName, uid, role, privilegeExpireTime);
} else {
    return resp.status(500).json({ 'error': 'token type is invalid' });
}
```

### Return the Response ### 
The last step in generating our token is returning the JSON response that contains the token.
```javascript
return resp.json({ 'rtcToken': token });
```

## Test the Token Server ##
Let’s go back to our `package.json` and add a _“start”_ command within the _“scripts”_ object. The start command will execute the _“node index.js”_ command so we can run our server instance.

```json
"scripts": {
  "test": "echo \"Error: no test specified\" && exit 1",
  "start": "node index.js"
},
```

### Start the server ### 
Let’s go back to our command prompt window and use our new command:

```node
npm start
```
Once the server instance is listening we’ll see our _“Listening on port: 8080”_ (or the port in your `.env` file) within our terminal window.

## Test the endpoint ## 
Now that our server instance is running, let’s open our web browser and test.

For example pass “test” as the **`channel`**, "publisher" as the **`role`**, "uid" as the **`tokenType`** with the UID of "1" :
```
localhost:8080/rtc/test/publisher/uid/1
```
This will display:
```json
{"rtcToken":"0062ec0d84c41c4442d88ba6f5a2beb828bIAD9qg4N4hd04MvaY6A72m4BjYmO/7+xnRMinaI0ncLzkAx+f9gAAAAAEACS0zcn9gASXwEAAQCGvRBf"}
```
Other examples should give a similar output:
```
localhost:8080/rtc/test/publisher/uid/1
localhost:8080/rtc/test/publisher/uid/1?expiry=1000
localhost:8080/rtc/test/subscriber/userAccount/ekaansh
```

## RTM Tokens ##
We can use the same process to configure a route to generate RTM tokens. You can look at the **`generateRTMToken`** function in the [finished project](https://github.com/AgoraIO-Community/Agora-Node-TokenServer) for generating RTM tokens. The `/rtm` route looks like this, passing in a UID as "1":
```
localhost:8080/rtm/1
```
The response looks like:
```json
{"rtmToken":"0062ec0d84c41c4442d88ba6f5a2beb828bIAD9qg4N4hd04MvaY6A72m4BjYmO/7+xnRMinaI0ncLzkAx+f9gAAAAAEACS0zcn9gASXwEAAQCGvRBf"}
```
## Conclusion ##
And just like that we are done! In-case you weren’t coding along or want to see the finished product all together you can find it on [GitHub](https://github.com/AgoraIO-Community/Agora-Node-TokenServer). You can deploy it to Heroku in two clicks using the button in the Readme. 

There's also a version written in Typescript available on the [typescript branch](https://github.com/AgoraIO-Community/Agora-Node-TokenServer/tree/typescript). If you see any room for improvement feel free to fork the repo and make a pull request!


## Other Resources ##
For more information about the Tokens for Agora.io applications, please take look at the [Set up Authentication](https://docs.agora.io/en/Agora%20Platform/token?platform=All%20Platforms) guide. We also have a token server built with Golang and Gin that you can find [here](https://github.com/AgoraIO-Community/agora-token-service).

If you have any questions, I invite you to [join the Agora Developer Slack community](https://agora.io/en/join-slack) and ask them there.