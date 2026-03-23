/**
 * Pure functions for parsing and serializing TASKS.md markdown.
 *
 * These are extracted from dashboard.js so they can be unit-tested without a browser
 * environment. The dashboard continues to use its own inline copies; this module is
 * the authoritative, testable specification.
 */

const STATUS_SYMBOLS = { todo: '[ ]', ongoing: '[/]', done: '[x]', canceled: '[-]' };

function defaultMakeId(name) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return slug || 'section-' + Math.random().toString(36).slice(2, 9);
}

function defaultUid() {
  return String(Date.now()) + Math.random().toString(36).slice(2);
}

function splitMultiline(value) {
  return (value || '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map(line => line.replace(/\s+$/g, ''))
    .filter(line => line !== '');
}

/**
 * @param {object} task - Mutable task object (modified in-place)
 * @param {string[]} descLines - Raw indented lines collected under the task
 */
function flushTask(task, descLines) {
  let full = descLines.join('\n').trim();

  const acLines = [...full.matchAll(/^-?\s*AC:\s*(.*)$/gm)]
    .map(m => (m[1] || '').replace(/\s+$/g, ''))
    .filter(line => line !== '');
  if (acLines.length) {
    task.ac = acLines.join('\n');
    full = full.replace(/^-?\s*AC:\s*.*$/gm, '');
  }

  const cmLines = [...full.matchAll(/^-?\s*CM:\s*(.*)$/gm)]
    .map(m => (m[1] || '').replace(/\s+$/g, ''))
    .filter(line => line !== '');
  if (cmLines.length) {
    task.cm = cmLines.join('\n');
    full = full.replace(/^-?\s*CM:\s*.*$/gm, '');
  }

  task.desc = full.replace(/\n{2,}/g, '\n').trim();
}

/**
 * Parse TASKS.md content into a sections/tasks data structure.
 *
 * @param {string} content - Raw TASKS.md file content
 * @param {object} [opts]
 * @param {function(string): string} [opts.makeId] - Converts section name → id (injectable for tests)
 * @param {function(): string} [opts.uid] - Generates unique task id (injectable for tests)
 * @returns {{ sections: Section[], preamble: string }}
 *
 * @typedef {{ id: string, name: string, description: string, tasks: Task[] }} Section
 * @typedef {{ id: string, title: string, slug: string, desc: string, ac: string, cm: string, status: string, sectionId: string }} Task
 */
export function parseTasksMd(content, { makeId = defaultMakeId, uid = defaultUid } = {}) {
  const result = [];
  let pre = '';
  const defaultSection = { id: '__default', name: '', description: '', tasks: [] };
  let currentSection = defaultSection;
  let currentTask = null;
  let inDesc = false;
  let descSectionLines = [];
  let descLines = [];
  let seenSection = false;

  for (const line of content.split('\n')) {
    // Section header
    const sectionMatch = line.match(/^## (.+)$/);
    if (sectionMatch) {
      if (currentTask) { flushTask(currentTask, descLines); currentSection.tasks.push(currentTask); currentTask = null; descLines = []; }
      if (inDesc) { currentSection.description = descSectionLines.join(' ').trim(); inDesc = false; descSectionLines = []; }
      const name = sectionMatch[1].trim();
      currentSection = { id: makeId(name), name, description: '', tasks: [] };
      result.push(currentSection);
      seenSection = true;
      continue;
    }

    // Section description block (only outside a task)
    if (currentSection && !currentTask) {
      const descStart = line.match(/^Description:\s*(.*)$/);
      if (descStart) { inDesc = true; descSectionLines = [descStart[1]]; continue; }
      if (inDesc) {
        if (line.trim() === '' && descSectionLines.length > 0) {
          currentSection.description = descSectionLines.join(' ').trim();
          inDesc = false;
          descSectionLines = [];
          continue;
        }
        descSectionLines.push(line.trim());
        continue;
      }
    }

    // Task line: - [ ], - [/], - [x], - [X], - [-]
    const taskMatch = line.match(/^- \[([ xX/-])\]\s*(.*)$/);
    if (taskMatch) {
      if (inDesc) { currentSection.description = descSectionLines.join(' ').trim(); inDesc = false; descSectionLines = []; }
      if (currentTask) { flushTask(currentTask, descLines); currentSection.tasks.push(currentTask); }
      const sym = taskMatch[1];
      let status = 'todo';
      if (sym === 'x' || sym === 'X') status = 'done';
      else if (sym === '/') status = 'ongoing';
      else if (sym === '-') status = 'canceled';
      const rawTitle = taskMatch[2].trim();
      const slugMatch = rawTitle.match(/^(.+?)\s+#([\w-]+)$/);
      const titleText = slugMatch ? slugMatch[1].trim() : rawTitle;
      const slug = slugMatch ? slugMatch[2] : '';
      currentTask = { id: uid(), title: titleText, slug, desc: '', ac: '', cm: '', status, sectionId: currentSection.id };
      descLines = [];
      continue;
    }

    // Indented body line (task description / AC / CM)
    if (currentTask && (line.startsWith('    ') || line.startsWith('\t'))) {
      descLines.push(line.replace(/^[ ]{4}|\t/, ''));
      continue;
    }

    // Blank line inside a task — ignored
    if (currentTask && line.trim() === '') continue;

    // Non-indented, non-blank line after a task — flush the task
    if (currentTask && line.trim() !== '') {
      flushTask(currentTask, descLines);
      currentSection.tasks.push(currentTask);
      currentTask = null;
      descLines = [];
    }

    // Preamble: lines before the first section or task
    if (!seenSection && !currentTask && defaultSection.tasks.length === 0) pre += line + '\n';
  }

  if (inDesc && currentSection) currentSection.description = descSectionLines.join(' ').trim();
  if (currentTask) { flushTask(currentTask, descLines); currentSection.tasks.push(currentTask); }

  if (defaultSection.tasks.length > 0) {
    result.unshift(defaultSection);
  }

  return { sections: result, preamble: pre };
}

/**
 * Serialize sections back to TASKS.md markdown.
 *
 * @param {Section[]} sections
 * @param {string} [preamble] - Text before the first section/task
 * @returns {string} Markdown content (always ends with a single newline)
 */
export function toMarkdown(sections, preamble = '') {
  let md = preamble;
  for (const section of sections) {
    if (section.name) {
      md += `## ${section.name}\n\n`;
      if (section.description) md += `Description: ${section.description}\n\n`;
    }
    for (const t of section.tasks) {
      md += `- ${STATUS_SYMBOLS[t.status] || '[ ]'} ${t.title}${t.slug ? ' #' + t.slug : ''}\n`;
      if (t.desc) t.desc.split('\n').forEach(l => { md += `    ${l}\n`; });
      if (t.cm) splitMultiline(t.cm).forEach(line => { md += `    CM: ${line}\n`; });
      if (t.ac) splitMultiline(t.ac).forEach(line => { md += `    AC: ${line}\n`; });
    }
  }
  return md.trimEnd() + '\n';
}
