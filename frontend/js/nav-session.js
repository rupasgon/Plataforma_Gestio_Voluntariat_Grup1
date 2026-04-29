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

function obtenirPrefixPages(loginItem) {
  const loginHref = loginItem.dataset.loginHref || './login.html';
  return loginHref.includes('pages/') ? 'pages/' : './';
}

function obtenirDestiAreaPrivada(sessio, loginItem) {
  const prefix = obtenirPrefixPages(loginItem);
  const pagina = sessio?.user?.rol === 'admin' ? 'admin.html' : 'profile.html';
  return `${prefix}${pagina}`;
}

function obtenirTextAreaPrivada(sessio) {
  return sessio?.user?.rol === 'admin' ? 'Administracio' : 'El meu perfil';
}

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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicialitzarNavegacioSessio);
} else {
  inicialitzarNavegacioSessio();
}
