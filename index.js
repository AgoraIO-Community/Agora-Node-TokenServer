const express = require('express');
const {RtcTokenBuilder, RtcRole} = require('agora-access-token')

const PORT = 8080;

const APP_ID = process.env.APP_ID;
const APP_CERTIFICATE = process.env.APP_CERTIFICATE;

const app = express();

const nocache = (req, resp, next) => {
  resp.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  resp.header('Expires', '-1');
  resp.header('Pragma', 'no-cache');
  next();
}

const generateAccessToken = (req, resp) => {
  resp.header('Access-Control-Allow-Origin', '*');

  const channelName = req.query.channel;
  if (!channelName) {
    return  resp.status(500).json({ 'error': 'cahnnel name is required'});
  }

  let uid = req.query.uid;
  if(!uid) {
    uid = 0;
  }

  let role; // 1 for publisher and 2 for subscriber.
  if (req.query.role == "publisher") {
    role = RtcRole.PUBLISHER;
  } else {
    role = RtcRole.SUBSCRIBER;
  }

  let exporedTs = req.query.expiredTs;
  if(!exporedTs) {
    exporedTs = 3600; // defaults to 1hr
  }

  const currentTimestamp = Math.floor(Date.now() / 1000)
  const privilegeExpiredTs = currentTimestamp + exporedTs

  const token = RtcTokenBuilder.buildTokenWithUid(APP_ID, APP_CERTIFICATE, channelName, uid, role, privilegeExpiredTs);
  return resp.json({'token' : token });
};

app.get('/access_token', nocache, generateAccessToken);

app.listen(PORT, function(){
  console.log('Listening on port: ' + PORT);
});