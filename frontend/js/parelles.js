const taulaParelles = document.getElementById('taula_parelles');
const estatParelles = document.getElementById('estat_parelles');
const filtreEstatParelles = document.getElementById('filtre_estat_parelles');
const botoRecarregarParelles = document.getElementById('boto_recarregar_parelles');
const parellesSessio = document.getElementById('parelles_sessio');
const parellesResum = document.getElementById('parelles_resum');

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

function renderitzarParelles(parelles = []) {
  if (!parelles.length) {
    taulaParelles.innerHTML = '<tr><td colspan="5" class="text-muted">No hi ha parelles per mostrar.</td></tr>';
    parellesResum.textContent = '0 parelles trobades.';
    return;
  }

  taulaParelles.innerHTML = parelles
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
        </tr>
      `
    )
    .join('');

  parellesResum.textContent = `${parelles.length} parelles trobades.`;
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

async function carregarParelles() {
  const estat = filtreEstatParelles.value;
  const query = estat ? `?estat=${encodeURIComponent(estat)}` : '';

  botoRecarregarParelles.disabled = true;
  botoRecarregarParelles.textContent = 'Carregant...';
  amagarEstatParelles();

  try {
    const dades = await obtenirJSONProtegit(`${window.PARELLES_AUTH.API_BASE}/pairings${query}`);
    renderitzarParelles(dades.data || []);
  } catch (error) {
    renderitzarParelles([]);
    mostrarEstatParelles(error.message || 'No s han pogut carregar les parelles.', 'danger');
  } finally {
    botoRecarregarParelles.disabled = false;
    botoRecarregarParelles.textContent = 'Actualitzar';
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

filtreEstatParelles.addEventListener('change', carregarParelles);
botoRecarregarParelles.addEventListener('click', carregarParelles);

(async () => {
  const teAcces = await validarAccesParelles();
  if (teAcces) {
    await carregarParelles();
  }
})();
