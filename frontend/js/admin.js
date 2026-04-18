const statTotalUsuaris = document.getElementById('stat_total_usuaris');
const statTotalParelles = document.getElementById('stat_total_parelles');
const statUltimaAccio = document.getElementById('stat_ultima_accio');
const estatAdmin = document.getElementById('estat_admin');
const botoLogout = document.getElementById('boto_logout');
const botoCarregarUsuaris = document.getElementById('carregar_usuaris');
const botoCarregarParelles = document.getElementById('carregar_parelles');
const botoExportarInforme = document.getElementById('exportar_informe');
const botoNetejarSortida = document.getElementById('netejar_sortida');
const taulaUltimsUsuaris = document.getElementById('taula_ultims_usuaris');
const taulaParellesActives = document.getElementById('taula_parelles_actives');
const formulariEdicioUsuari = document.getElementById('formulari_edicio_usuari');
const botoGuardarUsuari = document.getElementById('boto_guardar_usuari');
const botoCancelarEdicio = document.getElementById('boto_cancelar_edicio');
const usuariEdicioActual = document.getElementById('usuari_edicio_actual');

const campsEdicio = {
  nom: document.getElementById('edit_nom'),
  cognoms: document.getElementById('edit_cognoms'),
  email: document.getElementById('edit_correu'),
  rol: document.getElementById('edit_rol'),
  password: document.getElementById('edit_password'),
  telefon: document.getElementById('edit_telefon'),
  parroquia: document.getElementById('edit_parroquia'),
  data_naixement: document.getElementById('edit_data_naixement'),
  disponibilitat: document.getElementById('edit_disponibilitat'),
  observacions: document.getElementById('edit_observacions')
};

let resumAdmin = null;
let parellesActives = [];
let usuaris = [];
let usuariSeleccionatId = null;

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

function netejarFormulariEdicio() {
  formulariEdicioUsuari.reset();
  usuariSeleccionatId = null;
  botoGuardarUsuari.disabled = true;
  usuariEdicioActual.textContent = 'Cap usuari seleccionat.';
}

function emplenarFormulariEdicio(usuari) {
  campsEdicio.nom.value = usuari.nom || '';
  campsEdicio.cognoms.value = usuari.cognoms || '';
  campsEdicio.email.value = usuari.email || '';
  campsEdicio.rol.value = usuari.rol || 'voluntari';
  campsEdicio.password.value = '';
  campsEdicio.telefon.value = usuari.telefon || '';
  campsEdicio.parroquia.value = usuari.parroquia || '';
  campsEdicio.data_naixement.value = usuari.data_naixement ? String(usuari.data_naixement).slice(0, 10) : '';
  campsEdicio.disponibilitat.value = usuari.disponibilitat || '';
  campsEdicio.observacions.value = usuari.observacions || '';
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
    const missatge = dades?.message || 'La peticio no s\'ha pogut completar correctament.';
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
          </td>
        </tr>
      `
    )
    .join('');
}

function renderitzarParellesActives(parelles = []) {
  if (!parelles.length) {
    omplirTaulaBuida(taulaParellesActives, 'No hi ha parelles actives disponibles.');
    return;
  }

  taulaParellesActives.innerHTML = parelles
    .map(
      (parella) => `
        <tr>
          <td>${parella.voluntari_nom_complet}</td>
          <td>${parella.aprenent_nom_complet}</td>
          <td><span class="badge text-bg-success text-uppercase">${parella.estat}</span></td>
        </tr>
      `
    )
    .join('');
}

async function carregarResumDashboard() {
  const dades = await obtenirJSONProtegit(`${window.PARELLES_AUTH.API_BASE}/admin/dashboard`);
  resumAdmin = dades.data;
  statTotalUsuaris.textContent = String(resumAdmin.usuarisTotals ?? 0);
  statTotalParelles.textContent = String(resumAdmin.parellesActives ?? 0);
}

async function carregarUsuaris() {
  const dades = await obtenirJSONProtegit(`${window.PARELLES_AUTH.API_BASE}/users`);
  usuaris = dades.data || [];
  renderitzarUltimsUsuaris(usuaris);
  statTotalUsuaris.textContent = String(dades.total ?? usuaris.length);
  registrarAccio('Usuaris actualitzats');
}

async function carregarParellesActives() {
  const dades = await obtenirJSONProtegit(`${window.PARELLES_AUTH.API_BASE}/pairings?estat=activa`);
  parellesActives = dades.data || [];
  renderitzarParellesActives(parellesActives);
  statTotalParelles.textContent = String(dades.total ?? parellesActives.length);
  registrarAccio('Parelles actives actualitzades');
}

async function carregarDashboardComplet() {
  amagarEstat();

  try {
    await carregarResumDashboard();
    await carregarUsuaris();
    await carregarParellesActives();
  } catch (error) {
    mostrarEstat(error.message || 'No s\'ha pogut carregar el panell d\'administracio.', 'danger');
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
    mostrarEstat(error.message || 'No s\'ha pogut carregar l\'usuari seleccionat.', 'danger');
  }
}

async function tancarSessio() {
  try {
    await fetch(`${window.PARELLES_AUTH.API_BASE}/auth/logout`, {
      method: 'POST',
      headers: window.PARELLES_AUTH.obtenirCapcaleresAutenticades()
    });
  } catch (error) {
    // No cal bloquejar el tancament local.
  }

  window.PARELLES_AUTH.esborrarSessio();
  window.location.href = './login.html';
}

function netejarSortida() {
  resumAdmin = null;
  parellesActives = [];
  usuaris = [];
  statTotalUsuaris.textContent = '0';
  statTotalParelles.textContent = '0';
  statUltimaAccio.textContent = 'Cap';
  omplirTaulaBuida(taulaUltimsUsuaris, 'Has netejat la sortida. Torna a carregar les dades quan vulguis.', 4);
  omplirTaulaBuida(taulaParellesActives, 'Has netejat la sortida. Torna a carregar les dades quan vulguis.');
  netejarFormulariEdicio();
  mostrarEstat('S\'ha netejat la informacio mostrada al panell.', 'secondary');
}

function exportarInforme() {
  if (!resumAdmin) {
    mostrarEstat('Primer has de carregar el resum del panell abans d\'exportar-lo.', 'warning');
    return;
  }

  const informe = {
    data_exportacio: new Date().toISOString(),
    resum: resumAdmin,
    usuaris,
    parelles_actives: parellesActives
  };

  const blob = new Blob([JSON.stringify(informe, null, 2)], { type: 'application/json' });
  const enllac = document.createElement('a');
  enllac.href = URL.createObjectURL(blob);
  enllac.download = 'resum-admin.json';
  enllac.click();
  URL.revokeObjectURL(enllac.href);

  registrarAccio('Resum descarregat');
  mostrarEstat('S\'ha descarregat el resum del panell en format JSON.', 'success');
}

taulaUltimsUsuaris.addEventListener('click', async (event) => {
  const botoEditar = event.target.closest('[data-editar-usuari]');
  if (!botoEditar) {
    return;
  }

  await seleccionarUsuariPerEdicio(Number(botoEditar.dataset.editarUsuari));
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
    mostrarEstat(error.message || 'No s\'ha pogut actualitzar l\'usuari seleccionat.', 'danger');
  } finally {
    botoGuardarUsuari.disabled = false;
    botoGuardarUsuari.textContent = 'Guardar canvis';
  }
});

botoCancelarEdicio.addEventListener('click', () => {
  netejarFormulariEdicio();
  mostrarEstat('S\'ha cancelat la seleccio de l usuari.', 'secondary');
});

botoCarregarUsuaris.addEventListener('click', async () => {
  try {
    amagarEstat();
    await carregarResumDashboard();
    await carregarUsuaris();
  } catch (error) {
    mostrarEstat(error.message || 'No s\'han pogut actualitzar els usuaris.', 'danger');
  }
});

botoCarregarParelles.addEventListener('click', async () => {
  try {
    amagarEstat();
    await carregarParellesActives();
  } catch (error) {
    mostrarEstat(error.message || 'No s\'han pogut actualitzar les parelles.', 'danger');
  }
});

botoNetejarSortida.addEventListener('click', netejarSortida);
botoExportarInforme.addEventListener('click', exportarInforme);
botoLogout.addEventListener('click', tancarSessio);

netejarFormulariEdicio();

(async () => {
  const teAcces = await validarAccesAdministrador();
  if (!teAcces) {
    return;
  }

  await carregarDashboardComplet();
})();
