import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

test('Auth Integration Tests', async (t) => {
  let server;
  let baseUrl;

  t.before(async () => {
    // Mock Mongoose connect to return a dummy connection structure
    mongoose.connect = async () => {
      return {
        connection: {
          host: 'localhost-mock'
        }
      };
    };

    // Mock User query methods to operate in-memory/stubbed
    User.findOne = (query) => {
      const email = query.email;
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'hashedpassword',
        role: 'user',
        createdAt: new Date(),
        matchPassword: async (enteredPassword) => {
          return enteredPassword === 'correctpassword';
        },
        toJSON: function() {
          return {
            id: this._id,
            name: this.name,
            email: this.email,
            role: this.role,
            createdAt: this.createdAt
          };
        }
      };

      const result = {
        select: async function(fields) {
          if (email === 'existing@example.com') {
            return mockUser;
          }
          return null;
        },
        then: function(onFulfilled, onRejected) {
          if (email === 'existing@example.com') {
            return Promise.resolve(mockUser).then(onFulfilled, onRejected);
          }
          return Promise.resolve(null).then(onFulfilled, onRejected);
        }
      };

      return result;
    };

    User.create = async (data) => {
      return {
        _id: new mongoose.Types.ObjectId(),
        name: data.name,
        email: data.email,
        role: 'user',
        createdAt: new Date(),
        toJSON: function() {
          return {
            id: this._id,
            name: this.name,
            email: this.email,
            role: this.role,
            createdAt: this.createdAt
          };
        }
      };
    };

    // Start Express app on an ephemeral port (port 0 selects any free port)
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
  });

  t.after(async () => {
    // Close server
    await new Promise((resolve) => server.close(resolve));
  });

  await t.test('GET /health returns 200 and status online', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'online');
  });

  await t.test('POST /api/auth/signup with invalid email validation returns 400', async () => {
    const payload = {
      name: 'Test User',
      email: 'invalid-email-format',
      password: 'password123'
    };

    const res = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.message, 'Please provide name, email, and password');
  });

  await t.test('POST /api/auth/signup with non-string name returns 400', async () => {
    const payload = {
      name: 12345, // invalid type
      email: 'valid.email@example.com',
      password: 'password123'
    };

    const res = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.message, 'Please provide name, email, and password');
  });

  await t.test('POST /api/auth/signup with valid inputs creates user and sets secure cookie without token in JSON', async () => {
    const payload = {
      name: 'Bob Smith',
      email: 'bob.smith@example.com',
      password: 'password123'
    };

    const res = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.message, 'Account created successfully');
    assert.strictEqual(data.token, undefined); // Token must NOT be exposed in JSON
    assert.strictEqual(data.user.name, 'Bob Smith');
    assert.strictEqual(data.user.email, 'bob.smith@example.com');

    // Verify cookie header is present and secure
    const cookieHeader = res.headers.get('set-cookie');
    assert.ok(cookieHeader);
    assert.ok(cookieHeader.includes('jwt='));
    assert.ok(cookieHeader.includes('HttpOnly'));
  });

  await t.test('POST /api/auth/login with valid credentials logs in user and sets secure cookie without token in JSON', async () => {
    const payload = {
      email: 'existing@example.com',
      password: 'correctpassword'
    };

    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.message, 'Logged in successfully');
    assert.strictEqual(data.token, undefined); // Token must NOT be exposed in JSON

    // Verify cookie header is present and secure
    const cookieHeader = res.headers.get('set-cookie');
    assert.ok(cookieHeader);
    assert.ok(cookieHeader.includes('jwt='));
    assert.ok(cookieHeader.includes('HttpOnly'));
  });
});
