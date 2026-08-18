const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const roots = args.filter(value => !value.startsWith("--"));
const expectedArg = args.find(value => value.startsWith("--expected="));
const expectedAbis = expectedArg
  ? new Set(expectedArg.slice("--expected=".length).split(",").map(value => value.trim()).filter(Boolean))
  : null;

if (!roots.length) {
  throw new Error("Usage: node verify-native-library-compat.js <native-lib-root> [--expected=arm64-v8a,armeabi-v7a]");
}

function findLibraries(target) {
  if (!fs.existsSync(target)) throw new Error(`Native-library audit path does not exist: ${target}`);
  const stat = fs.statSync(target);
  if (stat.isFile()) return target.endsWith(".so") ? [target] : [];
  return fs.readdirSync(target, { withFileTypes: true }).flatMap(entry => {
    const child = path.join(target, entry.name);
    return entry.isDirectory() ? findLibraries(child) : (entry.name.endsWith(".so") ? [child] : []);
  });
}

function readUnsigned64(buffer, offset, littleEndian) {
  const value = littleEndian ? buffer.readBigUInt64LE(offset) : buffer.readBigUInt64BE(offset);
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`ELF value is too large to audit safely: ${value}`);
  }
  return Number(value);
}

function auditElf(file, abi) {
  const buffer = fs.readFileSync(file);
  if (buffer.length < 64 || buffer[0] !== 0x7f || buffer.toString("ascii", 1, 4) !== "ELF") {
    throw new Error(`Native library is not a valid ELF file: ${file}`);
  }
  const elfClass = buffer[4];
  const littleEndian = buffer[5] === 1;
  if (![1, 2].includes(elfClass) || ![1, 2].includes(buffer[5])) {
    throw new Error(`Native library has an unsupported ELF layout: ${file}`);
  }
  const read16 = offset => littleEndian ? buffer.readUInt16LE(offset) : buffer.readUInt16BE(offset);
  const read32 = offset => littleEndian ? buffer.readUInt32LE(offset) : buffer.readUInt32BE(offset);
  const programOffset = elfClass === 2 ? readUnsigned64(buffer, 32, littleEndian) : read32(28);
  const programEntrySize = read16(elfClass === 2 ? 54 : 42);
  const programCount = read16(elfClass === 2 ? 56 : 44);
  if (!programOffset || !programEntrySize || !programCount) {
    throw new Error(`Native library has no auditable ELF program table: ${file}`);
  }
  let loadSegments = 0;
  let hasRelro = false;
  for (let index = 0; index < programCount; index += 1) {
    const offset = programOffset + (index * programEntrySize);
    if (offset + programEntrySize > buffer.length) {
      throw new Error(`Native library has a truncated ELF program table: ${file}`);
    }
    const type = read32(offset);
    if (type === 0x6474e552) hasRelro = true;
    if (type !== 1) continue;
    loadSegments += 1;
    const alignment = elfClass === 2
      ? readUnsigned64(buffer, offset + 48, littleEndian)
      : read32(offset + 28);
    const requiredAlignment = abi === "arm64-v8a" || abi === "x86_64" ? 0x4000 : 0x1000;
    if (alignment < requiredAlignment || alignment % requiredAlignment !== 0) {
      throw new Error(`Native library has a LOAD segment below its required ${requiredAlignment / 1024} KB alignment (${alignment}): ${file}`);
    }
  }
  if (!loadSegments) throw new Error(`Native library has no LOAD segments: ${file}`);
  if (!hasRelro) throw new Error(`Native library is missing GNU_RELRO: ${file}`);
  return { loadSegments };
}

const libraries = [...new Set(roots.flatMap(findLibraries))].sort();
if (!libraries.length) throw new Error("Native-library audit found no shared libraries.");
const observedAbis = new Set();
let totalLoadSegments = 0;
for (const library of libraries) {
  const abi = path.basename(path.dirname(library));
  observedAbis.add(abi);
  totalLoadSegments += auditElf(library, abi).loadSegments;
}
if (expectedAbis) {
  const missing = [...expectedAbis].filter(abi => !observedAbis.has(abi));
  const unexpected = [...observedAbis].filter(abi => !expectedAbis.has(abi));
  if (missing.length || unexpected.length) {
    throw new Error(`Native ABI audit failed. Missing: ${missing.join(", ") || "none"}; unexpected: ${unexpected.join(", ") || "none"}.`);
  }
}

console.log(`Native library compatibility passed: ${libraries.length} libraries, ${totalLoadSegments} LOAD segments, ABIs ${[...observedAbis].sort().join(", ")}.`);
