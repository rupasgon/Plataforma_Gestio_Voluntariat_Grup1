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

  logoutButton.className = loginLink.className;
  loginItem.classList.toggle('d-none', teSessio);
  logoutItem.classList.toggle('d-none', !teSessio);
  logoutItem.classList.toggle('ms-md-auto', teSessio);

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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicialitzarNavegacioSessio);
} else {
  inicialitzarNavegacioSessio();
}
