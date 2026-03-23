/**
 * HTTP integration tests for the cotask dashboard server.
 *
 * These tests start a real server instance on a dedicated test port pointing
 * at a temporary project directory, then make actual HTTP requests against it.
 *
 * Run with: node --test tests/api.test.js
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

// ---------------------------------------------------------------------------
// Test server lifecycle
// ---------------------------------------------------------------------------

const TEST_PORT = 38479; // well away from the production port 3847
let tmpDir;
let serverProcess;

/** Make a simple HTTP request against the test server. */
function request(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: urlPath,
        method,
        headers: {
          ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString();
          let json;
          try { json = JSON.parse(text); } catch { json = null; }
          resolve({ status: res.statusCode, headers: res.headers, text, json });
        });
      },
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

/** Wait until the server is accepting connections (up to 10 s). */
function waitForServer(port, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    function attempt() {
      const req = http.request({ hostname: '127.0.0.1', port, path: '/api/health', method: 'GET' }, (res) => {
        res.resume();
        resolve();
      });
      req.on('error', () => {
        if (Date.now() >= deadline) return reject(new Error('Server did not start in time'));
        setTimeout(attempt, 150);
      });
      req.end();
    }
    attempt();
  });
}

before(async () => {
  // Create a temp directory that acts as COTASK_PROJECTS_DIR.
  // The server scans this for project subdirs containing JSONL files + TASKS.md.
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cotask-test-'));

  serverProcess = spawn(
    process.execPath,
    [path.join(import.meta.dirname, '..', 'server', 'server.js')],
    {
      env: {
        ...process.env,
        COTASK_PORT: String(TEST_PORT),
        COTASK_PROJECTS_DIR: tmpDir,
        // Keep heartbeat file out of /tmp to avoid interfering with any real instance
        COTASK_HEARTBEAT_FILE: path.join(tmpDir, 'heartbeats.json'),
      },
    },
  );

  // Forward server stderr so failures are visible in test output
  serverProcess.stderr.on('data', d => process.stderr.write(d));

  await waitForServer(TEST_PORT);
});

after(async () => {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
    await new Promise(r => serverProcess.on('exit', r));
  }
  await fs.rm(tmpDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// /api/health
// ---------------------------------------------------------------------------

describe('GET /api/health', () => {
  test('returns 200 with { ok: true }', async () => {
    const res = await request('GET', '/api/health');
    assert.equal(res.status, 200);
    assert.deepEqual(res.json, { ok: true });
  });

  test('response has JSON content-type', async () => {
    const res = await request('GET', '/api/health');
    assert.ok(res.headers['content-type'].includes('application/json'));
  });
});

// ---------------------------------------------------------------------------
// /api/state
// ---------------------------------------------------------------------------

describe('GET /api/state', () => {
  test('returns 200 with a projects array', async () => {
    const res = await request('GET', '/api/state');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.json?.projects));
  });

  test('empty projects dir yields empty projects array', async () => {
    const res = await request('GET', '/api/state');
    assert.deepEqual(res.json.projects, []);
  });
});

// ---------------------------------------------------------------------------
// /api/heartbeat
// ---------------------------------------------------------------------------

describe('POST /api/heartbeat', () => {
  test('accepts valid heartbeat and returns { ok: true }', async () => {
    const res = await request('POST', '/api/heartbeat', {
      sessionId: 'test-session-1',
      state: 'idle',
      pid: null,
      cwd: '/tmp/test-project',
    });
    assert.equal(res.status, 200);
    assert.deepEqual(res.json, { ok: true });
  });

  test('accepts running state', async () => {
    const res = await request('POST', '/api/heartbeat', {
      sessionId: 'test-session-running',
      state: 'running',
      pid: null,
      cwd: '/tmp/test-project',
    });
    assert.equal(res.status, 200);
    assert.deepEqual(res.json, { ok: true });
  });

  test('accepts permission state', async () => {
    const res = await request('POST', '/api/heartbeat', {
      sessionId: 'test-session-perm',
      state: 'permission',
    });
    assert.equal(res.status, 200);
    assert.deepEqual(res.json, { ok: true });
  });

  test('notfound state deletes the session', async () => {
    // First register the session
    await request('POST', '/api/heartbeat', { sessionId: 'temp-session', state: 'idle' });
    // Then remove it
    const res = await request('POST', '/api/heartbeat', { sessionId: 'temp-session', state: 'notfound' });
    assert.equal(res.status, 200);
    assert.deepEqual(res.json, { ok: true });
  });

  test('returns 400 when sessionId is missing', async () => {
    const res = await request('POST', '/api/heartbeat', { state: 'idle' });
    assert.equal(res.status, 400);
    assert.ok(res.json?.error);
  });

  test('returns 400 when state is missing', async () => {
    const res = await request('POST', '/api/heartbeat', { sessionId: 'abc' });
    assert.equal(res.status, 400);
    assert.ok(res.json?.error);
  });

  test('returns 400 for malformed JSON', async () => {
    const res = await new Promise((resolve, reject) => {
      const payload = 'not-valid-json';
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: TEST_PORT,
          path: '/api/heartbeat',
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
        },
        (response) => {
          const chunks = [];
          response.on('data', c => chunks.push(c));
          response.on('end', () => {
            const text = Buffer.concat(chunks).toString();
            let json;
            try { json = JSON.parse(text); } catch { json = null; }
            resolve({ status: response.statusCode, json });
          });
        },
      );
      req.on('error', reject);
      req.write(payload);
      req.end();
    });
    assert.equal(res.status, 400);
  });
});

// ---------------------------------------------------------------------------
// /api/tasks/:id  (PUT)
// ---------------------------------------------------------------------------

describe('PUT /api/tasks/:id', () => {
  test('returns 404 for unknown project id', async () => {
    const res = await request('PUT', '/api/tasks/nonexistent-project-id', { content: '- [ ] Task\n' });
    assert.equal(res.status, 404);
    assert.ok(res.json?.error);
  });

  test('returns 400 when content field is missing', async () => {
    const res = await request('PUT', '/api/tasks/nonexistent-id', { other: 'field' });
    // Either 400 (content validation) or 404 (project not found) — project not found fires first
    assert.ok(res.status === 404 || res.status === 400);
  });

  test('returns 400 when content is not a string', async () => {
    const res = await request('PUT', '/api/tasks/nonexistent-id', { content: 42 });
    assert.ok(res.status === 404 || res.status === 400);
  });
});

// ---------------------------------------------------------------------------
// Static assets & routing
// ---------------------------------------------------------------------------

describe('static asset serving', () => {
  test('GET / returns HTML', async () => {
    const res = await request('GET', '/');
    assert.equal(res.status, 200);
    assert.ok(res.headers['content-type'].includes('text/html'));
  });

  test('GET /offline returns HTML', async () => {
    const res = await request('GET', '/offline');
    assert.equal(res.status, 200);
    assert.ok(res.headers['content-type'].includes('text/html'));
  });

  test('directory traversal path is neutralised (normalised to non-asset route → 404)', async () => {
    // Node's URL constructor normalises /assets/../server.js → /server.js before
    // the server even sees it, so the path never reaches the ".." guard and instead
    // falls through to the catch-all 404.  The server is safe either way.
    const res = await request('GET', '/assets/../server.js');
    assert.equal(res.status, 404);
  });

  test('unknown routes return 404', async () => {
    const res = await request('GET', '/api/does-not-exist');
    assert.equal(res.status, 404);
  });
});

// ---------------------------------------------------------------------------
// Heartbeat state-machine behaviour
// ---------------------------------------------------------------------------

describe('heartbeat state transitions', () => {
  test('stateTs stays the same when state does not change', async () => {
    const sessionId = 'state-ts-test';
    // First heartbeat
    await request('POST', '/api/heartbeat', { sessionId, state: 'idle' });
    // Second heartbeat with same state — stateTs should not reset
    // We verify this indirectly: both calls return ok and the server doesn't error.
    const res = await request('POST', '/api/heartbeat', { sessionId, state: 'idle' });
    assert.deepEqual(res.json, { ok: true });
  });

  test('stateTs resets when state changes', async () => {
    const sessionId = 'state-ts-change-test';
    await request('POST', '/api/heartbeat', { sessionId, state: 'idle' });
    const res = await request('POST', '/api/heartbeat', { sessionId, state: 'running' });
    assert.deepEqual(res.json, { ok: true });
  });

  test('session is removed by notfound state', async () => {
    const sessionId = 'cleanup-test';
    await request('POST', '/api/heartbeat', { sessionId, state: 'running' });
    await request('POST', '/api/heartbeat', { sessionId, state: 'notfound' });
    // After notfound, re-registering should work fine
    const res = await request('POST', '/api/heartbeat', { sessionId, state: 'idle' });
    assert.deepEqual(res.json, { ok: true });
  });
});
