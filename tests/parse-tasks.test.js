/**
 * Unit tests for server/lib/parse-tasks.js
 *
 * Run with: node --test tests/parse-tasks.test.js
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parseTasksStats, encodeProjectPath } from '../server/lib/parse-tasks.js';

// ---------------------------------------------------------------------------
// parseTasksStats
// ---------------------------------------------------------------------------

describe('parseTasksStats', () => {
  test('empty content returns zero counts and empty slugs', () => {
    const { stats, activeTaskSlugs } = parseTasksStats('');
    assert.deepEqual(stats, { todo: 0, ongoing: 0, done: 0, backlog: 0, total: 0 });
    assert.equal(activeTaskSlugs.size, 0);
  });

  test('counts each status symbol correctly', () => {
    const content = [
      '- [ ] A todo task',
      '- [/] An ongoing task',
      '- [x] A done task',
      '- [X] Another done task (uppercase X)',
      '- [-] A backlog task',
    ].join('\n');
    const { stats } = parseTasksStats(content);
    assert.equal(stats.todo, 1);
    assert.equal(stats.ongoing, 1);
    assert.equal(stats.done, 2);
    assert.equal(stats.backlog, 1);
    assert.equal(stats.total, 5);
  });

  test('ignores lines that are not task lines', () => {
    const content = [
      '# My Project',
      '',
      '## Section',
      '',
      'Some description text',
      '    - [ ] indented — not a task line',
      '- [ ] Real task',
    ].join('\n');
    const { stats } = parseTasksStats(content);
    assert.equal(stats.total, 1);
    assert.equal(stats.todo, 1);
  });

  test('extracts slugs from todo and ongoing tasks', () => {
    const content = [
      '- [ ] Add login page #add-login-page',
      '- [/] Fix bug #fix-the-bug',
    ].join('\n');
    const { activeTaskSlugs } = parseTasksStats(content);
    assert.ok(activeTaskSlugs.has('add-login-page'));
    assert.ok(activeTaskSlugs.has('fix-the-bug'));
    assert.equal(activeTaskSlugs.size, 2);
  });

  test('does not extract slugs from done or backlog tasks', () => {
    const content = [
      '- [x] Done task #done-slug',
      '- [-] Backlog task #backlog-slug',
    ].join('\n');
    const { activeTaskSlugs } = parseTasksStats(content);
    assert.equal(activeTaskSlugs.size, 0);
  });

  test('does not extract slug when title contains extra text after slug', () => {
    // The regex requires the slug to be at the end of the line (with optional whitespace)
    const content = '- [ ] Task title #my-slug extra-text';
    const { activeTaskSlugs } = parseTasksStats(content);
    assert.equal(activeTaskSlugs.size, 0);
  });

  test('handles tasks without slugs', () => {
    const content = '- [ ] Task without a slug';
    const { activeTaskSlugs, stats } = parseTasksStats(content);
    assert.equal(activeTaskSlugs.size, 0);
    assert.equal(stats.todo, 1);
  });

  test('handles trailing whitespace after slug', () => {
    const content = '- [ ] My task #my-slug   ';
    const { activeTaskSlugs } = parseTasksStats(content);
    assert.ok(activeTaskSlugs.has('my-slug'));
  });

  test('handles slugs with numbers and underscores', () => {
    const content = '- [/] Task #task_123-abc';
    const { activeTaskSlugs } = parseTasksStats(content);
    assert.ok(activeTaskSlugs.has('task_123-abc'));
  });

  test('accumulates counts across multiple sections', () => {
    const content = [
      '## Section A',
      '- [ ] Task A1',
      '- [/] Task A2',
      '',
      '## Section B',
      '- [x] Task B1',
      '- [-] Task B2',
      '- [ ] Task B3',
    ].join('\n');
    const { stats } = parseTasksStats(content);
    assert.equal(stats.todo, 2);
    assert.equal(stats.ongoing, 1);
    assert.equal(stats.done, 1);
    assert.equal(stats.backlog, 1);
    assert.equal(stats.total, 5);
  });

  test('indented description lines do not affect counts', () => {
    const content = [
      '- [ ] Main task #my-task',
      '    This is a description',
      '    AC: Some acceptance criteria',
    ].join('\n');
    const { stats, activeTaskSlugs } = parseTasksStats(content);
    assert.equal(stats.total, 1);
    assert.ok(activeTaskSlugs.has('my-task'));
  });
});

// ---------------------------------------------------------------------------
// encodeProjectPath
// ---------------------------------------------------------------------------

describe('encodeProjectPath', () => {
  test('encodes a simple absolute path', () => {
    assert.equal(encodeProjectPath('/home/user/myproject'), '-home-user-myproject');
  });

  test('encodes hidden directory components with double dash', () => {
    // /.git → --git, /.claude → --claude
    assert.equal(encodeProjectPath('/home/user/.myproject'), '-home-user--myproject');
  });

  test('encodes root path', () => {
    assert.equal(encodeProjectPath('/'), '-');
  });

  test('produces the same result as Claude Code project dir naming', () => {
    // Concrete example from Claude Code: /Users/alice/work/cotask → -Users-alice-work-cotask
    assert.equal(encodeProjectPath('/Users/alice/work/cotask'), '-Users-alice-work-cotask');
  });

  test('handles multiple hidden directories', () => {
    assert.equal(encodeProjectPath('/a/.b/.c'), '-a--b--c');
  });

  test('handles paths with consecutive separators replaced correctly', () => {
    assert.equal(encodeProjectPath('/foo/bar/baz'), '-foo-bar-baz');
  });
});
