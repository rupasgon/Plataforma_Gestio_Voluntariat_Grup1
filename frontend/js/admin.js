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

let resumAdmin = null;
let parellesActives = [];

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

function omplirTaulaBuida(element, missatge) {
  element.innerHTML = `<tr><td colspan="3" class="text-muted">${missatge}</td></tr>`;
}

function renderitzarUltimsUsuaris(usuaris = []) {
  if (!usuaris.length) {
    omplirTaulaBuida(taulaUltimsUsuaris, 'No hi ha usuaris recents per mostrar.');
    return;
  }

  taulaUltimsUsuaris.innerHTML = usuaris
    .map(
      (usuari) => `
        <tr>
          <td>${usuari.nom} ${usuari.cognoms}</td>
          <td>${usuari.email}</td>
          <td><span class="badge text-bg-light text-uppercase">${usuari.rol}</span></td>
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

async function obtenirJSONProtegit(url) {
  const resposta = await fetch(url, {
    headers: window.PARELLES_AUTH.obtenirCapcaleresAutenticades()
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

async function carregarResumDashboard() {
  const dades = await obtenirJSONProtegit(`${window.PARELLES_AUTH.API_BASE}/admin/dashboard`);
  resumAdmin = dades.data;
  statTotalUsuaris.textContent = String(resumAdmin.usuarisTotals ?? 0);
  statTotalParelles.textContent = String(resumAdmin.parellesActives ?? 0);
  renderitzarUltimsUsuaris(resumAdmin.ultimsUsuaris || []);
  registrarAccio('Resum administratiu actualitzat');
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
    await carregarParellesActives();
  } catch (error) {
    mostrarEstat(error.message || 'No s\'ha pogut carregar el panell d\'administracio.', 'danger');
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
  statTotalUsuaris.textContent = '0';
  statTotalParelles.textContent = '0';
  statUltimaAccio.textContent = 'Cap';
  omplirTaulaBuida(taulaUltimsUsuaris, 'Has netejat la sortida. Torna a carregar les dades quan vulguis.');
  omplirTaulaBuida(taulaParellesActives, 'Has netejat la sortida. Torna a carregar les dades quan vulguis.');
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

botoCarregarUsuaris.addEventListener('click', async () => {
  try {
    amagarEstat();
    await carregarResumDashboard();
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

(async () => {
  const teAcces = await validarAccesAdministrador();
  if (!teAcces) {
    return;
  }

  await carregarDashboardComplet();
})();
