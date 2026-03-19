// ============================================================
//  obfuscate.js — Raiz do projeto
//  npm install javascript-obfuscator --save-dev
//  node obfuscate.js
//
//  FONTE DA VERDADE: /obf/Apps/  (originais limpos — EDITE AQUI)
//  SAÍDA:            /Apps/      (obfuscado — Vercel serve daqui)
//
//  Pode rodar quantas vezes quiser — sempre lê /obf/, nunca
//  obfusca o que já está obfuscado.
//
//  PRIMEIRA VEZ só:
//    Se /obf/Apps/ ainda não existir, copia /Apps/ pra lá
//    como ponto de partida (bootstrap).
// ============================================================

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

const ROOT    = __dirname;
const ORIGIN  = path.join(ROOT, 'obf', 'Apps'); // originais limpos
const DEST    = path.join(ROOT, 'Apps');         // obfuscados pro Vercel

function ensureDir(d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

function copyDir(src, dst) {
  ensureDir(dst);
  for (const entry of fs.readdirSync(src)) {
    const s = path.join(src, entry);
    const d = path.join(dst, entry);
    if (fs.statSync(s).isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function obfCode(code) {
  return JavaScriptObfuscator.obfuscate(code, OBF_OPTIONS).getObfuscatedCode();
}

// ── Bootstrap: primeira vez, copia /Apps → /obf/Apps ──
if (!fs.existsSync(ORIGIN)) {
  if (!fs.existsSync(DEST)) {
    console.error('❌ Nem /Apps/ nem /obf/Apps/ encontrados.');
    process.exit(1);
  }
  console.log('🆕 Primeira execução: copiando /Apps/ → /obf/Apps/ como ponto de partida...');
  copyDir(DEST, ORIGIN);
  console.log('✅ /obf/Apps/ criado com seus originais.\n');
  console.log('⚠️  A partir de agora, EDITE sempre em /obf/Apps/ e rode node obfuscate.js\n');
}

// ── Lê os apps de /obf/Apps/ (originais) ──
const apps = fs.readdirSync(ORIGIN).filter(n =>
  fs.statSync(path.join(ORIGIN, n)).isDirectory()
);

console.log(`🔍 ${apps.length} app(s) encontrados em /obf/Apps/\n`);

let ok = 0, skip = 0;

for (const app of apps) {
  const srcApp  = path.join(ORIGIN, app); // original limpo
  const dstApp  = path.join(DEST,   app); // onde escreve obfuscado
  ensureDir(dstApp);

  const scriptSrc = path.join(srcApp, 'script.js');
  const htmlSrc   = path.join(srcApp, 'main.html');
  const scriptDst = path.join(dstApp, 'script.js');
  const htmlDst   = path.join(dstApp, 'main.html');

  // Copia todos assets não-JS (css, imgs, etc.)
  for (const entry of fs.readdirSync(srcApp)) {
    const s = path.join(srcApp, entry);
    const d = path.join(dstApp, entry);
    if (fs.statSync(s).isDirectory()) copyDir(s, d);
    else if (path.extname(entry).toLowerCase() !== '.js') fs.copyFileSync(s, d);
  }

  // ── CASO 1: tem script.js ──
  if (fs.existsSync(scriptSrc)) {
    const code = fs.readFileSync(scriptSrc, 'utf8');
    try {
      fs.writeFileSync(scriptDst, obfCode(code));
      if (fs.existsSync(htmlSrc)) fs.copyFileSync(htmlSrc, htmlDst);
      console.log(`✅ [script.js]  ${app}`);
      ok++;
    } catch(e) {
      console.error(`❌ ${app}: ${e.message.slice(0, 80)}`);
      skip++;
    }
    continue;
  }

  // ── CASO 2: sem script.js, extrai inline do HTML ──
  if (fs.existsSync(htmlSrc)) {
    const html = fs.readFileSync(htmlSrc, 'utf8');

    const matches = [...html.matchAll(/<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi)]
      .map(m => ({ full: m[0], code: m[1].trim() }))
      .filter(m => m.code.length > 100)
      .sort((a, b) => b.code.length - a.code.length);

    if (!matches.length) {
      fs.copyFileSync(htmlSrc, htmlDst);
      console.warn(`⚠️  ${app} — sem script inline, copiado sem alterar`);
      skip++;
      continue;
    }

    try {
      let newHtml = html;
      const main  = matches[0];

      // Maior script → script.js obfuscado separado
      fs.writeFileSync(scriptDst, obfCode(main.code));
      newHtml = newHtml.replace(main.full, `<script src="script.js"></script>`);

      // Scripts menores → obfusca inline
      for (let i = 1; i < matches.length; i++) {
        try { newHtml = newHtml.replace(matches[i].full, `<script>${obfCode(matches[i].code)}</script>`); }
        catch(_) {}
      }

      fs.writeFileSync(htmlDst, newHtml);
      console.log(`✅ [inline→js]  ${app}`);
      ok++;
    } catch(e) {
      console.error(`❌ ${app}: ${e.message.slice(0, 80)}`);
      skip++;
    }
    continue;
  }

  console.warn(`⚠️  ${app} — sem main.html nem script.js`);
  skip++;
}

console.log(`\n${'─'.repeat(50)}`);
console.log(`🔒 ${ok} obfuscado(s)  |  ⚠️  ${skip} ignorado(s)`);
console.log(`\n📂 /obf/Apps/  → seus originais (edite aqui)`);
console.log(`📂 /Apps/      → obfuscados (Vercel serve daqui)`);
console.log(`\n🚀 git add . && git commit -m "deploy" && git push`);
console.log(`💡 /obf/ no .gitignore — não vai pro GitHub\n`);