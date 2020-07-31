# How to Build a Token Server for Agora Applications using NodeJS
![](https://cdn-images-1.medium.com/max/1600/1*-VqtQPQsreSN7Fave3bmOw.png)
Security within video chat applications is a hot topic at the moment. As remote working and virtual events become more prolific, the need for security will increase.

Within the [Agora Platform](https://www.agora.io/?utm_source=medium&utm_medium=blog&utm_campaign=How_to_Build_a_Token_Server_for_Agora_Applications_using_NodeJS), one layer of security comes in the form of token authentication. A token, for those of you that don't know, is a dynamic key that is generated using a set of given inputs. Agora's Platform uses tokens to authenticate users.

Agora offers token security for both its RTC and RTM SDKs.  This guide will explain how to build a simple microservice using [NodeJS](https://nodejs.org) and [Express](https://expressjs.com) to generate an Agora RTC token. The example can easily be adapted to include an RTM token as it follows a similar pattern.

## Prerequisites ##
- A basic understanding of JavaScript ES6, [NodeJS](https://nodejs.org), and [NPM](https://www.npmjs.com)
 _(minimal knowledge needed)_
- An understanding of how express web servers function
- (minimal knowledge needed)
- An Agora Developer Account (see: [How To Get Started with Agora](https://www.agora.io/en/blog/how-to-get-started-with-agora?utm_source=medium&utm_medium=blog&utm_campaign=How_to_Build_a_Token_Server_for_Agora_Applications_using_NodeJS))

## Project Setup ##
To start our project we’ll create a new folder and open a terminal window at this folder.
![](https://miro.medium.com/max/1400/1*owzs9rKzs8vNSDvFRX7Jmg.gif)
In the terminal, we’ll run `npm init` to set up the node project. The create project prompt will appear. I used the default settings, but feel free to customize this portion.

Now that the project has been created, we can add our NPM dependencies ([express](https://www.npmjs.com/package/express) and [agora-access-token](https://www.npmjs.com/package/agora-access-token)) using:

```node
npm install express
npm install agora-access-token
```
![](https://miro.medium.com/max/1400/1*NY3AEVbjarU5oUuItL9OGg.gif)

## Build the Express server ##
Now that the project is set up, open the folder in your favorite code editor. Looking at the `package.json`, you’ll notice that the entry file is `index.js` but this file doesn’t exist in our project so we’ll have to create a new file and name it `index.js`.

Within the `index.js` we’ll start by requiring our modules. From express, we’ll need the express object and from `agora-access-token` we’ll leverage ES6's [destructuring assignments](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment) to extract references to the `RtcTokenBuilder` and `RtcRole` objects.

```javascript
const express = require('express');
const {RtcTokenBuilder, RtcRole} = require('agora-access-token');
```

Let’s define constants for the `PORT` number we’re gonna use to listen for requests, I like to use 8080. We’ll also define constants for our Agora `AppID` and `AppCertificate`, I like to use environment variables so we aren’t exposing these values in our code but you can also set these values as Strings containing your respective Agora keys.

```javascript
const PORT = 8080;
const APP_ID = process.env.APP_ID;
const APP_CERTIFICATE = process.env.APP_CERTIFICATE;
```

Next we’ll define our `app` constant that will instantiate our `Express` object and allow us to set up our server.

```javascript
const app = express();
```

Before we can set up the `GET` endpoint for our Express server, we’ll need to define the functions that are invoked when the endpoint is accessed. The first function (**`nocache`**) will apply the response headers, that force the browser to never cache the response so we ensure we always get a fresh token. You’ll notice we call the `next()` method at the end because this function is a middleware function which is the first in the series so we need to call `next()` let Express know to continue to the next middleware function in the series.

```javascript
const nocache = (req, resp, next) => {
  resp.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  resp.header('Expires', '-1');
  resp.header('Pragma', 'no-cache');
  next();
};
```

The second function (**`generateAccessToken`**) will handle the request and return the _JSON_ response. We’ll define the function for now and add the body once we finish setting up the Express server. This is the last function in the series so we don’t need the `next` parameter/function.

```javascript
const generateAccessToken = (req, resp) => { };
```

Let’s define a `GET` endpoint, passing in the **`nochache`** and **`generateAccessToken`** functions.

```javascript
app.get('/access_token', nocache, generateAccessToken);
```

As the last step for creating our Express server, we’ll implement the `.listen()` method and pass in the **`PORT`** and a callback once the server is ready and listening on the given port.

```javascript
app.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});
```

## Generate the Agora Token ##
Now that we have our Express server setup, we are ready to add the functionality to the **`generateAccessToken`** function. We’ll start by setting the response header to ensure we don’t run into any CORS issues.

```javascript
resp.header('Access-Control-Allow-Origin', '*');
```

### Get the Query Parameters ### 
Next we’ll check for the `channelName` query parameter. This is a required parameter so if `channelName` is _`undefined`_ we need to return an error with a `500` response code and a JSON object with the error.

```javascript
const channelName = req.query.channelName;
if (!channelName) {
  return resp.status(500).json({ 'error': 'channel is required' });
}
```

The next couple of parameters (**`uid`**, **`role`**, **`expirationTime`**) are not required so we’ll assign default values as needed.

For the **`uid`** we’ll set the default value to `0`, which allows us to generate a _“wildcard”_ token that can be used to join the given _channel_ with any **`uid`**. This is only appropriate for use in low security situations (or during development), where it’s ok for all the users to share a single token.

> An example of a low-security situation is live broadcast where anyone can join and watch as an audience member.

For the `role`, we’ll default each user to be a `SUBSCRIBER` and only check if the request passes a value of `publisher`, otherwise any other value can be ignored.

> **Please Note:** Only privilege is enforced by the Agora Platform by default. This is the join channel privilege, to enable the enforcement of other privileges you will need to make a request through [Agora Support](https://agora-ticket.agora.io).

For the **`expirationTime`** we’ll default to `3600` seconds which gives the user an hour to join the channel before the privilege expires. One thing to note about expiration time is the token’s privilege lifetime needs to be an integer that represents the time since _Jan 1, 1970_. We’ll use the current time and add our expiration time to it.

```javascript
  // get uid 
  let uid = req.query.uid;
  if(!uid || uid == '') {
    uid = 0;
  }
  // get role
  let role = RtcRole.SUBSCRIBER;
  if (req.query.role == 'publisher') {
    role = RtcRole.PUBLISHER;
  }
  // get the expire time
  let expireTime = req.query.expireTime;
  if (!expireTime || expireTime == '') {
    expireTime = 3600;
  } else {
    expireTime = parseInt(expireTime, 10);
  }
  // calculate privilege expire time
  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTime + expireTime;
```

### Build the Token ### 
Now that we have all our elements for our token we are ready to use the `RtcTokenBuilder` object’s `buildTokenWithUid` to generate our token.
```javascript
const token = RtcTokenBuilder.buildTokenWithUid(APP_ID, APP_CERTIFICATE, channelName, uid, role, privilegeExpireTime);
```

### Return the Response ### 
The last step in generating our token is returning the JSON response that contains the token.
```javascript
return resp.json({ 'token': token });
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
Once the server instance is listening we’ll see our _“Listening on port: 8080”_ within our terminal window.
![](https://miro.medium.com/max/1400/1*ghTKgxHbNtICQDKBQO3Azw.png)

## Test the endpoint ## 
Now that our server instance is running, let’s open our web browser and test. For these tests we’ll try a few variations that omit various query params.

We’ll start by omitting all query params:
```
localhost:8080/access_token
```
This will display:
```json
{"error":"channel is required"}
```
Next we’ll pass “test” as the **`channelName`**:
```
localhost:8080/access_token?channelName=test
```
This will output a token that can be used by any user.
```json
{"token":"0062ec0d84c41c4442d88ba6f5a2beb828bIAD9qg4N4hd04MvaY6A72m4BjYmO/7+xnRMinaI0ncLzkAx+f9gAAAAAEACS0zcn9gASXwEAAQCGvRBf"}
```
We can continue testing with the rest of the query params and we’ll get a similar response as above.
```
localhost:8080/access_token?channelName=test&role=subscriber
localhost:8080/access_token?channelName=test&role=subscriber&uid=1234
localhost:8080/access_token?channelName=test&role=subscriber&uid=1234&expireTime=6400
```
![](https://miro.medium.com/max/1400/1*zG0YAv4W5ZkoS05Yl2RnWg.gif)

## Done! ##
And just like that we are done! In-case you weren’t coding along or want to see the finished product all together, I have uploaded all the code to GitHub:

[https://github.com/digitallysavvy/Agora-Node-TokenServer](https://github.com/digitallysavvy/Agora-Node-TokenServer)

Thanks for taking the time to read my tutorial and if you have any questions please let me know with a comment. If you see any room for improvement feel free to fork the repo and make a pull request!


## Other Resources ##
For more information about the Tokens for Agora.io applications, please take look at the [Set up Authentication](https://docs.agora.io/en/Agora%20Platform/token?platform=All%20Platforms) guide and [Agora Advanced Guide: How to build a Token(NodeJS)](https://docs.agora.io/en/Video/token_server_nodejs?platform=Node.js).

I also invite you to[ join the Agoira.io Developer Slack community](http://bit.ly/2IWexJQ).