/**
 * @file profile.js 
 * @author Grup1
 * @description Gestió del perfil d'usuari - càrrega, edició i actualització de dades amb API.
 * @module profile 
 */

/**
 * Formulari de perfil
 * @type {HTMLFormElement}
 */
const formulariPerfil = document.getElementById('formulari_perfil');

/**
 * Element per mostrar missatges d'estat
 * @type {HTMLElement}
 */
const estatPerfil = document.getElementById('estat_perfil');

/**
 * Botó per guardar canvis
 * @type {HTMLButtonElement}
 */
const botoGuardar = document.getElementById('boto_guardar');

/**
 * Element que mostra el rol de l'usuari
 * @type {HTMLElement}
 */
const badgeRol = document.getElementById('rol_usuari');

/**
 * Camps del formulari de perfil
 * @type {Object<string, HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>}
 */
const campsPerfil = {
  nom: document.getElementById('nom'),
  cognoms: document.getElementById('cognoms'),
  correu: document.getElementById('correu'),
  telefon: document.getElementById('telefon'),
  parroquia: document.getElementById('parroquia'),
  data_naixement: document.getElementById('data_naixement'),
  nivell_catala: document.getElementById('nivell_catala'),
  objectiu_principal: document.getElementById('objectiu_principal'),
  pot_conversar: document.getElementById('pot_conversar'),
  disponibilitat: document.getElementById('disponibilitat'),
  observacions: document.getElementById('observacions')
};

/**
 * Camps exclusius per a usuaris amb rol "aprenent"
 * @type {HTMLElement[]}
 */
const campsAprenent = Array.from(document.querySelectorAll('[data-camp-aprenent]'));

/**
 * Rol actual del perfil
 * @type {string|null}
 */
let rolPerfilActual = null;

/**
 * Mostra un missatge d'estat
 * @param {string} missatge
 * @param {'success'|'danger'|'warning'|'info'} tipus
 */
function mostrarEstat(missatge, tipus) {
  estatPerfil.className = `alert alert-${tipus} mt-3`;
  estatPerfil.textContent = missatge;
}

/**
 * Tanca la sessió de l'usuari
 * @returns {Promise<void>}
 */
async function tancarSessio() {
  try {
    await fetch(`${window.PARELLES_AUTH.API_BASE}/auth/logout`, {
      method: 'POST',
      headers: window.PARELLES_AUTH.obtenirCapcaleresAutenticades()
    });
  } catch (error) {
    // No cal bloquejar el tancament local si l API no respon.
  }

  window.PARELLES_AUTH.esborrarSessio();
  window.location.href = './login.html';
}

/**
 * Mostra o amaga camps segons el rol
 * @param {string} rol - Rol de l'usuari
 */
function actualitzarCampsPerRol(rol) {
  rolPerfilActual = rol;
  const esAprenent = rol === 'aprenent';

  campsAprenent.forEach((element) => {
    element.classList.toggle('d-none', !esAprenent);
  });

  [campsPerfil.nivell_catala, campsPerfil.objectiu_principal, campsPerfil.pot_conversar].forEach((camp) => {
    camp.required = esAprenent;
    if (!esAprenent) {
      camp.value = '';
      camp.setCustomValidity('');
    }
  });
}

/**
 * Assigna un valor a un select assegurant que existeixi
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
 * Omple el formulari amb dades del perfil
 * @param {Object} perfil
 */
function emplenarFormulari(perfil) {
  actualitzarCampsPerRol(perfil.rol);
  campsPerfil.nom.value = perfil.nom || '';
  campsPerfil.cognoms.value = perfil.cognoms || '';
  campsPerfil.correu.value = perfil.email || '';
  campsPerfil.telefon.value = perfil.telefon || '';
  assignarValorSelect(campsPerfil.parroquia, perfil.parroquia);
  campsPerfil.data_naixement.value = perfil.data_naixement ? String(perfil.data_naixement).slice(0, 10) : '';
  assignarValorSelect(campsPerfil.nivell_catala, perfil.nivell_catala);
  campsPerfil.objectiu_principal.value = perfil.objectiu_principal || '';
  assignarValorSelect(campsPerfil.pot_conversar, perfil.pot_conversar);
  campsPerfil.disponibilitat.value = perfil.disponibilitat || '';
  campsPerfil.observacions.value = perfil.observacions || '';
  badgeRol.textContent = `Rol: ${perfil.rol}`;
}

/**
 * Carrega el perfil des de l'API
 * @returns {Promise<void>}
 */
async function carregarPerfil() {
  const sessio = window.PARELLES_AUTH.obtenirSessio();
  if (!sessio?.token) {
    window.location.href = './login.html';
    return;
  }

  try {
    const respostaSessio = await fetch(`${window.PARELLES_AUTH.API_BASE}/auth/me`, {
      headers: window.PARELLES_AUTH.obtenirCapcaleresAutenticades()
    });

    if (!respostaSessio.ok) {
      await tancarSessio();
      return;
    }

    const dadesSessio = await respostaSessio.json();
    if (!['voluntari', 'aprenent'].includes(dadesSessio.user.rol)) {
      window.location.href = dadesSessio.user.rol === 'admin' ? './admin.html' : './login.html';
      return;
    }

    const respostaPerfil = await fetch(`${window.PARELLES_AUTH.API_BASE}/profile/me`, {
      headers: window.PARELLES_AUTH.obtenirCapcaleresAutenticades()
    });

    const dadesPerfil = await respostaPerfil.json();
    if (!respostaPerfil.ok) {
      mostrarEstat(dadesPerfil.message || 'No s ha pogut carregar el perfil.', 'danger');
      return;
    }

    emplenarFormulari(dadesPerfil.data);
  } catch (error) {
    mostrarEstat('No s ha pogut carregar el perfil. Revisa la connexio amb l API.', 'danger');
  }
}

/**
 * Gestor d'enviament del formulari de perfil
 * @param {SubmitEvent} event
 */
formulariPerfil.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!formulariPerfil.checkValidity()) {
    mostrarEstat('Revisa els camps obligatoris del formulari.', 'warning');
    return;
  }

  botoGuardar.disabled = true;
  botoGuardar.textContent = 'Guardant...';

  const payload = {
    nom: campsPerfil.nom.value.trim(),
    cognoms: campsPerfil.cognoms.value.trim(),
    email: campsPerfil.correu.value.trim(),
    telefon: campsPerfil.telefon.value.trim(),
    parroquia: campsPerfil.parroquia.value.trim(),
    data_naixement: campsPerfil.data_naixement.value,
    disponibilitat: campsPerfil.disponibilitat.value.trim(),
    observacions: campsPerfil.observacions.value.trim()
  };

  if (rolPerfilActual === 'aprenent') {
    payload.nivell_catala = campsPerfil.nivell_catala.value;
    payload.objectiu_principal = campsPerfil.objectiu_principal.value.trim();
    payload.pot_conversar = campsPerfil.pot_conversar.value;
  }

  try {
    const resposta = await fetch(`${window.PARELLES_AUTH.API_BASE}/profile/me`, {
      method: 'PUT',
      headers: window.PARELLES_AUTH.obtenirCapcaleresAutenticades(),
      body: JSON.stringify(payload)
    });

    const dades = await resposta.json();
    if (!resposta.ok) {
      mostrarEstat(dades.message || 'No s ha pogut actualitzar el perfil.', 'danger');
      return;
    }

    const sessio = window.PARELLES_AUTH.obtenirSessio();
    if (sessio) {
      window.PARELLES_AUTH.desarSessio(
        {
          ...sessio,
          user: {
            ...sessio.user,
            nom: dades.data.nom,
            cognoms: dades.data.cognoms,
            email: dades.data.email,
            rol: dades.data.rol
          }
        },
        window.PARELLES_AUTH.teSessioRecordada()
      );
    }

    emplenarFormulari(dades.data);
    mostrarEstat('Perfil actualitzat correctament.', 'success');
  } catch (error) {
    mostrarEstat('No s ha pogut desar el perfil. Revisa la connexio amb l API.', 'danger');
  } finally {
    botoGuardar.disabled = false;
    botoGuardar.textContent = 'Guardar canvis';
  }
});

/**
 * Inicialització: carrega el perfil en carregar la pàgina
 */
carregarPerfil();
