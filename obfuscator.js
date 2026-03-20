const fs   = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

const OBF_OPTIONS = {
  compact:                             true,
  controlFlowFlattening:               true,
  controlFlowFlatteningThreshold:      1,
  deadCodeInjection:                   true,
  deadCodeInjectionThreshold:          0.4,
  debugProtection:                     false,
  disableConsoleOutput:                true,
  identifierNamesGenerator:           'hexadecimal',
  numbersToExpressions:                true,
  renameGlobals:                       false,
  selfDefending:                       false,
  simplify:                            true,
  splitStrings:                        true,
  splitStringsChunkLength:             3,
  stringArray:                         true,
  stringArrayCallsTransform:           true,
  stringArrayCallsTransformThreshold:  1,
  stringArrayEncoding:                ['rc4'],
  stringArrayIndexShift:               true,
  stringArrayRotate:                   true,
  stringArrayShuffle:                  true,
  stringArrayWrappersCount:            5,
  stringArrayWrappersChunkLength:      5,
  stringArrayWrappersParametersMaxCount: 5,
  stringArrayWrappersType:            'function',
  stringArrayThreshold:                1,
  transformObjectKeys:                 true,
  unicodeEscapeSequence:               false,
};

const ROOT = __dirname;
const APPS = path.join(ROOT, 'Apps');
const OBF  = path.join(ROOT, 'obf', 'Apps');

function ensureDir(d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

function copyDir(src, dst) {
  ensureDir(dst);
  for (const entry of fs.readdirSync(src)) {
    const s = path.join(src, entry);
    const d = path.join(dst, entry);
    fs.statSync(s).isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}

function isObfuscated(code) {
  const signals = [
    /\bvar\s+_0x[a-f0-9]{4,}\b/,
    /\b_0x[a-f0-9]{4,}\s*\(/,
    /\['\\x[0-9a-f]{2}/,
    /String\[.fromCharCode.\]/,
    /\+!\[\]\+!\[\]/,
  ];
  const matches = signals.filter(r => r.test(code)).length;
  return matches >= 2;
}

function extractJS(appDir) {
  const scriptPath = path.join(appDir, 'script.js');
  const htmlPath   = path.join(appDir, 'main.html');

  if (fs.existsSync(scriptPath)) {
    return { type: 'file', code: fs.readFileSync(scriptPath, 'utf8'), scriptPath, htmlPath };
  }

  if (fs.existsSync(htmlPath)) {
    const html = fs.readFileSync(htmlPath, 'utf8');
    const matches = [...html.matchAll(/<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi)]
      .map(m => ({ full: m[0], code: m[1].trim() }))
      .filter(m => m.code.length > 100)
      .sort((a, b) => b.code.length - a.code.length);

    if (matches.length) {
      return { type: 'inline', code: matches[0].code, allMatches: matches, htmlPath, scriptPath };
    }
  }

  return null;
}

function writeObfuscated(appDir, extracted) {
  const obfed = JavaScriptObfuscator.obfuscate(extracted.code, OBF_OPTIONS).getObfuscatedCode();

  if (extracted.type === 'file') {
    fs.writeFileSync(extracted.scriptPath, obfed);
    return;
  }

  let html = fs.readFileSync(extracted.htmlPath, 'utf8');
  html = html.replace(extracted.allMatches[0].full, `<script>${obfed}</script>`);

  for (let i = 1; i < extracted.allMatches.length; i++) {
    try {
      const obfSmall = JavaScriptObfuscator.obfuscate(extracted.allMatches[i].code, OBF_OPTIONS).getObfuscatedCode();
      html = html.replace(extracted.allMatches[i].full, `<script>${obfSmall}</script>`);
    } catch(_) {}
  }

  fs.writeFileSync(extracted.htmlPath, html);
}

ensureDir(APPS);
ensureDir(OBF);

const apps = fs.readdirSync(APPS).filter(n =>
  fs.statSync(path.join(APPS, n)).isDirectory()
);

console.log(`\n🔍 ${apps.length} app(s) encontrado(s) em /Apps/\n`);

let done = 0, skipped = 0, errors = 0;

for (const app of apps) {
  const appDir    = path.join(APPS, app);
  const backupDir = path.join(OBF, app);

  const extracted = extractJS(appDir);

  if (!extracted) {
    console.warn(`⚠️  ${app} — nenhum JS encontrado, ignorado`);
    skipped++;
    continue;
  }

  if (isObfuscated(extracted.code)) {
    console.log(`⏭  ${app} — já ofuscado`);
    skipped++;
    continue;
  }

  const hasBackup = fs.existsSync(backupDir);

  if (hasBackup) {
    console.log(`⏭  ${app} — backup já existe em /obf/Apps/, pulando`);
    skipped++;
    continue;
  }

  console.log(`📋 ${app} — copiando original pra /obf/Apps/...`);
  copyDir(appDir, backupDir);

  try {
    writeObfuscated(appDir, extracted);
    console.log(`✅ ${app} — ofuscado`);
    done++;
  } catch(e) {
    console.error(`❌ ${app} — erro ao ofuscar: ${e.message.slice(0, 100)}`);
    errors++;
  }
}

console.log(`\n${'─'.repeat(50)}`);
console.log(`🔒 ${done} ofuscado(s)  |  ⏭  ${skipped} ignorado(s)  |  ❌ ${errors} erro(s)`);
console.log(`\n📂 /obf/Apps/  → originais limpos (nunca sobrescritos)`);
console.log(`📂 /Apps/      → ofuscados (Vercel serve daqui)`);
console.log(`\n🚀 git add . && git commit -m "deploy" && git push\n`);