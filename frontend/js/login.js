const formulariAcces = document.getElementById('formulari_acces');
const estatAcces = document.getElementById('estat_acces');
const campCorreu = document.getElementById('correu');
const campContrasenya = document.getElementById('contrasenya');
const botoEntrar = document.getElementById('boto_entrar');
const botoMostrarContrasenya = document.getElementById('mostrar_contrasenya');
const errorContrasenya = document.getElementById('error_contrasenya');
const campRecordarSessio = document.getElementById('recordar_sessio');
const estatSessioLogin = document.getElementById('estat_sessio_login');
const estatSessioText = document.getElementById('estat_sessio_text');
const botoAnarSessio = document.getElementById('boto_anar_sessio');
const botoTancarSessioLogin = document.getElementById('boto_tancar_sessio_login');

function mostrarEstat(missatge, tipus) {
  estatAcces.className = `alert alert-${tipus} mt-3`;
  estatAcces.textContent = missatge;
}

function validarCorreu() {
  const valor = campCorreu.value.trim();
  const esValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
  campCorreu.classList.toggle('is-invalid', !esValid);
  return esValid;
}

function validarContrasenya() {
  const esValida = campContrasenya.value.trim().length >= 6;
  errorContrasenya.textContent = esValida ? '' : 'La contrasenya ha de tenir com a minim 6 caracters.';
  campContrasenya.classList.toggle('is-invalid', !esValida);
  return esValida;
}

function obtenirDestiPerRol(rol) {
  return rol === 'admin' ? './admin.html' : './profile.html';
}

function mostrarSessioActiva(sessio) {
  estatSessioText.textContent = `Has iniciat sessio com ${sessio.user.nom} ${sessio.user.cognoms} (${sessio.user.rol}).`;
  estatSessioLogin.classList.remove('d-none');
  formulariAcces.classList.add('d-none');
}

async function tancarSessioActiva() {
  try {
    await fetch(`${window.PARELLES_AUTH.API_BASE}/auth/logout`, {
      method: 'POST',
      headers: window.PARELLES_AUTH.obtenirCapcaleresAutenticades()
    });
  } catch (error) {
    // No cal bloquejar el tancament local si l API no respon.
  }

  window.PARELLES_AUTH.esborrarSessio();
  estatSessioLogin.classList.add('d-none');
  formulariAcces.classList.remove('d-none');
  mostrarEstat('Sessio tancada correctament.', 'success');
}

async function redirigirSiJaHiHaSessio() {
  const sessio = window.PARELLES_AUTH.obtenirSessio();
  if (!sessio?.token) {
    return;
  }

  try {
    const resposta = await fetch(`${window.PARELLES_AUTH.API_BASE}/auth/me`, {
      headers: window.PARELLES_AUTH.obtenirCapcaleresAutenticades()
    });

    if (!resposta.ok) {
      window.PARELLES_AUTH.esborrarSessio();
      return;
    }

    const dades = await resposta.json();
    mostrarSessioActiva({
      ...sessio,
      user: dades.user
    });
  } catch (error) {
    mostrarEstat('No s ha pogut comprovar la sessio actual. Assegura t que l API estigui activa.', 'warning');
  }
}

botoMostrarContrasenya.addEventListener('click', () => {
  const esText = campContrasenya.type === 'text';
  campContrasenya.type = esText ? 'password' : 'text';
  botoMostrarContrasenya.textContent = esText ? 'Mostrar' : 'Ocultar';
});

botoAnarSessio.addEventListener('click', () => {
  const sessio = window.PARELLES_AUTH.obtenirSessio();
  if (!sessio?.user?.rol) {
    return;
  }

  window.location.href = obtenirDestiPerRol(sessio.user.rol);
});

botoTancarSessioLogin.addEventListener('click', tancarSessioActiva);

campCorreu.addEventListener('input', () => {
  if (campCorreu.classList.contains('is-invalid')) {
    validarCorreu();
  }
});

campContrasenya.addEventListener('input', () => {
  if (campContrasenya.classList.contains('is-invalid')) {
    validarContrasenya();
  }
});

formulariAcces.addEventListener('submit', async (event) => {
  event.preventDefault();

  const correuValid = validarCorreu();
  const contrasenyaValida = validarContrasenya();

  if (!correuValid || !contrasenyaValida) {
    mostrarEstat('Revisa els camps obligatoris abans d entrar.', 'warning');
    return;
  }

  botoEntrar.disabled = true;
  botoEntrar.textContent = 'Verificant...';

  try {
    const resposta = await fetch(`${window.PARELLES_AUTH.API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identificador: campCorreu.value.trim(),
        password: campContrasenya.value,
        recordarSessio: campRecordarSessio.checked
      })
    });

    const dades = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      mostrarEstat(dades.message || 'No s ha pogut iniciar la sessio.', 'danger');
      return;
    }

    window.PARELLES_AUTH.desarSessio(
      {
        token: dades.token,
        user: dades.user,
        expiresAt: dades.expiresAt || null
      },
      campRecordarSessio.checked
    );

    mostrarEstat('Inici de sessio correcte. Redirigint...', 'success');
    window.setTimeout(() => {
      window.location.href = obtenirDestiPerRol(dades.user.rol);
    }, 400);
  } catch (error) {
    mostrarEstat('No s ha pogut connectar amb l API. Revisa que el servidor backend estigui actiu.', 'danger');
  } finally {
    botoEntrar.disabled = false;
    botoEntrar.textContent = 'Entrar';
  }
});

redirigirSiJaHiHaSessio();
