/**
 * @file admin.js
 * @author Grup1
 * @description Panell d'administració per gestionar usuaris, estadístiques i edició de dades amb integració amb l'API.
 */

/**
 * Element que mostra el total d'usuaris
 * @type {HTMLElement}
 */
const statTotalUsuaris = document.getElementById('stat_total_usuaris');

/**
 * Element que mostra el total de parelles
 * @type {HTMLElement}
 */
const statTotalParelles = document.getElementById('stat_total_parelles');

/**
 * Element que mostra l'última acció realitzada
 * @type {HTMLElement}
 */
const statUltimaAccio = document.getElementById('stat_ultima_accio');

/**
 * Contenidor de missatges d'estat de l'admin
 * @type {HTMLElement}
 */
const estatAdmin = document.getElementById('estat_admin');

/**
 * Botó per carregar usuaris
 * @type {HTMLButtonElement}
 */
const botoCarregarUsuaris = document.getElementById('carregar_usuaris');

/**
 * Taula d'últims usuaris
 * @type {HTMLElement}
 */
const taulaUltimsUsuaris = document.getElementById('taula_ultims_usuaris');

/**
 * Formulari d'edició d'usuari
 * @type {HTMLFormElement}
 */
const formulariEdicioUsuari = document.getElementById('formulari_edicio_usuari');

/**
 * Botó per guardar canvis d'usuari
 * @type {HTMLButtonElement}
 */
const botoGuardarUsuari = document.getElementById('boto_guardar_usuari');

/**
 * Botó per cancel·lar edició
 * @type {HTMLButtonElement}
 */
const botoCancelarEdicio = document.getElementById('boto_cancelar_edicio');

/**
 * Text d'usuari actual en edició
 * @type {HTMLElement}
 */
const usuariEdicioActual = document.getElementById('usuari_edicio_actual');

/**
 * Element que mostra l'usuari autenticat
 * @type {HTMLElement}
 */
const usuariAutenticat = document.getElementById('usuari_autenticat');

/**
 * Estat de la sessió
 * @type {HTMLElement}
 */
const estatSessio = document.getElementById('estat_sessio');

/**
 * Camps del formulari d'edició
 * @type {Object}
 */
const campsEdicio = {
  nom: document.getElementById('edit_nom'),
  cognoms: document.getElementById('edit_cognoms'),
  email: document.getElementById('edit_correu'),
  rol: document.getElementById('edit_rol'),
  password: document.getElementById('edit_password'),
  telefon: document.getElementById('edit_telefon'),
  parroquia: document.getElementById('edit_parroquia'),
  data_naixement: document.getElementById('edit_data_naixement'),
  nivell_catala: document.getElementById('edit_nivell_catala'),
  objectiu_principal: document.getElementById('edit_objectiu_principal'),
  pot_conversar: document.getElementById('edit_pot_conversar'),
  disponibilitat: document.getElementById('edit_disponibilitat'),
  observacions: document.getElementById('edit_observacions')
};

/**
 * Camps específics d'aprenent
 * @type {HTMLElement[]}
 */
const campsEdicioAprenent = Array.from(document.querySelectorAll('[data-edit-camp-aprenent]'));

/**
 * Llista d'usuaris carregats
 * @type {Array}
 */
let usuaris = [];

/**
 * ID de l'usuari seleccionat
 * @type {number|null}
 */
let usuariSeleccionatId = null;

/**
 * Retorna l'hora actual formatada
 * @returns {string}
 */
function horaActual() {
  return new Date().toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Registra una acció al dashboard
 * @param {string} titol
 */
function registrarAccio(titol) {
  statUltimaAccio.textContent = `${titol} (${horaActual()})`;
}

/**
 * Mostra un missatge d'estat
 * @param {string} missatge
 * @param {string} [tipus=info]
 */
function mostrarEstat(missatge, tipus = 'info') {
  estatAdmin.className = `alert alert-${tipus}`;
  estatAdmin.textContent = missatge;
  estatAdmin.classList.remove('d-none');
}

/**
 * Amaga el missatge d'estat
 */
function amagarEstat() {
  estatAdmin.classList.add('d-none');
  estatAdmin.textContent = '';
}

/**
 * Mostra una fila buida en una taula
 * @param {HTMLElement} element
 * @param {string} missatge
 * @param {number} [columnes=3]
 */
function omplirTaulaBuida(element, missatge, columnes = 3) {
  element.innerHTML = `<tr><td colspan="${columnes}" class="text-muted">${missatge}</td></tr>`;
}

/**
 * Actualitza els camps requerits segons el rol
 * @param {string} rol
 */
function actualitzarCampsEdicioPerRol(rol) {
  const esPerfil = rol === 'voluntari' || rol === 'aprenent';
  const esAprenent = rol === 'aprenent';

  [campsEdicio.telefon, campsEdicio.parroquia, campsEdicio.data_naixement, campsEdicio.disponibilitat].forEach((camp) => {
    camp.required = esPerfil;
  });

  [campsEdicio.nivell_catala, campsEdicio.objectiu_principal, campsEdicio.pot_conversar].forEach((camp) => {
    camp.required = esAprenent;
    if (!esAprenent) {
      camp.value = '';
      camp.setCustomValidity('');
    }
  });

  campsEdicioAprenent.forEach((element) => {
    element.classList.toggle('d-none', !esAprenent);
  });
}

/**
 * Assigna valor a un select, creant opció si cal
 * @param {HTMLSelectElement} select
 * @param {string} valor
 */
function assignarValorSelect(select, valor) {
  const valorNormalitzat = valor || '';
  const existeixOpcio = Array.from(select.options).some((option) => option.value === valorNormalitzat);

  if (valorNormalitzat && !existeixOpcio) {
    select.add(new Option(valorNormalitzat, valorNormalitzat));
  }

  select.value = valorNormalitzat;
}

/**
 * Neteja el formulari d'edició
 */
function netejarFormulariEdicio() {
  formulariEdicioUsuari.reset();
  actualitzarCampsEdicioPerRol(campsEdicio.rol.value);
  usuariSeleccionatId = null;
  botoGuardarUsuari.disabled = true;
  usuariEdicioActual.textContent = 'Cap usuari seleccionat.';
}

/**
 * Omple el formulari amb dades d'un usuari
 * @param {Object} usuari
 */
function emplenarFormulariEdicio(usuari) {
  campsEdicio.nom.value = usuari.nom || '';
  campsEdicio.cognoms.value = usuari.cognoms || '';
  campsEdicio.email.value = usuari.email || '';
  campsEdicio.rol.value = usuari.rol || 'voluntari';
  actualitzarCampsEdicioPerRol(campsEdicio.rol.value);
  campsEdicio.password.value = '';
  campsEdicio.telefon.value = usuari.telefon || '';
  assignarValorSelect(campsEdicio.parroquia, usuari.parroquia);
  campsEdicio.data_naixement.value = usuari.data_naixement ? String(usuari.data_naixement).slice(0, 10) : '';
  assignarValorSelect(campsEdicio.nivell_catala, usuari.nivell_catala);
  campsEdicio.objectiu_principal.value = usuari.objectiu_principal || '';
  assignarValorSelect(campsEdicio.pot_conversar, usuari.pot_conversar);
  campsEdicio.disponibilitat.value = usuari.disponibilitat || '';
  campsEdicio.observacions.value = usuari.observacions || '';
}

/**
 * Realitza una petició fetch protegida amb autenticació
 * @param {string} url - URL de la petició
 * @param {Object} [options={}] - Opcions de fetch
 * @returns {Promise<Object>} Resposta en format JSON
 */
async function obtenirJSONProtegit(url, options = {}) {
  const resposta = await fetch(url, {
    ...options,
    headers: {
      ...window.PARELLES_AUTH.obtenirCapcaleresAutenticades(),
      ...(options.headers || {})
    }
  });

  const dades = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new Error(dades.message || 'La peticio no s ha pogut completar correctament.');
  }

  return dades;
}

/**
 * Valida que l'usuari autenticat sigui administrador
 * @returns {Promise<boolean>} True si té accés, false si no
 */
async function validarAccesAdministrador() {
  const sessio = window.PARELLES_AUTH.obtenirSessio();
  if (!sessio?.token) {
    window.location.href = './login.html';
    return false;
  }

  try {
    const dades = await obtenirJSONProtegit(`${window.PARELLES_AUTH.API_BASE}/auth/me`);

    if (dades.user.rol !== 'admin') {
      window.location.href = dades.user.rol === 'voluntari' || dades.user.rol === 'aprenent' ? './profile.html' : './login.html';
      return false;
    }

    usuariAutenticat.textContent = `${dades.user.nom} (${dades.user.rol})`;
    estatSessio.textContent = 'Sessio activa. Panell protegit correctament.';
    return true;
  } catch (error) {
    window.PARELLES_AUTH.esborrarSessio();
    window.location.href = './login.html';
    return false;
  }
}

/**
 * Renderitza la taula d'usuaris
 * @param {Array} [llistat=[]] - Llista d'usuaris
 */
function renderitzarUltimsUsuaris(llistat = []) {
  if (!llistat.length) {
    omplirTaulaBuida(taulaUltimsUsuaris, 'No hi ha usuaris per mostrar.', 4);
    return;
  }

  taulaUltimsUsuaris.innerHTML = llistat
    .map(
      (usuari) => `
        <tr>
          <td>${usuari.nom} ${usuari.cognoms}</td>
          <td>${usuari.email}</td>
          <td><span class="badge text-bg-light text-uppercase">${usuari.rol}</span></td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-primary" type="button" data-editar-usuari="${usuari.id}">Editar</button>
            <button class="btn btn-sm btn-outline-danger ms-1" type="button" data-eliminar-usuari="${usuari.id}">Eliminar</button>
          </td>
        </tr>
      `
    )
    .join('');
}

/**
 * Carrega les dades resum del dashboard
 * @returns {Promise<void>}
 */
async function carregarResumDashboard() {
  const dades = await obtenirJSONProtegit(`${window.PARELLES_AUTH.API_BASE}/admin/dashboard`);
  statTotalUsuaris.textContent = String(dades.data.usuarisTotals ?? 0);
  statTotalParelles.textContent = String(dades.data.parellesActives ?? 0);
}

/**
 * Carrega la llista d'usuaris
 * @returns {Promise<void>}
 */
async function carregarUsuaris() {
  const dades = await obtenirJSONProtegit(`${window.PARELLES_AUTH.API_BASE}/users`);
  usuaris = dades.data || [];
  renderitzarUltimsUsuaris(usuaris);
  statTotalUsuaris.textContent = String(dades.total ?? usuaris.length);
  registrarAccio('Usuaris actualitzats');
}

/**
 * Carrega tot el dashboard
 * @returns {Promise<void>}
 */
async function carregarDashboardComplet() {
  amagarEstat();

  try {
    await carregarResumDashboard();
    await carregarUsuaris();
  } catch (error) {
    mostrarEstat(error.message || 'No s ha pogut carregar el panell d administracio.', 'danger');
  }
}

/**
 * Selecciona un usuari per editar
 * @param {number} userId
 * @returns {Promise<void>}
 */
async function seleccionarUsuariPerEdicio(userId) {
  try {
    const dades = await obtenirJSONProtegit(`${window.PARELLES_AUTH.API_BASE}/users/${userId}`);
    usuariSeleccionatId = dades.data.id;
    emplenarFormulariEdicio(dades.data);
    botoGuardarUsuari.disabled = false;
    usuariEdicioActual.textContent = `Editant: ${dades.data.nom} ${dades.data.cognoms} (${dades.data.rol})`;
    mostrarEstat('Usuari carregat al formulari d edicio.', 'info');
    registrarAccio('Usuari preparat per editar');
  } catch (error) {
    mostrarEstat(error.message || 'No s ha pogut carregar l usuari seleccionat.', 'danger');
  }
}

/**
 * Realitza una petició fetch protegida amb autenticació
 * @param {string} url - URL de la petició
 * @param {Object} [options={}] - Opcions de fetch
 * @returns {Promise<Object>} Resposta en format JSON
 */
async function obtenirJSONProtegit(url, options = {}) {
  const resposta = await fetch(url, {
    ...options,
    headers: {
      ...window.PARELLES_AUTH.obtenirCapcaleresAutenticades(),
      ...(options.headers || {})
    }
  });

  const dades = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new Error(dades.message || 'La peticio no s ha pogut completar correctament.');
  }

  return dades;
}

/**
 * Valida que l'usuari autenticat sigui administrador
 * @returns {Promise<boolean>} True si té accés, false si no
 */
async function validarAccesAdministrador() {
  const sessio = window.PARELLES_AUTH.obtenirSessio();
  if (!sessio?.token) {
    window.location.href = './login.html';
    return false;
  }

  try {
    const dades = await obtenirJSONProtegit(`${window.PARELLES_AUTH.API_BASE}/auth/me`);

    if (dades.user.rol !== 'admin') {
      window.location.href =
        dades.user.rol === 'voluntari' || dades.user.rol === 'aprenent'
          ? './profile.html'
          : './login.html';
      return false;
    }

    usuariAutenticat.textContent = `${dades.user.nom} (${dades.user.rol})`;
    estatSessio.textContent = 'Sessio activa. Panell protegit correctament.';
    return true;
  } catch (error) {
    window.PARELLES_AUTH.esborrarSessio();
    window.location.href = './login.html';
    return false;
  }
}

/**
 * Renderitza la taula d'usuaris
 * @param {Array} [llistat=[]] - Llista d'usuaris
 */
function renderitzarUltimsUsuaris(llistat = []) {
  if (!llistat.length) {
    omplirTaulaBuida(taulaUltimsUsuaris, 'No hi ha usuaris per mostrar.', 4);
    return;
  }

  taulaUltimsUsuaris.innerHTML = llistat
    .map(
      (usuari) => `
        <tr>
          <td>${usuari.nom} ${usuari.cognoms}</td>
          <td>${usuari.email}</td>
          <td><span class="badge text-bg-light text-uppercase">${usuari.rol}</span></td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-primary" type="button" data-editar-usuari="${usuari.id}">Editar</button>
            <button class="btn btn-sm btn-outline-danger ms-1" type="button" data-eliminar-usuari="${usuari.id}">Eliminar</button>
          </td>
        </tr>
      `
    )
    .join('');
}

/**
 * Carrega les dades resum del dashboard
 * @returns {Promise<void>}
 */
async function carregarResumDashboard() {
  const dades = await obtenirJSONProtegit(`${window.PARELLES_AUTH.API_BASE}/admin/dashboard`);
  statTotalUsuaris.textContent = String(dades.data.usuarisTotals ?? 0);
  statTotalParelles.textContent = String(dades.data.parellesActives ?? 0);
}

/**
 * Carrega la llista d'usuaris
 * @returns {Promise<void>}
 */
async function carregarUsuaris() {
  const dades = await obtenirJSONProtegit(`${window.PARELLES_AUTH.API_BASE}/users`);
  usuaris = dades.data || [];
  renderitzarUltimsUsuaris(usuaris);
  statTotalUsuaris.textContent = String(dades.total ?? usuaris.length);
  registrarAccio('Usuaris actualitzats');
}

/**
 * Carrega tot el dashboard
 * @returns {Promise<void>}
 */
async function carregarDashboardComplet() {
  amagarEstat();

  try {
    await carregarResumDashboard();
    await carregarUsuaris();
  } catch (error) {
    mostrarEstat(error.message || 'No s ha pogut carregar el panell d administracio.', 'danger');
  }
}

/**
 * Selecciona un usuari per editar
 * @param {number} userId
 * @returns {Promise<void>}
 */
async function seleccionarUsuariPerEdicio(userId) {
  try {
    const dades = await obtenirJSONProtegit(`${window.PARELLES_AUTH.API_BASE}/users/${userId}`);
    usuariSeleccionatId = dades.data.id;
    emplenarFormulariEdicio(dades.data);
    botoGuardarUsuari.disabled = false;
    usuariEdicioActual.textContent = `Editant: ${dades.data.nom} ${dades.data.cognoms} (${dades.data.rol})`;
    mostrarEstat('Usuari carregat al formulari d edicio.', 'info');
    registrarAccio('Usuari preparat per editar');
  } catch (error) {
    mostrarEstat(error.message || 'No s ha pogut carregar l usuari seleccionat.', 'danger');
  }
}

/**
 * Elimina un usuari
 * @param {number} userId
 * @returns {Promise<void>}
 */
async function eliminarUsuari(userId) {
  const usuari = usuaris.find((item) => item.id === userId);
  const nomUsuari = usuari ? `${usuari.nom} ${usuari.cognoms}` : 'aquest usuari';

  if (!window.confirm(`Vols eliminar ${nomUsuari}? Aquesta accio tambe eliminara les seves parelles associades.`)) {
    return;
  }

  try {
    await obtenirJSONProtegit(`${window.PARELLES_AUTH.API_BASE}/users/${userId}`, {
      method: 'DELETE'
    });

    if (usuariSeleccionatId === userId) {
      netejarFormulariEdicio();
    }

    await carregarResumDashboard();
    await carregarUsuaris();
    mostrarEstat('Usuari eliminat correctament.', 'success');
    registrarAccio('Usuari eliminat');
  } catch (error) {
    mostrarEstat(error.message || 'No s ha pogut eliminar l usuari seleccionat.', 'danger');
  }
}

/**
 * Event: Gestió de clics a la taula d'usuaris (editar/eliminar)
 */
taulaUltimsUsuaris.addEventListener('click', async (event) => {
  const botoEditar = event.target.closest('[data-editar-usuari]');
  if (botoEditar) {
    await seleccionarUsuariPerEdicio(Number(botoEditar.dataset.editarUsuari));
    return;
  }

  const botoEliminar = event.target.closest('[data-eliminar-usuari]');
  if (botoEliminar) {
    await eliminarUsuari(Number(botoEliminar.dataset.eliminarUsuari));
  }
});

/**
 * Event: Enviament del formulari d'edició
 */
formulariEdicioUsuari.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!usuariSeleccionatId) {
    mostrarEstat('Primer has de seleccionar un usuari del llistat.', 'warning');
    return;
  }

  if (!formulariEdicioUsuari.checkValidity()) {
    mostrarEstat('Revisa els camps obligatoris del formulari d edicio.', 'warning');
    return;
  }

  botoGuardarUsuari.disabled = true;
  botoGuardarUsuari.textContent = 'Guardant...';

  const payload = {
    nom: campsEdicio.nom.value.trim(),
    cognoms: campsEdicio.cognoms.value.trim(),
    email: campsEdicio.email.value.trim(),
    rol: campsEdicio.rol.value,
    telefon: campsEdicio.telefon.value.trim(),
    parroquia: campsEdicio.parroquia.value.trim(),
    data_naixement: campsEdicio.data_naixement.value,
    disponibilitat: campsEdicio.disponibilitat.value.trim(),
    observacions: campsEdicio.observacions.value.trim()
  };

  if (campsEdicio.rol.value === 'aprenent') {
    payload.nivell_catala = campsEdicio.nivell_catala.value;
    payload.objectiu_principal = campsEdicio.objectiu_principal.value.trim();
    payload.pot_conversar = campsEdicio.pot_conversar.value;
  }

  const password = campsEdicio.password.value;
  if (password.trim()) {
    payload.password = password;
  }

  try {
    const dades = await obtenirJSONProtegit(`${window.PARELLES_AUTH.API_BASE}/users/${usuariSeleccionatId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });

    emplenarFormulariEdicio(dades.data);
    await carregarResumDashboard();
    await carregarUsuaris();
    mostrarEstat('Usuari actualitzat correctament.', 'success');
    registrarAccio('Usuari actualitzat');
  } catch (error) {
    mostrarEstat(error.message || 'No s ha pogut actualitzar l usuari seleccionat.', 'danger');
  } finally {
    botoGuardarUsuari.disabled = false;
    botoGuardarUsuari.textContent = 'Guardar canvis';
  }
});

/**
 * Event: Cancel·lació d'edició
 */
botoCancelarEdicio.addEventListener('click', () => {
  netejarFormulariEdicio();
  mostrarEstat('S ha cancelat la seleccio de l usuari.', 'secondary');
});

/**
 * Event: Canvi de rol en el formulari
 */
campsEdicio.rol.addEventListener('change', () => {
  actualitzarCampsEdicioPerRol(campsEdicio.rol.value);
});

/**
 * Event: Recàrrega manual d'usuaris
 */
botoCarregarUsuaris.addEventListener('click', async () => {
  try {
    amagarEstat();
    await carregarResumDashboard();
    await carregarUsuaris();
  } catch (error) {
    mostrarEstat(error.message || 'No s han pogut actualitzar els usuaris.', 'danger');
  }
});

/**
 * Inicialitza el formulari d'edició
 */
netejarFormulariEdicio();

/**
 * Inicialització principal del panell d'admin
 */
(async () => {
  const teAcces = await validarAccesAdministrador();
  if (teAcces) {
    await carregarDashboardComplet();
  }
})();
