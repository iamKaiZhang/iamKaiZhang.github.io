// GitHub Contents API access for the learning repo. Token and repo live in localStorage
// under the same keys the old reader used (gh_pat, gh_repo), so existing setups keep working.
import { store } from './util.js';

export const DEFAULT_REPO = 'iamKaiZhang/german-learning';
export const ghPat = () => store.get('gh_pat', '');
export const ghRepo = () => store.get('gh_repo', '') || DEFAULT_REPO;

export function toB64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
export function fromB64(b64) {
  const bin = atob(b64.replace(/\n/g, ''));
  return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
}

class GhError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

async function request(path, { method = 'GET', body, accept = 'application/vnd.github+json' } = {}) {
  const headers = { Accept: accept };
  if (ghPat()) headers.Authorization = `Bearer ${ghPat()}`;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`https://api.github.com/repos/${ghRepo()}/${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined, cache: 'no-store',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new GhError(res.status, err.message || `HTTP ${res.status}`);
  }
  return accept.includes('raw') ? res.text() : res.json();
}

// Returns { text, sha } or null when the file does not exist.
export async function getFile(path) {
  try {
    const data = await request(`contents/${path}`);
    if (Array.isArray(data)) throw new GhError(400, `${path} is a folder`);
    if (data.content !== undefined && data.encoding === 'base64' && data.content !== '') {
      return { text: fromB64(data.content), sha: data.sha };
    }
    // Files over 1 MB come back without content; fetch the raw bytes instead.
    const text = await request(`contents/${path}`, { accept: 'application/vnd.github.raw+json' });
    return { text, sha: data.sha };
  } catch (e) {
    if (e.status === 404) return null;
    throw e;
  }
}

// Lists a folder: [{ name, path, sha, type }] or [] when it does not exist.
export async function listDir(path) {
  try {
    const data = await request(`contents/${path}`);
    return Array.isArray(data) ? data.map(f => ({ name: f.name, path: f.path, sha: f.sha, type: f.type })) : [];
  } catch (e) {
    if (e.status === 404) return [];
    throw e;
  }
}

export async function putFile(path, text, message, sha) {
  const body = { message, content: toB64(text) };
  if (sha) body.sha = sha;
  const res = await request(`contents/${path}`, { method: 'PUT', body });
  return res.content?.sha;
}

// Writes a file, re-reading it first. On a conflict (someone else wrote in between),
// `merge(remoteText, localText)` produces the text to retry with.
export async function writeFile(path, text, message, merge) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const current = await getFile(path);
    let out = text;
    if (current && merge) out = merge(current.text, text);
    try {
      return await putFile(path, out, message, current?.sha);
    } catch (e) {
      if (e.status !== 409 && e.status !== 422) throw e;
    }
  }
  throw new Error(`Konnte ${path} nicht speichern (Konflikt).`);
}

export async function checkAccess() {
  const res = await fetch(`https://api.github.com/repos/${ghRepo()}`, {
    headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${ghPat()}` },
  });
  if (!res.ok) throw new Error(res.status === 404 ? 'Repository nicht gefunden oder kein Zugriff.' : `GitHub antwortet mit ${res.status}.`);
  const repo = await res.json();
  return { name: repo.full_name, canWrite: !!repo.permissions?.push };
}
