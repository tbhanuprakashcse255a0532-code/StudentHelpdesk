const crypto = require('node:crypto');
if (typeof crypto.argon2 !== 'function') {
  throw new Error('Install Node.js 24.7+ (24.x) or a newer compatible release; built-in Argon2 is required.');
}
console.log('Runtime OK:', process.version);

