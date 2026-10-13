import { sha256Hex } from './sha256.js';

// The accepted date is NOT stored in plain text. Only a salted, stretched
// SHA-256 digest of the canonical date (YYYY-MM-DD) lives in the source.
// To change the date run:  npm run hash -- DD.MM.YYYY
const SALT = 'for-nisha/gate/v1';
const ROUNDS = 1500;
export const GATE_DIGEST = 'de6feaf9c3ad502578c81ce5b25c13f4ee744a8657dcef04f58f51e6ac03490f';

/**
 * Turns "25.10.2006", "25/10/2006", "25-10-2006", "25 10 2006" or "25102006"
 * into a canonical "YYYY-MM-DD" string. Returns null for anything that is not
 * a real calendar date.
 */
export function parseDate(raw) {
  const text = String(raw ?? '').trim();
  let parts = text.split(/[^0-9]+/).filter(Boolean);
  if (parts.length === 1 && /^\d{8}$/.test(parts[0])) {
    const p = parts[0];
    parts = [p.slice(0, 2), p.slice(2, 4), p.slice(4, 8)];
  }
  if (parts.length !== 3) return null;
  const [d, m, y] = parts;
  if (d.length > 2 || m.length > 2 || y.length !== 4) return null;

  const D = Number(d);
  const M = Number(m);
  const Y = Number(y);
  const date = new Date(Date.UTC(Y, M - 1, D));
  if (
    date.getUTCFullYear() !== Y ||
    date.getUTCMonth() !== M - 1 ||
    date.getUTCDate() !== D
  ) {
    return null;
  }
  return `${y}-${String(M).padStart(2, '0')}-${String(D).padStart(2, '0')}`;
}

export function digestFor(canonical) {
  let h = `${SALT}|${canonical}`;
  for (let i = 0; i < ROUNDS; i++) h = sha256Hex(`${h}|${SALT}`);
  return h;
}

function sameString(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Resolves true only for the exact accepted calendar date. */
export async function checkDate(raw) {
  const canonical = parseDate(raw);
  // Always do the same amount of work and wait a beat, right or wrong.
  const digest = digestFor(canonical ?? '0000-00-00');
  await new Promise((resolve) => setTimeout(resolve, 420));
  return canonical !== null && sameString(digest, GATE_DIGEST);
}
