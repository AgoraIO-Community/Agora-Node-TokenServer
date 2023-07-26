const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const {RtcTokenBuilder, RtcRole, RtmTokenBuilder} = require('agora-token');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;
const APP_ID = process.env.APP_ID;
const APP_CERTIFICATE = process.env.APP_CERTIFICATE;

if(!APP_ID || !APP_CERTIFICATE) {
  console.error('You must specify APP_ID and APP_CERTIFICATE in .env');
  process.exit();
}

const nocache = (_, resp, next) => {
  resp.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  resp.header('Expires', '-1');
  resp.header('Pragma', 'no-cache');
  next();
}

const ping = (req, resp) => {
  resp.send({message: 'pong'});
}

const generateRTCToken = (req, resp) => {
  // set response header
  resp.header('Access-Control-Allow-Origin', '*');
  // get channel name
  const channelName = req.params.channel;
  if (!channelName) {
    return resp.status(400).json({ 'error': 'channel is required' });
  }
  // get uid
  let uid = req.params.uid;
  if(!uid || uid === '') {
    return resp.status(400).json({ 'error': 'uid is required' });
  }
  // get role
  let role;
  if (req.params.role === 'publisher') {
    role = RtcRole.PUBLISHER;
  } else if (req.params.role === 'audience') {
    role = RtcRole.SUBSCRIBER
  } else {
    return resp.status(400).json({ 'error': 'role is incorrect' });
  }
  // get the expire time
  let expireTime = req.query.expiry;
  if (!expireTime || expireTime === '') {
    expireTime = 3600;
  } else {
    expireTime = parseInt(expireTime, 10);
  }
  // build the token
  let token;
  if (req.params.tokentype === 'userAccount') {
    token = RtcTokenBuilder.buildTokenWithUserAccount(APP_ID, APP_CERTIFICATE, channelName, uid, role, expireTime, expireTime);
  } else if (req.params.tokentype === 'uid') {
    token = RtcTokenBuilder.buildTokenWithUid(APP_ID, APP_CERTIFICATE, channelName, uid, role, expireTime, expireTime);
    console.log(expireTime,token);
  } else {
    return resp.status(400).json({ 'error': 'token type is invalid' });
  }
  // return the token
  return resp.json({ 'rtcToken': token });
}

const generateRTMToken = (req, resp) => {
  // set response header
  resp.header('Access-Control-Allow-Origin', '*');

  // get uid
  let uid = req.params.uid;
  if(!uid || uid === '') {
    return resp.status(400).json({ 'error': 'uid is required' });
  }
  // get the expire time
  let expireTime = req.query.expiry;
  if (!expireTime || expireTime === '') {
    expireTime = 3600;
  } else {
    expireTime = parseInt(expireTime, 10);
  }
  // build the token
  const token = RtmTokenBuilder.buildToken(APP_ID, APP_CERTIFICATE, uid, expireTime);
  // return the token
  return resp.json({ 'rtmToken': token });
}

const generateRTEToken = (req, resp) => {
  // set response header
  resp.header('Access-Control-Allow-Origin', '*');
  // get channel name
  const channelName = req.params.channel;
  if (!channelName) {
    return resp.status(400).json({ 'error': 'channel is required' });
  }
  // get uid
  let uid = req.params.uid;
  if(!uid || uid === '') {
    return resp.status(400).json({ 'error': 'uid is required' });
  }
  // get role
  let role;
  if (req.params.role === 'publisher') {
    role = RtcRole.PUBLISHER;
  } else if (req.params.role === 'audience') {
    role = RtcRole.SUBSCRIBER
  } else {
    return resp.status(400).json({ 'error': 'role is incorrect' });
  }
  // get the expire time
  let expireTime = req.query.expiry;
  if (!expireTime || expireTime === '') {
    expireTime = 3600;
  } else {
    expireTime = parseInt(expireTime, 10);
  }
  // build the token
  const rtcToken = RtcTokenBuilder.buildTokenWithUid(APP_ID, APP_CERTIFICATE, channelName, uid, role, expireTime, expireTime);
  const rtmToken = RtmTokenBuilder.buildToken(APP_ID, APP_CERTIFICATE, uid, expireTime);
  // return the token
  return resp.json({ 'rtcToken': rtcToken, 'rtmToken': rtmToken });
}

app.options('*', cors());
app.get('/ping', nocache, ping)
app.get('/rtc/:channel/:role/:tokentype/:uid', nocache , generateRTCToken);
app.get('/rtm/:uid/', nocache , generateRTMToken);
app.get('/rte/:channel/:role/:tokentype/:uid', nocache , generateRTEToken);

app.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});
