// Usage:  npm run hash -- 25.10.2006
// Prints the digest to paste into GATE_DIGEST in src/lib/gate.js
import { parseDate, digestFor } from '../src/lib/gate.js';

const input = process.argv[2];
const canonical = parseDate(input);
if (!canonical) {
  console.error('Please pass a valid date, e.g.  npm run hash -- 25.10.2006');
  process.exit(1);
}
console.log(digestFor(canonical));
