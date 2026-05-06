/**
 * @file nav-sessions.js 
 * @author Grup1
 * @description Gestió de la navegació segons la sessió - login, logout i accés a l'àrea privada.
 * @module nav-sessions 
 */

/**
 * Inicialitza la navegació segons l'estat de la sessió
 */
function inicialitzarNavegacioSessio() {
  const loginItem = document.getElementById('nav_login_item');
  const logoutItem = document.getElementById('nav_logout_item');
  const logoutButton = document.getElementById('nav_logout_button');
  const loginLink = loginItem?.querySelector('a');

  if (!loginItem || !logoutItem || !logoutButton || !loginLink || !window.PARELLES_AUTH) {
    return;
  }

  const sessio = window.PARELLES_AUTH.obtenirSessio();
  const teSessio = Boolean(sessio?.token);

  actualitzarEnllacAreaPrivada(sessio, loginItem, logoutItem, loginLink);

  logoutButton.className = loginLink.className;
  loginItem.classList.toggle('d-none', teSessio);
  logoutItem.classList.toggle('d-none', !teSessio);
  logoutItem.classList.toggle('ms-md-auto', teSessio && !document.getElementById('nav_area_privada_item'));

  if (logoutButton.dataset.logoutInicialitzat === 'true') {
    return;
  }

  logoutButton.dataset.logoutInicialitzat = 'true';

  /**
  * Gestor del botó de logout
  */
  logoutButton.addEventListener('click', async (event) => {
    event.preventDefault();

    try {
      await fetch(`${window.PARELLES_AUTH.API_BASE}/auth/logout`, {
        method: 'POST',
        headers: window.PARELLES_AUTH.obtenirCapcaleresAutenticades()
      });
    } catch (error) {
      // El tancament local ha de funcionar encara que l API no respongui.
    }

    window.PARELLES_AUTH.esborrarSessio();
    window.location.href = loginItem.dataset.loginHref || './login.html';
  });
}

/**
 * Obté el prefix de ruta per a les pàgines
 * @param {HTMLElement} loginItem
 * @returns {string}
 */
function obtenirPrefixPages(loginItem) {
  const loginHref = loginItem.dataset.loginHref || './login.html';
  return loginHref.includes('pages/') ? 'pages/' : './';
}

/**
 * Determina la destinació de l'àrea privada segons el rol
 * @param {Object} sessio
 * @param {HTMLElement} loginItem
 * @returns {string}
 */
function obtenirDestiAreaPrivada(sessio, loginItem) {
  const prefix = obtenirPrefixPages(loginItem);
  const pagina = sessio?.user?.rol === 'admin' ? 'admin.html' : 'profile.html';
  return `${prefix}${pagina}`;
}

/**
 * Retorna el text de l'enllaç d'àrea privada
 * @param {Object} sessio
 * @returns {string}
 */
function obtenirTextAreaPrivada(sessio) {
  return sessio?.user?.rol === 'admin' ? 'Administracio' : 'El meu perfil';
}

/**
 * Actualitza o crea l'enllaç a l'àrea privada al menú
 * @param {Object} sessio
 * @param {HTMLElement} loginItem
 * @param {HTMLElement} logoutItem
 * @param {HTMLAnchorElement} loginLink
 */
function actualitzarEnllacAreaPrivada(sessio, loginItem, logoutItem, loginLink) {
  const idEnllac = 'nav_area_privada_item';
  const existent = document.getElementById(idEnllac);

  if (!sessio?.token) {
    existent?.remove();
    return;
  }

  const item = existent || document.createElement('li');
  let link = item.querySelector('a');

  item.id = idEnllac;
  item.className = loginItem.className.replace(/\bd-none\b/g, '').trim();

  if (!link) {
    link = document.createElement('a');
    item.appendChild(link);
  }

  link.className = loginLink.className;
  link.href = obtenirDestiAreaPrivada(sessio, loginItem);
  link.textContent = obtenirTextAreaPrivada(sessio);

  if (!existent) {
    logoutItem.before(item);
  }
}

/**
 * Inicialització automàtica segons l'estat del DOM
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicialitzarNavegacioSessio);
} else {
  inicialitzarNavegacioSessio();
}
