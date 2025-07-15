const request = require('supertest');
const express = require('express');
const {
  RtcTokenBuilder,
  RtcRole,
  RtmTokenBuilder,
  RtmRole,
} = require('agora-token');

// Mock environment variables
process.env.APP_ID = 'test-app-id';
process.env.APP_CERTIFICATE = 'test-app-certificate';
process.env.PORT = '3000';

// Import the express app
const app = require('./index.js');

// Main test suite for the Token Generation API
describe('Token Generation API', () => {
  // Test suite for the health check endpoint
  describe('GET /ping', () => {
    it('should return pong message', async () => {
      const response = await request(app).get('/ping');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'pong' });
    });
  });

  // Test suite for RTC (Real-Time Communication) token generation
  describe('GET /rtc/:channel/:role/:tokentype/:uid', () => {
    // Test successful RTC token generation
    it('should generate RTC token with valid parameters', async () => {
      const response = await request(app)
        .get('/rtc/test-channel/publisher/uid/1234')
        .query({ expiry: '3600' }); // Token expires in 1 hour

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('rtcToken');
      expect(typeof response.body.rtcToken).toBe('string');
    });

    // Test error handling for missing channel parameter
    it('should return error for missing channel', async () => {
      const response = await request(app).get('/rtc//publisher/uid/1234');

      // '/rtc//publisher/uid/1234' does not match '/rtc/:channel/:role/:tokentype/:uid'
      expect(response.status).toBe(404);
    });

    // Test error handling for invalid role parameter
    it('should return error for invalid role', async () => {
      const response = await request(app).get(
        '/rtc/test-channel/invalid-role/uid/1234'
      );

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'role is incorrect' });
    });
  });

  // Test suite for RTM (Real-Time Messaging) token generation
  describe('GET /rtm/:uid', () => {
    // Test successful RTM token generation
    it('should generate RTM token with valid parameters', async () => {
      const response = await request(app)
        .get('/rtm/1234')
        .query({ expiry: '3600' }); // Token expires in 1 hour

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('rtmToken');
      expect(typeof response.body.rtmToken).toBe('string');
    });

    // Test error handling for missing uid parameter
    it('should return error for missing uid', async () => {
      const response = await request(app).get('/rtm/');

      // '/rtm/' does not match '/rtm/:uid/'
      expect(response.status).toBe(404);
    });
  });

  // Test suite for RTE (Combined RTC and RTM) token generation
  describe('GET /rte/:channel/:role/:tokentype/:uid', () => {
    // Test successful generation of both RTC and RTM tokens
    it('should generate both RTC and RTM tokens with valid parameters', async () => {
      const response = await request(app)
        .get('/rte/test-channel/publisher/uid/1234')
        .query({ expiry: '3600' }); // Tokens expire in 1 hour

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('rtcToken');
      expect(response.body).toHaveProperty('rtmToken');
      expect(typeof response.body.rtcToken).toBe('string');
      expect(typeof response.body.rtmToken).toBe('string');
    });

    // Test error handling for missing channel parameter
    it('should return error for missing channel', async () => {
      const response = await request(app).get('/rte//publisher/uid/1234');

      expect(response.status).toBe(404);
    });

    // Test error handling for invalid role parameter
    it('should return error for invalid role', async () => {
      const response = await request(app).get(
        '/rte/test-channel/invalid-role/uid/1234'
      );

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'role is incorrect' });
    });
  });

  // Test suite for verifying response headers
  describe('Response Headers', () => {
    // Test presence of cache control headers
    it('should include no-cache headers', async () => {
      const response = await request(app).get('/ping');

      expect(response.headers['cache-control']).toBe(
        'private, no-cache, no-store, must-revalidate'
      );
      expect(response.headers['expires']).toBe('-1');
      expect(response.headers['pragma']).toBe('no-cache');
    });

    // Test presence of CORS headers
    it('should include CORS headers', async () => {
      const response = await request(app).get(
        '/rtc/test-channel/publisher/uid/1234'
      );

      expect(response.headers['access-control-allow-origin']).toBe('*');
    });
  });
});
