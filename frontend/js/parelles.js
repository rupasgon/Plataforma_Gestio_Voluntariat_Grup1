const taulaParelles = document.getElementById('taula_parelles');
const estatParelles = document.getElementById('estat_parelles');
const filtreEstatParelles = document.getElementById('filtre_estat_parelles');
const botoRecarregarParelles = document.getElementById('boto_recarregar_parelles');
const parellesSessio = document.getElementById('parelles_sessio');
const parellesResum = document.getElementById('parelles_resum');
const statParellesTotal = document.getElementById('stat_parelles_total');
const statParellesActives = document.getElementById('stat_parelles_actives');
const statParellesPausades = document.getElementById('stat_parelles_pausades');
const statParellesTancades = document.getElementById('stat_parelles_tancades');
const formulariNovaParella = document.getElementById('formulari_nova_parella');
const formulariEstatParella = document.getElementById('formulari_estat_parella');
const botoCrearParella = document.getElementById('boto_crear_parella');
const botoActualitzarParella = document.getElementById('boto_actualitzar_parella');
const botoCancelarParella = document.getElementById('boto_cancelar_parella');
const parellaSeleccionadaText = document.getElementById('parella_seleccionada_text');

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

let parelles = [];
let usuaris = [];
let parellaSeleccionadaId = null;

function mostrarEstatParelles(missatge, tipus = 'info') {
  estatParelles.className = `alert alert-${tipus}`;
  estatParelles.textContent = missatge;
  estatParelles.classList.remove('d-none');
}

function amagarEstatParelles() {
  estatParelles.classList.add('d-none');
  estatParelles.textContent = '';
}

function formatData(data) {
  return data ? String(data).slice(0, 10) : '-';
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

function omplirTaulaBuida(missatge) {
  taulaParelles.innerHTML = `<tr><td colspan="6" class="text-muted">${missatge}</td></tr>`;
}

function actualitzarResumEstats() {
  const resum = parelles.reduce(
    (acumulat, parella) => {
      acumulat.total += 1;
      if (parella.estat === 'activa') {
        acumulat.actives += 1;
      } else if (parella.estat === 'pausada') {
        acumulat.pausades += 1;
      } else if (parella.estat === 'tancada') {
        acumulat.tancades += 1;
      }

      return acumulat;
    },
    { total: 0, actives: 0, pausades: 0, tancades: 0 }
  );

  statParellesTotal.textContent = String(resum.total);
  statParellesActives.textContent = String(resum.actives);
  statParellesPausades.textContent = String(resum.pausades);
  statParellesTancades.textContent = String(resum.tancades);
}

function renderitzarParelles(llistat = []) {
  if (!llistat.length) {
    omplirTaulaBuida('No hi ha parelles per mostrar.');
    parellesResum.textContent = '0 parelles trobades.';
    return;
  }

  taulaParelles.innerHTML = llistat
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
            <button class="btn btn-sm btn-outline-primary" type="button" data-editar-parella="${parella.id}">Canviar estat</button>
            <button class="btn btn-sm btn-outline-danger ms-1" type="button" data-eliminar-parella="${parella.id}">Eliminar</button>
          </td>
        </tr>
      `
    )
    .join('');

  parellesResum.textContent = `${llistat.length} parelles trobades.`;
}

function participantTeParellaOberta(usuari) {
  return parelles.some((parella) => {
    if (!['activa', 'pausada'].includes(parella.estat)) {
      return false;
    }

    return parella.voluntari_id === usuari.perfil_id || parella.aprenent_id === usuari.perfil_id;
  });
}

function construirOpcionsUsuari(usuarisRol, placeholder) {
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

function establirDataIniciAvui() {
  campsNovaParella.data_inici.value = new Date().toISOString().slice(0, 10);
}

function netejarSeleccioParella() {
  formulariEstatParella.reset();
  parellaSeleccionadaId = null;
  botoActualitzarParella.disabled = true;
  parellaSeleccionadaText.textContent = 'Cap parella seleccionada.';
}

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

async function carregarUsuaris() {
  const dades = await obtenirJSONProtegit(`${window.PARELLES_AUTH.API_BASE}/users`);
  usuaris = dades.data || [];
  actualitzarSelectorsParelles();
}

async function carregarParelles() {
  const estat = filtreEstatParelles.value;

  botoRecarregarParelles.disabled = true;
  botoRecarregarParelles.textContent = 'Carregant...';
  amagarEstatParelles();

  try {
    const dades = await obtenirJSONProtegit(`${window.PARELLES_AUTH.API_BASE}/pairings`);
    parelles = dades.data || [];
    actualitzarResumEstats();
    const parellesFiltrades = estat ? parelles.filter((parella) => parella.estat === estat) : parelles;
    renderitzarParelles(parellesFiltrades);
    actualitzarSelectorsParelles();
  } catch (error) {
    parelles = [];
    actualitzarResumEstats();
    renderitzarParelles([]);
    mostrarEstatParelles(error.message || 'No s han pogut carregar les parelles.', 'danger');
  } finally {
    botoRecarregarParelles.disabled = false;
    botoRecarregarParelles.textContent = 'Actualitzar';
  }
}

async function carregarVistaCompleta() {
  await carregarUsuaris();
  await carregarParelles();
}

function seleccionarParella(pairingId) {
  const parella = parelles.find((item) => item.id === pairingId);
  if (!parella) {
    mostrarEstatParelles('No s ha pogut carregar la parella seleccionada.', 'warning');
    return;
  }

  parellaSeleccionadaId = parella.id;
  campsEstatParella.estat.value = parella.estat || 'activa';
  campsEstatParella.data_fi.value = parella.data_fi ? String(parella.data_fi).slice(0, 10) : '';
  campsEstatParella.observacions.value = parella.observacions || '';
  botoActualitzarParella.disabled = false;
  parellaSeleccionadaText.textContent = `Parella seleccionada: ${parella.voluntari_nom_complet} amb ${parella.aprenent_nom_complet}.`;
}

async function eliminarParella(pairingId) {
  const parella = parelles.find((item) => item.id === pairingId);
  const textParella = parella ? `${parella.voluntari_nom_complet} amb ${parella.aprenent_nom_complet}` : 'aquesta parella';

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

    await carregarVistaCompleta();
    mostrarEstatParelles('Parella eliminada correctament.', 'success');
  } catch (error) {
    mostrarEstatParelles(error.message || 'No s ha pogut eliminar la parella seleccionada.', 'danger');
  }
}

async function validarAccesParelles() {
  const sessio = window.PARELLES_AUTH.obtenirSessio();
  if (!sessio?.token) {
    window.location.href = './login.html';
    return false;
  }

  try {
    const dades = await obtenirJSONProtegit(`${window.PARELLES_AUTH.API_BASE}/auth/me`);
    if (dades.user.rol !== 'admin') {
      window.location.href = './profile.html';
      return false;
    }

    parellesSessio.textContent = `${dades.user.nom} (${dades.user.rol})`;
    return true;
  } catch (error) {
    window.PARELLES_AUTH.esborrarSessio();
    window.location.href = './login.html';
    return false;
  }
}

taulaParelles.addEventListener('click', (event) => {
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
    mostrarEstatParelles('Revisa els camps obligatoris del formulari de nova parella.', 'warning');
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
    await carregarVistaCompleta();
    mostrarEstatParelles('Parella creada correctament.', 'success');
  } catch (error) {
    mostrarEstatParelles(error.message || 'No s ha pogut crear la parella.', 'danger');
  } finally {
    botoCrearParella.disabled = false;
    botoCrearParella.textContent = 'Crear parella';
  }
});

formulariEstatParella.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!parellaSeleccionadaId) {
    mostrarEstatParelles('Primer has de seleccionar una parella del llistat.', 'warning');
    return;
  }

  if (!formulariEstatParella.checkValidity()) {
    mostrarEstatParelles('Revisa els camps obligatoris del canvi d estat.', 'warning');
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

    await carregarVistaCompleta();
    netejarSeleccioParella();
    mostrarEstatParelles('Estat de la parella actualitzat correctament.', 'success');
  } catch (error) {
    mostrarEstatParelles(error.message || 'No s ha pogut actualitzar la parella.', 'danger');
  } finally {
    botoActualitzarParella.disabled = false;
    botoActualitzarParella.textContent = 'Actualitzar estat';
  }
});

botoCancelarParella.addEventListener('click', () => {
  netejarSeleccioParella();
  mostrarEstatParelles('S ha cancelat la seleccio de la parella.', 'secondary');
});

filtreEstatParelles.addEventListener('change', carregarParelles);
botoRecarregarParelles.addEventListener('click', carregarParelles);

netejarSeleccioParella();
establirDataIniciAvui();

(async () => {
  const teAcces = await validarAccesParelles();
  if (teAcces) {
    await carregarVistaCompleta();
  }
})();
