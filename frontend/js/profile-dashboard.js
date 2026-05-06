/**
 * @file profile-dashboard.js 
 * @author Grup1
 * @description Visualització del perfil d'usuari - càrrega i mostra de dades des de l'API.
 * @module profile-dashboard 
 */

/**
 * Inicialització de la pàgina: carrega el perfil quan el DOM està llest
 */
document.addEventListener('DOMContentLoaded', () => {
    carregarPerfil();
});

/**
 * Carrega el perfil de l'usuari des de l'API
 * - Comprova si hi ha sessió activa
 * - Fa una petició autenticada
 * - Mostra les dades al DOM
 * @returns {Promise<void>}
 */
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

/**
 * Mostra les dades del perfil a la interfície
 * @param {Object} dades - Dades del perfil de l'usuari
 * @param {string} [dades.nom]
 * @param {string} [dades.cognoms]
 * @param {string} [dades.email]
 * @param {string} [dades.telefon]
 * @param {string} [dades.parroquia]
 * @param {string|Date} [dades.data_naixement]
 * @param {string} [dades.disponibilitat]
 * @param {string} [dades.observacions]
 */
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
