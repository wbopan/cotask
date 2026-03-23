/**
 * Pure functions for parsing TASKS.md content on the server side.
 * Extracted so they can be unit-tested independently of the HTTP server.
 */

/**
 * Parse TASKS.md content and return task statistics and active slugs.
 *
 * Active slugs are extracted from todo/ongoing lines only (not done/backlog),
 * matching the `#slug` suffix pattern.
 *
 * @param {string} content - Raw TASKS.md file content
 * @returns {{ stats: { todo, ongoing, done, backlog, total }, activeTaskSlugs: Set<string> }}
 */
export function parseTasksStats(content) {
  const stats = { todo: 0, ongoing: 0, done: 0, backlog: 0, total: 0 };
  const activeTaskSlugs = new Set();
  for (const line of content.split('\n')) {
    if (/^- \[ \]/.test(line)) { stats.todo++; stats.total++; }
    else if (/^- \[\/\]/.test(line)) { stats.ongoing++; stats.total++; }
    else if (/^- \[x\]/i.test(line)) { stats.done++; stats.total++; }
    else if (/^- \[-\]/.test(line)) { stats.backlog++; stats.total++; }
    const m = line.match(/^- \[[ /]\] .+#([\w-]+)\s*$/);
    if (m) activeTaskSlugs.add(m[1]);
  }
  return { stats, activeTaskSlugs };
}

/**
 * Encode a filesystem absolute path into the Claude Code project directory name format.
 *
 * Rules:
 *   - Leading `/` becomes `-`
 *   - `/.` (hidden dir separator) becomes `--`
 *   - Remaining `/` become `-`
 *
 * @param {string} absPath - Absolute filesystem path
 * @returns {string} Encoded directory name
 */
export function encodeProjectPath(absPath) {
  return absPath
    .replace(/^\//, '-')
    .replace(/\/\./g, '--')
    .replace(/\//g, '-');
}
