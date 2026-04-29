const statTotalUsuaris = document.getElementById('stat_total_usuaris');
const statTotalParelles = document.getElementById('stat_total_parelles');
const statUltimaAccio = document.getElementById('stat_ultima_accio');
const estatAdmin = document.getElementById('estat_admin');
const botoCarregarUsuaris = document.getElementById('carregar_usuaris');
const botoCarregarParelles = document.getElementById('carregar_parelles');
const taulaUltimsUsuaris = document.getElementById('taula_ultims_usuaris');
const taulaParellesActives = document.getElementById('taula_parelles_actives');
const formulariNovaParella = document.getElementById('formulari_nova_parella');
const formulariEstatParella = document.getElementById('formulari_estat_parella');
const botoCrearParella = document.getElementById('boto_crear_parella');
const botoActualitzarParella = document.getElementById('boto_actualitzar_parella');
const botoCancelarParella = document.getElementById('boto_cancelar_parella');
const parellaSeleccionadaText = document.getElementById('parella_seleccionada_text');
const formulariEdicioUsuari = document.getElementById('formulari_edicio_usuari');
const botoGuardarUsuari = document.getElementById('boto_guardar_usuari');
const botoCancelarEdicio = document.getElementById('boto_cancelar_edicio');
const usuariEdicioActual = document.getElementById('usuari_edicio_actual');
const usuariAutenticat = document.getElementById('usuari_autenticat');
const estatSessio = document.getElementById('estat_sessio');

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

const campsEdicioAprenent = Array.from(document.querySelectorAll('[data-edit-camp-aprenent]'));

let parellesActives = [];
let usuaris = [];
let usuariSeleccionatId = null;
let parellaSeleccionadaId = null;

const campsNovaParella = {
  voluntari: document.getElementById('pair_voluntari'),
  aprenent: document.getElementById('pair_aprenent'),
  data_inici: document.getElementById('pair_data_inici'),
  estat: document.getElementById('pair_estat'),
  observacions: document.getElementById('pair_observacions')
};

const campsEstatParella = {
  estat: document.getElementById('pair_estat_nou'),
  data_fi: document.getElementById('pair_data_fi'),
  observacions: document.getElementById('pair_observacions_estat')
};

function horaActual() {
  const ara = new Date();
  return ara.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' });
}

function registrarAccio(titol) {
  statUltimaAccio.textContent = `${titol} (${horaActual()})`;
}

function mostrarEstat(missatge, tipus = 'info') {
  estatAdmin.className = `alert alert-${tipus}`;
  estatAdmin.textContent = missatge;
  estatAdmin.classList.remove('d-none');
}

function amagarEstat() {
  estatAdmin.classList.add('d-none');
  estatAdmin.textContent = '';
}

function omplirTaulaBuida(element, missatge, columnes = 3) {
  element.innerHTML = `<tr><td colspan="${columnes}" class="text-muted">${missatge}</td></tr>`;
}

function formatData(data) {
  if (!data) {
    return '-';
  }

  return String(data).slice(0, 10);
}

function classeBadgeEstat(estat) {
  if (estat === 'activa') {
    return 'text-bg-success';
  }

  if (estat === 'pausada') {
    return 'text-bg-warning';
  }

  return 'text-bg-secondary';
}

function netejarFormulariEdicio() {
  formulariEdicioUsuari.reset();
  actualitzarCampsEdicioPerRol(campsEdicio.rol.value);
  usuariSeleccionatId = null;
  botoGuardarUsuari.disabled = true;
  usuariEdicioActual.textContent = 'Cap usuari seleccionat.';
}

function netejarSeleccioParella() {
  formulariEstatParella.reset();
  parellaSeleccionadaId = null;
  botoActualitzarParella.disabled = true;
  parellaSeleccionadaText.textContent = 'Cap parella seleccionada.';
}

function establirDataIniciAvui() {
  campsNovaParella.data_inici.value = new Date().toISOString().slice(0, 10);
}

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

function assignarValorSelect(select, valor) {
  const valorNormalitzat = valor || '';
  const existeixOpcio = Array.from(select.options).some((option) => option.value === valorNormalitzat);

  if (valorNormalitzat && !existeixOpcio) {
    select.add(new Option(valorNormalitzat, valorNormalitzat));
  }

  select.value = valorNormalitzat;
}

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

function participantTeParellaOberta(usuari) {
  return parellesActives.some((parella) => {
    if (!['activa', 'pausada'].includes(parella.estat)) {
      return false;
    }

    return parella.voluntari_id === usuari.perfil_id || parella.aprenent_id === usuari.perfil_id;
  });
}

function construirOpcionsUsuari(usuarisRol, placeholder) {
  if (!usuarisRol.length) {
    return `<option value="">${placeholder}</option>`;
  }

  const disponibles = usuarisRol.filter((usuari) => !participantTeParellaOberta(usuari));

  return [
    `<option value="">${placeholder}</option>`,
    ...disponibles.map(
      (usuari) => `<option value="${usuari.perfil_id}">${usuari.nom} ${usuari.cognoms} - ${usuari.disponibilitat || 'sense disponibilitat'}</option>`
    )
  ].join('');
}

function actualitzarSelectorsParelles() {
  const voluntaris = usuaris.filter((usuari) => usuari.rol === 'voluntari' && usuari.perfil_id);
  const aprenents = usuaris.filter((usuari) => usuari.rol === 'aprenent' && usuari.perfil_id);

  campsNovaParella.voluntari.innerHTML = construirOpcionsUsuari(voluntaris, 'Selecciona un voluntari');
  campsNovaParella.aprenent.innerHTML = construirOpcionsUsuari(aprenents, 'Selecciona un aprenent');
}

async function obtenirJSONProtegit(url, options = {}) {
  const resposta = await fetch(url, {
    ...options,
    headers: {
      ...window.PARELLES_AUTH.obtenirCapcaleresAutenticades(),
      ...(options.headers || {})
    }
  });

  let dades = null;
  try {
    dades = await resposta.json();
  } catch (error) {
    dades = null;
  }

  if (!resposta.ok) {
    const missatge = dades?.message || 'La peticio no s ha pogut completar correctament.';
    throw new Error(missatge);
  }

  return dades;
}

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

function renderitzarParellesActives(parelles = []) {
  if (!parelles.length) {
    omplirTaulaBuida(taulaParellesActives, 'No hi ha parelles disponibles.', 6);
    return;
  }

  taulaParellesActives.innerHTML = parelles
    .map(
      (parella) => `
        <tr>
          <td>
            <div>${parella.voluntari_nom_complet}</div>
            <small class="text-muted">${parella.voluntari_disponibilitat || ''}</small>
          </td>
          <td>
            <div>${parella.aprenent_nom_complet}</div>
            <small class="text-muted">${parella.aprenent_disponibilitat || ''}</small>
          </td>
          <td>${formatData(parella.data_inici)}</td>
          <td>${formatData(parella.data_fi)}</td>
          <td><span class="badge ${classeBadgeEstat(parella.estat)} text-uppercase">${parella.estat}</span></td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-primary" type="button" data-editar-parella="${parella.id}">Gestionar</button>
            <button class="btn btn-sm btn-outline-danger ms-1" type="button" data-eliminar-parella="${parella.id}">Eliminar</button>
          </td>
        </tr>
      `
    )
    .join('');
}

async function carregarResumDashboard() {
  const dades = await obtenirJSONProtegit(`${window.PARELLES_AUTH.API_BASE}/admin/dashboard`);
  statTotalUsuaris.textContent = String(dades.data.usuarisTotals ?? 0);
  statTotalParelles.textContent = String(dades.data.parellesActives ?? 0);
}

async function carregarUsuaris() {
  const dades = await obtenirJSONProtegit(`${window.PARELLES_AUTH.API_BASE}/users`);
  usuaris = dades.data || [];
  renderitzarUltimsUsuaris(usuaris);
  actualitzarSelectorsParelles();
  statTotalUsuaris.textContent = String(dades.total ?? usuaris.length);
  registrarAccio('Usuaris actualitzats');
}

async function carregarParellesActives() {
  const dades = await obtenirJSONProtegit(`${window.PARELLES_AUTH.API_BASE}/pairings`);
  parellesActives = dades.data || [];
  renderitzarParellesActives(parellesActives);
  actualitzarSelectorsParelles();
  registrarAccio('Parelles actualitzades');
}

async function carregarDashboardComplet() {
  amagarEstat();

  try {
    await carregarResumDashboard();
    await carregarUsuaris();
    await carregarParellesActives();
  } catch (error) {
    mostrarEstat(error.message || 'No s ha pogut carregar el panell d administracio.', 'danger');
  }
}

function seleccionarParella(pairingId) {
  const parella = parellesActives.find((item) => item.id === pairingId);
  if (!parella) {
    mostrarEstat('No s ha pogut carregar la parella seleccionada.', 'warning');
    return;
  }

  parellaSeleccionadaId = parella.id;
  campsEstatParella.estat.value = parella.estat || 'activa';
  campsEstatParella.data_fi.value = parella.data_fi ? String(parella.data_fi).slice(0, 10) : '';
  campsEstatParella.observacions.value = parella.observacions || '';
  botoActualitzarParella.disabled = false;
  parellaSeleccionadaText.textContent = `Parella seleccionada: ${parella.voluntari_nom_complet} amb ${parella.aprenent_nom_complet}.`;
  registrarAccio('Parella preparada per gestionar');
}

async function eliminarParella(pairingId) {
  const parella = parellesActives.find((item) => item.id === pairingId);
  const textParella = parella
    ? `${parella.voluntari_nom_complet} amb ${parella.aprenent_nom_complet}`
    : 'aquesta parella';

  if (!window.confirm(`Vols eliminar ${textParella}?`)) {
    return;
  }

  try {
    await obtenirJSONProtegit(`${window.PARELLES_AUTH.API_BASE}/pairings/${pairingId}`, {
      method: 'DELETE'
    });

    if (parellaSeleccionadaId === pairingId) {
      netejarSeleccioParella();
    }

    await carregarResumDashboard();
    await carregarParellesActives();
    mostrarEstat('Parella eliminada correctament.', 'success');
    registrarAccio('Parella eliminada');
  } catch (error) {
    mostrarEstat(error.message || 'No s ha pogut eliminar la parella seleccionada.', 'danger');
  }
}

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
    await carregarParellesActives();
    mostrarEstat('Usuari eliminat correctament.', 'success');
    registrarAccio('Usuari eliminat');
  } catch (error) {
    mostrarEstat(error.message || 'No s ha pogut eliminar l usuari seleccionat.', 'danger');
  }
}

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

taulaParellesActives.addEventListener('click', (event) => {
  const botoGestionar = event.target.closest('[data-editar-parella]');
  if (botoGestionar) {
    seleccionarParella(Number(botoGestionar.dataset.editarParella));
    return;
  }

  const botoEliminar = event.target.closest('[data-eliminar-parella]');
  if (botoEliminar) {
    eliminarParella(Number(botoEliminar.dataset.eliminarParella));
  }
});

formulariNovaParella.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!formulariNovaParella.checkValidity()) {
    mostrarEstat('Revisa els camps obligatoris del formulari de nova parella.', 'warning');
    return;
  }

  botoCrearParella.disabled = true;
  botoCrearParella.textContent = 'Creant...';

  try {
    await obtenirJSONProtegit(`${window.PARELLES_AUTH.API_BASE}/pairings`, {
      method: 'POST',
      body: JSON.stringify({
        voluntari_id: Number(campsNovaParella.voluntari.value),
        aprenent_id: Number(campsNovaParella.aprenent.value),
        data_inici: campsNovaParella.data_inici.value,
        estat: campsNovaParella.estat.value,
        observacions: campsNovaParella.observacions.value.trim()
      })
    });

    formulariNovaParella.reset();
    establirDataIniciAvui();
    await carregarResumDashboard();
    await carregarParellesActives();
    mostrarEstat('Parella creada correctament.', 'success');
    registrarAccio('Parella creada');
  } catch (error) {
    mostrarEstat(error.message || 'No s ha pogut crear la parella.', 'danger');
  } finally {
    botoCrearParella.disabled = false;
    botoCrearParella.textContent = 'Crear parella';
  }
});

formulariEstatParella.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!parellaSeleccionadaId) {
    mostrarEstat('Primer has de seleccionar una parella del llistat.', 'warning');
    return;
  }

  if (!formulariEstatParella.checkValidity()) {
    mostrarEstat('Revisa els camps obligatoris del canvi d estat.', 'warning');
    return;
  }

  botoActualitzarParella.disabled = true;
  botoActualitzarParella.textContent = 'Actualitzant...';

  try {
    await obtenirJSONProtegit(`${window.PARELLES_AUTH.API_BASE}/pairings/${parellaSeleccionadaId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        estat: campsEstatParella.estat.value,
        data_fi: campsEstatParella.data_fi.value || null,
        observacions: campsEstatParella.observacions.value.trim()
      })
    });

    await carregarResumDashboard();
    await carregarParellesActives();
    netejarSeleccioParella();
    mostrarEstat('Estat de la parella actualitzat correctament.', 'success');
    registrarAccio('Estat de parella actualitzat');
  } catch (error) {
    mostrarEstat(error.message || 'No s ha pogut actualitzar la parella.', 'danger');
  } finally {
    botoActualitzarParella.disabled = false;
    botoActualitzarParella.textContent = 'Actualitzar estat';
  }
});

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

botoCancelarEdicio.addEventListener('click', () => {
  netejarFormulariEdicio();
  mostrarEstat('S ha cancelat la seleccio de l usuari.', 'secondary');
});

botoCancelarParella.addEventListener('click', () => {
  netejarSeleccioParella();
  mostrarEstat('S ha cancelat la seleccio de la parella.', 'secondary');
});

campsEdicio.rol.addEventListener('change', () => {
  actualitzarCampsEdicioPerRol(campsEdicio.rol.value);
});

botoCarregarUsuaris.addEventListener('click', async () => {
  try {
    amagarEstat();
    await carregarResumDashboard();
    await carregarUsuaris();
  } catch (error) {
    mostrarEstat(error.message || 'No s han pogut actualitzar els usuaris.', 'danger');
  }
});

botoCarregarParelles.addEventListener('click', async () => {
  try {
    amagarEstat();
    await carregarParellesActives();
  } catch (error) {
    mostrarEstat(error.message || 'No s han pogut actualitzar les parelles.', 'danger');
  }
});

netejarFormulariEdicio();
netejarSeleccioParella();
establirDataIniciAvui();

(async () => {
  const teAcces = await validarAccesAdministrador();
  if (!teAcces) {
    return;
  }

  await carregarDashboardComplet();
})();
