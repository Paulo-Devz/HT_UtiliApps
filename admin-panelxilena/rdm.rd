# 📡 Como usar as APIs — Guia de fetch e insert

---

## Como pegar o IP do usuário no front-end

```javascript
// Opção 1 — API externa (mais confiável, pega o IP real)
fetch('https://api.ipify.org?format=json')
  .then(r => r.json())
  .then(d => console.log('Meu IP:', d.ip));

// Opção 2 — Sua própria API /api/check-ip (pega via header do Vercel)
fetch('/api/check-ip?action=check')
  .then(r => r.json())
  .then(d => console.log('IP detectado pelo servidor:', d.ip));
```

> O servidor pega o IP assim (nos arquivos `.js` da API):
> ```javascript
> function getIp(req) {
>   return (req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '')
>     .split(',')[0].trim();
> }
> ```
> Você **não precisa mandar o IP no body** — o servidor detecta automaticamente pelo header `x-forwarded-for` que o Vercel injeta.

---

## 1. API de Programas `/api/admin_reneavues/progamas`

### ✅ Registrar que um programa foi aberto

Cole isso no `ads-logic.js`, dentro de `abrirPrograma()`:

```javascript
function registrarPrograma(nome) {
  fetch('/api/admin_reneavues/progamas?action=registrar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome: nome })
  }).catch(() => {});
}
```

Chame assim:
```javascript
registrarPrograma('EduGen');        // nome do app
registrarPrograma('FastAnswer_AI'); // ou o nome que vier do JSON
```

### 📊 Buscar ranking de programas (admin)

```javascript
// Top 20 mais usados hoje
fetch('/api/admin_reneavues/progamas?action=ranking&periodo=1d')
  .then(r => r.json())
  .then(data => console.log(data.ranking));
// Retorna: [{ progama_nome: 'EduGen', usos: 5 }, ...]

// Histórico completo com IP — últimos 7 dias
fetch('/api/admin_reneavues/progamas?action=historico&periodo=7d')
  .then(r => r.json())
  .then(data => console.log(data.historico));
// Retorna: [{ id, data_progama, ip, progama_nome, criado_em }, ...]

// Buscar por nome ou IP
fetch('/api/admin_reneavues/progamas?action=historico&periodo=7d&search=EduGen')
  .then(r => r.json())
  .then(data => console.log(data.historico));

// Estatísticas gerais
fetch('/api/admin_reneavues/progamas?action=stats&periodo=30d')
  .then(r => r.json())
  .then(data => {
    console.log('Total acessos:', data.acessos);
    console.log('Únicos:',       data.unicos);
    console.log('Mais popular:', data.top);
    console.log('No banco:',     data.total_banco);
  });
```

### 🗑️ Resetar histórico (admin)

```javascript
fetch('/api/admin_reneavues/progamas?action=resetar', { method: 'POST' })
  .then(r => r.json())
  .then(d => console.log(d));
```

---

## 2. API de Anúncios `/api/admin_reneavues/anuncios`

### ✅ Registrar que um anúncio foi rodado

Cole no `ads-logic.js`, dentro de `registrarPropaganda()`:

```javascript
function registrarAnuncio() {
  fetch('/api/admin_reneavues/anuncios?action=registrar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  }).catch(() => {});
}
```

### 📊 Buscar stats de anúncios (admin)

```javascript
// Stats do dia
fetch('/api/admin_reneavues/anuncios?action=stats&periodo=1d')
  .then(r => r.json())
  .then(data => {
    console.log('Total hoje:', data.total);
    console.log('Histórico por dia:', data.historico);
    // historico: [{ data: '2025-04-01', total: 12 }, ...]
    console.log('Total no banco:', data.total_banco);
  });
```

---

## 3. API de Pesquisas `/api/admin_reneavues/pesquisas`

### ✅ Registrar uma pesquisa feita pelo usuário

Cole na página de `aplicacoes.js`, no evento da barra de busca:

```javascript
function registrarPesquisa(termo) {
  if (!termo || termo.trim().length < 2) return;
  fetch('/api/admin_reneavues/pesquisas?action=registrar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ termo: termo.trim() })
  })
  .then(r => r.json())
  .then(d => {
    // d.nivel retorna 'safe', 'warn' ou 'danger'
    // você pode usar isso pra mostrar algo pro usuário se quiser
    console.log('Nível da busca:', d.nivel);
  })
  .catch(() => {});
}
```

Chame assim no `aplicacoes.js`:

```javascript
// Onde já tem o listener de busca
searchInput.addEventListener('input', (e) => {
  const termo = e.target.value.trim();
  renderPrograms(termo);
  // Registra após 800ms parado (debounce)
  clearTimeout(window._searchTimer);
  window._searchTimer = setTimeout(() => {
    if (termo.length >= 2) registrarPesquisa(termo);
  }, 800);
});

// Ou no Enter
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') registrarPesquisa(e.target.value.trim());
});
```

### 📊 Buscar pesquisas (admin)

```javascript
// Histórico completo
fetch('/api/admin_reneavues/pesquisas?action=historico&periodo=7d')
  .then(r => r.json())
  .then(data => console.log(data.pesquisas));
// Retorna: [{ id, ip, termo, nivel, criado_em }, ...]

// Filtrar por nível
fetch('/api/admin_reneavues/pesquisas?action=historico&periodo=7d&nivel=danger')
  .then(r => r.json())
  .then(data => console.log(data.pesquisas));

// Stats
fetch('/api/admin_reneavues/pesquisas?action=stats&periodo=1d')
  .then(r => r.json())
  .then(data => {
    console.log('Total:', data.total);
    console.log('Suspeitas:', data.danger);
    console.log('Alertas:', data.warn);
  });
```

---

## 4. API de IPs `/api/admin_reneavues/ips`

### ✅ Verificar se o IP do usuário está bloqueado

Coloque isso no início de qualquer página que queira proteger:

```javascript
// Verifica e redireciona automaticamente se bloqueado
fetch('/api/admin_reneavues/ips?action=check')
  .then(r => r.json())
  .then(d => {
    if (d.bloqueado) window.location.replace('/');
    // d.ip tem o IP detectado pelo servidor
    console.log('IP do usuário:', d.ip);
  })
  .catch(() => {});
```

Ou use o `ip-guard.js` na raiz — é a mesma coisa já pronta:
```html
<script src="/ip-guard.js"></script>
```

### 📊 Listar IPs bloqueados (admin)

```javascript
fetch('/api/admin_reneavues/ips?action=listar')
  .then(r => r.json())
  .then(data => console.log(data.ips));
// Retorna: [{ ip: '1.2.3.4', motivo: '...', criado_em: '...' }, ...]
```

### 🚫 Bloquear IP (admin)

```javascript
fetch('/api/admin_reneavues/ips?action=bloquear', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ip: '1.2.3.4', motivo: 'spam' })
});
```

### ✅ Desbloquear IP (admin)

```javascript
fetch('/api/admin_reneavues/ips?action=desbloquear', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ip: '1.2.3.4' })
});
```

---

## 5. Resumão — onde colocar cada chamada

| Chamada | Arquivo | Onde |
|---------|---------|------|
| `registrarPrograma(nome)` | `ads-logic.js` | dentro de `abrirPrograma()`, antes do redirect |
| `registrarAnuncio()` | `ads-logic.js` | dentro de `registrarPropaganda()` |
| `registrarPesquisa(termo)` | `aplicacoes.js` | no input/enter da barra de busca |
| `check` de IP | qualquer página | no início do `<script>` ou via `ip-guard.js` |

---

## 6. Como o servidor detecta o IP automaticamente

Você **não precisa mandar o IP** nas requisições POST — o servidor lê do header `x-forwarded-for` que o Vercel injeta automaticamente:

```javascript
// Dentro de qualquer arquivo de API (.js no Vercel)
function getIp(req) {
  return (req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '')
    .split(',')[0].trim();
}

// Uso:
const ip = getIp(req); // IP real do usuário que fez a requisição
```

Isso funciona porque o Vercel é um proxy reverso — ele injeta o IP real do visitante no header antes de chamar sua função.