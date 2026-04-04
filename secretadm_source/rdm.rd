# 📚 Guia Rápido Secret Admin - Como enviar propaganda e programas

## 🚀 Como funciona o sistema
O admin registra:
- **Anúncios**: Cada visualização → POST `/api/admin/admin?section=anuncios&action=registrar`
- **Programas**: Clique no app → POST `/api/admin/admin?section=programas&action=registrar` com `{nome: 'NomeApp'}`
- **Pesquisas**: Barra de busca em aplicacoes.html → POST `/api/admin/admin?section=pesquisas&action=registrar` com `{termo: query}`

**IP real**: Backend usa `x-forwarded-for` header (Vercel proxy).

## 📤 Enviar Propaganda (Anúncios)
```
fetch('/api/admin/admin?section=anuncios&action=registrar', {method: 'POST'})
```
Chame toda vez que ad mostrar.

## 🖥️ Enviar Programa
```
fetch('/api/admin/admin?section=programas&action=registrar', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({nome: 'MeuApp'})
})
```

## 🔍 Pesquisa (aplicacoes.js)
Na barra de busca:
```
fetch('/api/admin/admin?section=pesquisas&action=registrar', {
  method: 'POST',
  body: JSON.stringify({termo: searchTerm})
})
```

## 🛡️ Ban IP
Admin → IPs → Bloquear → DB `ips_bloqueados`
ip-blocker.js checa, redireciona ban.html (mostra motivo).

**Exemplo completo ads-logic.js** (já atualizado):
```
async function registrarPropaganda() { ... } // cada ad
async function registrarPrograma(nome) { ... } // cada clique app
```

**Deploy**: `npx vercel --prod`
**Logs**: Vercel dashboard → utiliapps → Logs

Admin: /admin-panelxilena/admin.html
