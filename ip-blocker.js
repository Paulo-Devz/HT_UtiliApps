// IP Blocker v2.1 - Usa DB PostgreSQL existente
(async function() {
  try {
    const ipRes = await fetch('https://api.ipify.org?format=json');
    const { ip } = await ipRes.json();

    const checkRes = await fetch(`/api/admin_reneavues/ips?action=check&ip=${ip}`);
    const data = await checkRes.json();

    if (data.bloqueado) {
      const motivo = data.motivo ? `?motivo=${encodeURIComponent(data.motivo)}` : '';
      window.location.href = `/ban.html${motivo}`;
      return;
    }
  } catch (error) {
    console.warn('IP Blocker erro:', error);
  }
})();



