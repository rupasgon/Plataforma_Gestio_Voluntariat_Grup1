document.addEventListener('DOMContentLoaded', () => {
    carregarPerfil();
});

async function carregarPerfil() {
    const sessio = window.PARELLES_AUTH?.obtenirSessio();
    if (!sessio?.token) {
        window.location.href = './login.html';
        return;
    }

    try {
        const resposta = await fetch(`${window.PARELLES_AUTH.API_BASE}/profile/me`, {
            headers: window.PARELLES_AUTH.obtenirCapcaleresAutenticades()
        });

        const dades = await resposta.json().catch(() => ({}));

        if (!resposta.ok) {
            throw new Error(dades.message || 'No s ha pogut carregar el perfil.');
        }

        mostrarDades(dades.data || {});
    } catch (error) {
        console.error('Error en carregar el perfil:', error);
    }
}

function mostrarDades(dades) {
    document.getElementById('nom').textContent = dades.nom || '';
    document.getElementById('cognoms').textContent = dades.cognoms || '';
    document.getElementById('email').textContent = dades.email || '';
    document.getElementById('telefon').textContent = dades.telefon || '';
    document.getElementById('parroquia').textContent = dades.parroquia || '';
    document.getElementById('data_naixement').textContent = dades.data_naixement ? String(dades.data_naixement).slice(0, 10) : '';
    document.getElementById('disponibilitat').textContent = dades.disponibilitat || '';
    document.getElementById('observacions').textContent = dades.observacions || '';
}
