/**
 * Unit tests for server/lib/tasks-markdown.js
 *
 * Run with: node --test tests/tasks-markdown.test.js
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parseTasksMd, toMarkdown } from '../server/lib/tasks-markdown.js';

// Deterministic IDs for snapshot-style assertions
let counter = 0;
function makeId(name) { return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section'; }
function uid() { return `id-${++counter}`; }
function opts() { return { makeId, uid }; }

// Reset counter before each test (tests call opts() which captures uid via closure)
function resetCounter() { counter = 0; }

// ---------------------------------------------------------------------------
// parseTasksMd — basic task parsing
// ---------------------------------------------------------------------------

describe('parseTasksMd – task status', () => {
  test('parses a todo task', () => {
    resetCounter();
    const { sections } = parseTasksMd('- [ ] My todo task', opts());
    assert.equal(sections.length, 1);
    assert.equal(sections[0].tasks[0].status, 'todo');
    assert.equal(sections[0].tasks[0].title, 'My todo task');
  });

  test('parses an ongoing task', () => {
    resetCounter();
    const { sections } = parseTasksMd('- [/] In progress', opts());
    assert.equal(sections[0].tasks[0].status, 'ongoing');
  });

  test('parses a done task (lowercase x)', () => {
    resetCounter();
    const { sections } = parseTasksMd('- [x] Completed', opts());
    assert.equal(sections[0].tasks[0].status, 'done');
  });

  test('parses a done task (uppercase X)', () => {
    resetCounter();
    const { sections } = parseTasksMd('- [X] Completed', opts());
    assert.equal(sections[0].tasks[0].status, 'done');
  });

  test('parses a canceled/backlog task', () => {
    resetCounter();
    const { sections } = parseTasksMd('- [-] Archived task', opts());
    assert.equal(sections[0].tasks[0].status, 'canceled');
  });
});

describe('parseTasksMd – slug extraction', () => {
  test('extracts slug from title', () => {
    resetCounter();
    const { sections } = parseTasksMd('- [ ] Add login page #add-login-page', opts());
    const task = sections[0].tasks[0];
    assert.equal(task.title, 'Add login page');
    assert.equal(task.slug, 'add-login-page');
  });

  test('task without slug has empty slug', () => {
    resetCounter();
    const { sections } = parseTasksMd('- [ ] Task with no slug', opts());
    assert.equal(sections[0].tasks[0].slug, '');
  });

  test('slug with numbers and hyphens', () => {
    resetCounter();
    const { sections } = parseTasksMd('- [ ] Fix bug #fix-bug-123', opts());
    assert.equal(sections[0].tasks[0].slug, 'fix-bug-123');
  });
});

describe('parseTasksMd – task body (desc, AC, CM)', () => {
  test('parses description lines', () => {
    resetCounter();
    const content = [
      '- [ ] My task',
      '    First line of desc',
      '    Second line',
    ].join('\n');
    const { sections } = parseTasksMd(content, opts());
    assert.equal(sections[0].tasks[0].desc, 'First line of desc\nSecond line');
  });

  test('parses AC field', () => {
    resetCounter();
    const content = [
      '- [ ] Task with AC',
      '    AC: Dashboard loads within 2 seconds',
    ].join('\n');
    const { sections } = parseTasksMd(content, opts());
    const task = sections[0].tasks[0];
    assert.equal(task.ac, 'Dashboard loads within 2 seconds');
    assert.equal(task.desc, '');
  });

  test('parses CM field', () => {
    resetCounter();
    const content = [
      '- [x] Done task',
      '    CM: Implemented using fetch API',
    ].join('\n');
    const { sections } = parseTasksMd(content, opts());
    const task = sections[0].tasks[0];
    assert.equal(task.cm, 'Implemented using fetch API');
    assert.equal(task.desc, '');
  });

  test('parses AC and CM alongside description', () => {
    resetCounter();
    const content = [
      '- [ ] Complex task',
      '    Some description text',
      '    AC: It works correctly',
      '    CM: Used library X',
    ].join('\n');
    const { sections } = parseTasksMd(content, opts());
    const task = sections[0].tasks[0];
    assert.equal(task.desc, 'Some description text');
    assert.equal(task.ac, 'It works correctly');
    assert.equal(task.cm, 'Used library X');
  });

  test('parses multi-line AC', () => {
    resetCounter();
    const content = [
      '- [ ] Multi-AC task',
      '    AC: First criterion',
      '    AC: Second criterion',
    ].join('\n');
    const { sections } = parseTasksMd(content, opts());
    assert.equal(sections[0].tasks[0].ac, 'First criterion\nSecond criterion');
  });

  test('parses AC with leading dash', () => {
    resetCounter();
    const content = [
      '- [ ] Task',
      '    - AC: Criterion with dash prefix',
    ].join('\n');
    const { sections } = parseTasksMd(content, opts());
    assert.equal(sections[0].tasks[0].ac, 'Criterion with dash prefix');
  });

  test('tab-indented lines are also parsed as body', () => {
    resetCounter();
    const content = '- [ ] Task\n\tDescription via tab';
    const { sections } = parseTasksMd(content, opts());
    assert.equal(sections[0].tasks[0].desc, 'Description via tab');
  });
});

describe('parseTasksMd – sections', () => {
  test('tasks before any section header go into the default section', () => {
    resetCounter();
    const content = '- [ ] Orphan task';
    const { sections } = parseTasksMd(content, opts());
    assert.equal(sections.length, 1);
    assert.equal(sections[0].id, '__default');
    assert.equal(sections[0].name, '');
  });

  test('named sections are parsed', () => {
    resetCounter();
    const content = [
      '## Backend',
      '- [ ] Write API',
      '## Frontend',
      '- [ ] Build UI',
    ].join('\n');
    const { sections } = parseTasksMd(content, opts());
    assert.equal(sections.length, 2);
    assert.equal(sections[0].name, 'Backend');
    assert.equal(sections[1].name, 'Frontend');
    assert.equal(sections[0].tasks[0].title, 'Write API');
    assert.equal(sections[1].tasks[0].title, 'Build UI');
  });

  test('section description block is parsed', () => {
    resetCounter();
    const content = [
      '## My Section',
      'Description: This section covers backend work',
      '',
      '- [ ] Task one',
    ].join('\n');
    const { sections } = parseTasksMd(content, opts());
    assert.equal(sections[0].description, 'This section covers backend work');
  });

  test('tasks are assigned the correct sectionId', () => {
    resetCounter();
    const content = [
      '## Alpha',
      '- [ ] Task A #task-a',
    ].join('\n');
    const { sections } = parseTasksMd(content, opts());
    assert.equal(sections[0].tasks[0].sectionId, sections[0].id);
  });

  test('default section is only added when there are tasks outside sections', () => {
    resetCounter();
    const content = [
      '## Section One',
      '- [ ] Task in section',
    ].join('\n');
    const { sections } = parseTasksMd(content, opts());
    // Should only have one named section, no __default
    assert.equal(sections.length, 1);
    assert.equal(sections[0].name, 'Section One');
  });
});

describe('parseTasksMd – preamble', () => {
  test('text before first section or task is captured as preamble', () => {
    resetCounter();
    const content = '# Title\n\nSome intro text\n\n- [ ] First task';
    const { preamble } = parseTasksMd(content, opts());
    assert.ok(preamble.includes('# Title'));
    assert.ok(preamble.includes('Some intro text'));
  });

  test('preamble is empty when content starts with a task', () => {
    resetCounter();
    const { preamble } = parseTasksMd('- [ ] Task', opts());
    assert.equal(preamble, '');
  });

  test('preamble is empty when content starts with a section', () => {
    resetCounter();
    const { preamble } = parseTasksMd('## Section\n- [ ] Task', opts());
    assert.equal(preamble, '');
  });
});

// ---------------------------------------------------------------------------
// toMarkdown
// ---------------------------------------------------------------------------

describe('toMarkdown', () => {
  function makeTask(overrides) {
    return { id: 'x', title: 'Task', slug: '', desc: '', ac: '', cm: '', status: 'todo', sectionId: 's', ...overrides };
  }

  test('serializes a todo task', () => {
    const sections = [{ id: '__default', name: '', description: '', tasks: [makeTask({ title: 'Do something', status: 'todo' })] }];
    assert.ok(toMarkdown(sections).includes('- [ ] Do something'));
  });

  test('serializes an ongoing task', () => {
    const sections = [{ id: '__default', name: '', description: '', tasks: [makeTask({ status: 'ongoing', title: 'Working on it' })] }];
    assert.ok(toMarkdown(sections).includes('- [/] Working on it'));
  });

  test('serializes a done task', () => {
    const sections = [{ id: '__default', name: '', description: '', tasks: [makeTask({ status: 'done', title: 'Finished' })] }];
    assert.ok(toMarkdown(sections).includes('- [x] Finished'));
  });

  test('serializes a canceled task', () => {
    const sections = [{ id: '__default', name: '', description: '', tasks: [makeTask({ status: 'canceled', title: 'Dropped' })] }];
    assert.ok(toMarkdown(sections).includes('- [-] Dropped'));
  });

  test('includes slug in output when present', () => {
    const sections = [{ id: '__default', name: '', description: '', tasks: [makeTask({ title: 'My task', slug: 'my-task' })] }];
    assert.ok(toMarkdown(sections).includes('- [ ] My task #my-task'));
  });

  test('omits slug when empty', () => {
    const sections = [{ id: '__default', name: '', description: '', tasks: [makeTask({ title: 'No slug task', slug: '' })] }];
    const md = toMarkdown(sections);
    assert.ok(!md.includes('#'));
  });

  test('indents description lines with 4 spaces', () => {
    const sections = [{ id: '__default', name: '', description: '', tasks: [makeTask({ desc: 'Line one\nLine two' })] }];
    const md = toMarkdown(sections);
    assert.ok(md.includes('    Line one'));
    assert.ok(md.includes('    Line two'));
  });

  test('serializes AC lines with AC: prefix', () => {
    const sections = [{ id: '__default', name: '', description: '', tasks: [makeTask({ ac: 'It loads fast' })] }];
    assert.ok(toMarkdown(sections).includes('    AC: It loads fast'));
  });

  test('serializes CM lines with CM: prefix', () => {
    const sections = [{ id: '__default', name: '', description: '', tasks: [makeTask({ cm: 'Used React Query' })] }];
    assert.ok(toMarkdown(sections).includes('    CM: Used React Query'));
  });

  test('serializes section headers', () => {
    const sections = [{ id: 'backend', name: 'Backend', description: '', tasks: [] }];
    assert.ok(toMarkdown(sections).includes('## Backend'));
  });

  test('serializes section description', () => {
    const sections = [{ id: 'backend', name: 'Backend', description: 'Server-side work', tasks: [] }];
    assert.ok(toMarkdown(sections).includes('Description: Server-side work'));
  });

  test('unnamed section (default) does not emit a header', () => {
    const sections = [{ id: '__default', name: '', description: '', tasks: [makeTask()] }];
    const md = toMarkdown(sections);
    assert.ok(!md.includes('##'));
  });

  test('includes preamble at the top', () => {
    const sections = [{ id: '__default', name: '', description: '', tasks: [makeTask({ title: 'Task' })] }];
    const md = toMarkdown(sections, '# My Project\n\n');
    assert.ok(md.startsWith('# My Project'));
  });

  test('always ends with exactly one newline', () => {
    const sections = [{ id: '__default', name: '', description: '', tasks: [makeTask()] }];
    const md = toMarkdown(sections);
    assert.ok(md.endsWith('\n'));
    assert.ok(!md.endsWith('\n\n'));
  });
});

// ---------------------------------------------------------------------------
// Round-trip: parseTasksMd → toMarkdown → parseTasksMd
// ---------------------------------------------------------------------------

describe('round-trip fidelity', () => {
  test('simple task survives a parse→serialize→parse cycle', () => {
    resetCounter();
    const original = '- [ ] Buy groceries #buy-groceries\n';
    const { sections, preamble } = parseTasksMd(original, opts());
    const serialized = toMarkdown(sections, preamble);
    resetCounter();
    const { sections: sections2 } = parseTasksMd(serialized, opts());
    assert.equal(sections2[0].tasks[0].title, 'Buy groceries');
    assert.equal(sections2[0].tasks[0].slug, 'buy-groceries');
    assert.equal(sections2[0].tasks[0].status, 'todo');
  });

  test('task with AC, CM, and desc survives round-trip', () => {
    resetCounter();
    const original = [
      '- [/] Implement feature #impl-feature',
      '    The feature does X',
      '    CM: Added in PR #42',
      '    AC: Feature is accessible',
    ].join('\n') + '\n';
    const { sections, preamble } = parseTasksMd(original, opts());
    const serialized = toMarkdown(sections, preamble);
    resetCounter();
    const { sections: s2 } = parseTasksMd(serialized, opts());
    const task = s2[0].tasks[0];
    assert.equal(task.status, 'ongoing');
    assert.equal(task.desc, 'The feature does X');
    assert.equal(task.cm, 'Added in PR #42');
    assert.equal(task.ac, 'Feature is accessible');
  });

  test('multi-section document survives round-trip', () => {
    resetCounter();
    const original = [
      '## Backend',
      '- [ ] Write tests #write-tests',
      '## Frontend',
      '- [x] Build UI #build-ui',
    ].join('\n') + '\n';
    const { sections, preamble } = parseTasksMd(original, opts());
    const serialized = toMarkdown(sections, preamble);
    resetCounter();
    const { sections: s2 } = parseTasksMd(serialized, opts());
    assert.equal(s2.length, 2);
    assert.equal(s2[0].name, 'Backend');
    assert.equal(s2[1].name, 'Frontend');
    assert.equal(s2[0].tasks[0].title, 'Write tests');
    assert.equal(s2[1].tasks[0].status, 'done');
  });
});
