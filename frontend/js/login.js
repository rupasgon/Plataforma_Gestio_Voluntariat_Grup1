/**
 * @file login.js
 * @author Grup1
 * @description Gestió del formulari d'accés, validacions i control de sessió.
 * @module login 
 */

/**
 * Formulari d'accés
 * @type {HTMLFormElement}
 */
const formulariAcces = document.getElementById('formulari_acces');

/**
 * Contenidor per mostrar missatges d'estat
 * @type {HTMLElement}
 */
const estatAcces = document.getElementById('estat_acces');

/**
 * Camp d'entrada del correu electrònic
 * @type {HTMLInputElement}
 */
const campCorreu = document.getElementById('correu');

/**
 * Camp d'entrada de la contrasenya
 * @type {HTMLInputElement}
 */
const campContrasenya = document.getElementById('contrasenya');

/**
 * Botó per iniciar sessió
 * @type {HTMLButtonElement}
 */
const botoEntrar = document.getElementById('boto_entrar');

/**
 * Botó per mostrar o ocultar la contrasenya
 * @type {HTMLButtonElement}
 */
const botoMostrarContrasenya = document.getElementById('mostrar_contrasenya');

/**
 * Missatge d'error de la contrasenya
 * @type {HTMLElement}
 */
const errorContrasenya = document.getElementById('error_contrasenya');

/**
 * Checkbox per recordar la sessió
 * @type {HTMLInputElement}
 */
const campRecordarSessio = document.getElementById('recordar_sessio');

/**
 * Contenidor de la informació de sessió activa
 * @type {HTMLElement}
 */
const estatSessioLogin = document.getElementById('estat_sessio_login');

/**
 * Text amb la informació de l'usuari logejat
 * @type {HTMLElement}
 */
const estatSessioText = document.getElementById('estat_sessio_text');

/**
 * Botó per anar a la pàgina de sessió
 * @type {HTMLButtonElement}
 */
const botoAnarSessio = document.getElementById('boto_anar_sessio');

/**
 * Botó per tancar la sessió
 * @type {HTMLButtonElement}
 */
const botoTancarSessioLogin = document.getElementById('boto_tancar_sessio_login');

/**
 * Mostra un missatge d'estat a l'usuari.
 * @param {string} missatge - Text a mostrar.
 * @param {string} tipus - Tipus de missatge (success, danger, warning...).
 */
function mostrarEstat(missatge, tipus) {
  estatAcces.className = `alert alert-${tipus} mt-3`;
  estatAcces.textContent = missatge;
}

/**
 * Valida el format del correu electrònic.
 * @returns {boolean} True si és vàlid, false si no.
 */
function validarCorreu() {
  const valor = campCorreu.value.trim();
  const esValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
  campCorreu.classList.toggle('is-invalid', !esValid);
  return esValid;
}

/**
 * Valida la contrasenya (mínim 6 caràcters).
 * @returns {boolean} True si és vàlida, false si no.
 */
function validarContrasenya() {
  const esValida = campContrasenya.value.trim().length >= 6;
  errorContrasenya.textContent = esValida ? '' : 'La contrasenya ha de tenir com a minim 6 caracters.';
  campContrasenya.classList.toggle('is-invalid', !esValida);
  return esValida;
}

/**
 * Retorna la URL de destinació segons el rol de l'usuari.
 * @param {string} rol - Rol de l'usuari (admin o user).
 * @returns {string} Ruta de redirecció.
 */
function obtenirDestiPerRol(rol) {
  return rol === 'admin' ? './admin.html' : './profile.html';
}

/**
 * Mostra la informació de sessió activa a la interfície.
 * @param {Object} sessio - Objecte de sessió.
 * @param {Object} sessio.user - Dades de l'usuari.
 */
function mostrarSessioActiva(sessio) {
  estatSessioText.textContent = `Has iniciat sessio com ${sessio.user.nom} ${sessio.user.cognoms} (${sessio.user.rol}).`;
  estatSessioLogin.classList.remove('d-none');
  formulariAcces.classList.add('d-none');
}

/**
 * Tanca la sessió actual tant al servidor com al client.
 * @async
 * @returns {Promise<void>}
 */
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

/**
 * Comprova si ja existeix una sessió activa i la valida amb l'API.
 * Si és correcta, mostra la sessió a la UI.
 * @async
 * @returns {Promise<void>}
 */
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

/**
 * Event: Mostra o oculta la contrasenya.
 */
botoMostrarContrasenya.addEventListener('click', () => {
  const esText = campContrasenya.type === 'text';
  campContrasenya.type = esText ? 'password' : 'text';
  botoMostrarContrasenya.textContent = esText ? 'Mostrar' : 'Ocultar';
});

/**
 * Event: Redirigeix segons el rol de la sessió.
 */
botoAnarSessio.addEventListener('click', () => {
  const sessio = window.PARELLES_AUTH.obtenirSessio();
  if (!sessio?.user?.rol) {
    return;
  }

  window.location.href = obtenirDestiPerRol(sessio.user.rol);
});

/**
 * Event: Tanca la sessió.
 */
botoTancarSessioLogin.addEventListener('click', tancarSessioActiva);

/**
 * Event: Valida el correu en temps real.
 */
campCorreu.addEventListener('input', () => {
  if (campCorreu.classList.contains('is-invalid')) {
    validarCorreu();
  }
});

/**
 * Event: Valida la contrasenya en temps real.
 */
campContrasenya.addEventListener('input', () => {
  if (campContrasenya.classList.contains('is-invalid')) {
    validarContrasenya();
  }
});

/**
 * Event: Enviament del formulari d'accés.
 * Realitza validacions, crida a l'API i gestiona la sessió.
 */
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

/**
 * Inicialització: comprova si ja hi ha una sessió activa.
 */
redirigirSiJaHiHaSessio();
