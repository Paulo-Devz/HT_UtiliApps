const MAX_ADS    = 2;
const BLOCK_TIME = 5 * 60 * 1000;

function isBlocked() {
    const count     = parseInt(localStorage.getItem('propagandasRodadas') || '0');
    const blockedAt = parseInt(localStorage.getItem('propagandasBloqueadoEm') || '0');

    if (count < MAX_ADS) return false;

    const elapsed = Date.now() - blockedAt;
    if (elapsed >= BLOCK_TIME) {
        localStorage.setItem('propagandasRodadas', '0');
        localStorage.removeItem('propagandasBloqueadoEm');
        return false;
    }
    return true;
}

async function registrarPropaganda() {
    let count = parseInt(localStorage.getItem('propagandasRodadas') || '0');
    count++;
    localStorage.setItem('propagandasRodadas', String(count));
    if (count >= MAX_ADS) {
        localStorage.setItem('propagandasBloqueadoEm', String(Date.now()));
    }

    try {
        await fetch('/api/admin/admin?section=anuncios&action=registrar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
    } catch (e) {}
}

async function registrarPrograma(nome) {
    try {
        await fetch('/api/admin/admin?section=programas&action=registrar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome })
        });
    } catch (e) {}
}

function abrirPrograma(src, link) {
    if (link) {
        window.open(link, '_blank');
        registrarPropaganda();
        registrarPrograma(link);
        return;
    }

    if (!src) {
        alert('Este programa não possui link nem src definido.');
        return;
    }

    const destino = src.replace(/.*Apps\//, '').replace('/main.html', '');

    registrarPrograma(destino);

    if (isBlocked()) {
        window.open('Apps/' + destino + '/main.html', '_blank');
        return;
    }

    registrarPropaganda();
    localStorage.setItem('propagandaDestino', destino);
    window.open('ads.html', '_blank');
}