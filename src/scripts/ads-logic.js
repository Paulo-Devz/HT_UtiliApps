const MAX_ADS    = 2;
const BLOCK_TIME = 10 * 60 * 1000; // muda pra 10 * 1000 pra testar

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

function registrarPropaganda() {
    let count = parseInt(localStorage.getItem('propagandasRodadas') || '0');
    count++;
    localStorage.setItem('propagandasRodadas', String(count));
    if (count >= MAX_ADS) {
        localStorage.setItem('propagandasBloqueadoEm', String(Date.now()));
    }
}

function abrirPrograma(src, link) {
    if (link) {
        window.open(link, '_blank');
        registrarPropaganda();
        return;
    }

    if (!src) {
        alert('Este programa não possui link nem src definido.');
        return;
    }

    // Extrai só o nome da pasta: "Apps/Study_AI/main.html" → "Study_AI"
    const destino = src.replace(/.*Apps\//, '').replace('/main.html', '');

    if (isBlocked()) {
        window.location.href = 'Apps/' + destino + '/main.html';
        return;
    }

    registrarPropaganda();
    localStorage.setItem('propagandaDestino', destino);
    window.location.href = 'ads.html';
}