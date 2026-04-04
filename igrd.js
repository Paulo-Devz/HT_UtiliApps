/*
  ip-guard.js — Raiz do projeto
  ═══════════════════════════════════════════════════════════
  Inclua em QUALQUER página que queira proteger contra IPs
  bloqueados:

    <script src="/ip-guard.js"></script>

  Ele consulta a API, e se o IP estiver bloqueado,
  redireciona o usuário para a index instantaneamente.
  ═══════════════════════════════════════════════════════════
*/

(function () {
  fetch('/api/ips?action=check', {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
  })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (d.bloqueado) {
        window.location.replace('/');
      }
    })
    .catch(function () {});
})();