import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import User from '../models/User.js';
import Note from '../models/Note.js';
import dotenv from 'dotenv';

dotenv.config();

// Helper to generate mock tokens for authentication in tests
const generateMockToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'fallback_secret_keys_10p', {
    expiresIn: '1h',
  });
};

test('Note CRUD Integration Tests', async (t) => {
  let server;
  let baseUrl;

  const mockUserId1 = new mongoose.Types.ObjectId();
  const mockUserId2 = new mongoose.Types.ObjectId();

  const mockUser1 = {
    _id: mockUserId1,
    name: 'User One',
    email: 'user1@example.com',
    role: 'user',
  };

  const mockUser2 = {
    _id: mockUserId2,
    name: 'User Two',
    email: 'user2@example.com',
    role: 'user',
  };

  // In-memory data store for Notes to bypass real DB
  let mockNotesDb = [];

  t.before(async () => {
    // 1. Mock Mongoose connect
    mongoose.connect = async () => ({ connection: { host: 'localhost-mock' } });

    // 2. Mock User.findById for authentication middleware
    User.findById = (id) => {
      const idStr = id.toString();
      const matchedUser =
        idStr === mockUserId1.toString()
          ? mockUser1
          : idStr === mockUserId2.toString()
          ? mockUser2
          : null;

      return {
        select: async (fields) => matchedUser,
        then: function (onFulfilled, onRejected) {
          return Promise.resolve(matchedUser).then(onFulfilled, onRejected);
        },
      };
    };

    // 3. Mock Note.create
    Note.create = async (data) => {
      const newNote = {
        _id: new mongoose.Types.ObjectId(),
        user: data.user,
        title: data.title,
        content: data.content,
        tags: data.tags || [],
        isPinned: data.isPinned || false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockNotesDb.push(newNote);
      return newNote;
    };

    // 4. Mock Note.find with support for sort chain
    Note.find = (query) => {
      const filteredNotes = mockNotesDb.filter(
        (n) => n.user.toString() === query.user.toString()
      );

      const queryObj = {
        sort: async (sortCriteria) => {
          return [...filteredNotes].sort((a, b) => {
            if (sortCriteria.isPinned) {
              if (a.isPinned !== b.isPinned) {
                return a.isPinned ? -1 : 1;
              }
            }
            return b.updatedAt - a.updatedAt;
          });
        },
        then: function (onFulfilled, onRejected) {
          return Promise.resolve(filteredNotes).then(onFulfilled, onRejected);
        },
      };
      return queryObj;
    };

    // 5. Mock Note.findById returning a mock document with sub-methods
    Note.findById = (id) => {
      const note = mockNotesDb.find((n) => n._id.toString() === id.toString());
      if (!note) {
        return {
          then: function (onFulfilled, onRejected) {
            return Promise.resolve(null).then(onFulfilled, onRejected);
          },
        };
      }

      const noteDoc = {
        ...note,
        deleteOne: async function () {
          mockNotesDb = mockNotesDb.filter((n) => n._id.toString() !== id.toString());
        },
        save: async function () {
          this.updatedAt = new Date();
          const idx = mockNotesDb.findIndex((n) => n._id.toString() === id.toString());
          if (idx !== -1) {
            mockNotesDb[idx] = {
              _id: this._id,
              user: this.user,
              title: this.title,
              content: this.content,
              tags: this.tags,
              isPinned: this.isPinned,
              createdAt: this.createdAt,
              updatedAt: this.updatedAt,
            };
          }
          return this;
        },
      };

      return {
        then: function (onFulfilled, onRejected) {
          return Promise.resolve(noteDoc).then(onFulfilled, onRejected);
        },
      };
    };

    // Start Express app on ephemeral port
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
  });

  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  t.beforeEach(() => {
    // Reset database mock store
    mockNotesDb = [];
  });

  await t.test('POST /api/notes without authentication returns 401', async () => {
    const res = await fetch(`${baseUrl}/api/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test Note', content: 'Testing content' }),
    });

    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.match(data.message, /not authorized/i);
  });

  await t.test('POST /api/notes with missing fields returns 400', async () => {
    const token = generateMockToken(mockUserId1);
    const res = await fetch(`${baseUrl}/api/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title: 'Missing Content' }),
    });

    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.match(data.message, /content is required/i);
  });

  await t.test('POST /api/notes with valid data creates note and returns 201', async () => {
    const token = generateMockToken(mockUserId1);
    const res = await fetch(`${baseUrl}/api/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: 'New Rich Note',
        content: '<h1>Hello World</h1><p>Rich text notes</p>',
        tags: ['important', 'work'],
      }),
    });

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.title, 'New Rich Note');
    assert.strictEqual(data.data.content, '<h1>Hello World</h1><p>Rich text notes</p>');
    assert.deepStrictEqual(data.data.tags, ['important', 'work']);
  });

  await t.test('GET /api/notes fetches only the logged-in user\'s notes', async () => {
    // 1. Create a note for User 1
    await Note.create({
      user: mockUserId1,
      title: 'User 1 Note',
      content: 'Hello 1',
    });

    // 2. Create a note for User 2
    await Note.create({
      user: mockUserId2,
      title: 'User 2 Note',
      content: 'Hello 2',
    });

    // 3. Request notes as User 1
    const token1 = generateMockToken(mockUserId1);
    const res = await fetch(`${baseUrl}/api/notes`, {
      headers: { Authorization: `Bearer ${token1}` },
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.count, 1);
    assert.strictEqual(data.data[0].title, 'User 1 Note');
  });

  await t.test('GET /api/notes/:id fetches user\'s note, and blocks unauthorized access', async () => {
    // 1. Create a note for User 1
    const note = await Note.create({
      user: mockUserId1,
      title: 'Secret Note',
      content: 'Top Secret Info',
    });

    // 2. Fetch as User 1 (success)
    const token1 = generateMockToken(mockUserId1);
    const resSuccess = await fetch(`${baseUrl}/api/notes/${note._id}`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    assert.strictEqual(resSuccess.status, 200);
    const dataSuccess = await resSuccess.json();
    assert.strictEqual(dataSuccess.data.title, 'Secret Note');

    // 3. Fetch as User 2 (forbidden 403)
    const token2 = generateMockToken(mockUserId2);
    const resForbidden = await fetch(`${baseUrl}/api/notes/${note._id}`, {
      headers: { Authorization: `Bearer ${token2}` },
    });
    assert.strictEqual(resForbidden.status, 403);
    const dataForbidden = await resForbidden.json();
    assert.strictEqual(dataForbidden.success, false);
    assert.match(dataForbidden.message, /forbidden/i);
  });

  await t.test('PUT /api/notes/:id updates the note successfully', async () => {
    const note = await Note.create({
      user: mockUserId1,
      title: 'Original Title',
      content: 'Original Content',
    });

    const token = generateMockToken(mockUserId1);
    const res = await fetch(`${baseUrl}/api/notes/${note._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: 'Updated Title',
        isPinned: true,
      }),
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.title, 'Updated Title');
    assert.strictEqual(data.data.content, 'Original Content'); // content unchanged
    assert.strictEqual(data.data.isPinned, true);
  });

  await t.test('DELETE /api/notes/:id deletes the note successfully', async () => {
    const note = await Note.create({
      user: mockUserId1,
      title: 'To Be Deleted',
      content: 'Goodbye',
    });

    const token = generateMockToken(mockUserId1);
    const res = await fetch(`${baseUrl}/api/notes/${note._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.match(data.message, /deleted successfully/i);

    // Verify it is removed from db
    const checkDb = mockNotesDb.find((n) => n._id.toString() === note._id.toString());
    assert.strictEqual(checkDb, undefined);
  });
});
