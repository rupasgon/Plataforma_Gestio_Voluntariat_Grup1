/**
 * @file voluntari-form.js 
 * @author Grup1
 * @description Registre de voluntaris - Gestió del formulari amb validacions i enviament a API.
 * @module voluntari-form 
 */

/**
 * Formulari de registre de voluntaris
 * @type {HTMLFormElement}
 */
const formulariVoluntari = document.getElementById('formulari_voluntari');

/**
 * Element on es mostra l'estat (missatges) del formulari
 * @type {HTMLElement}
 */
const estatVoluntari = document.getElementById('estat_voluntari');

/**
 * Botó d'enviament del formulari
 * @type {HTMLButtonElement}
 */
const botoEnviar = document.getElementById('boto_enviar_voluntari');

/**
 * URL base de l'API de registre
 * @type {string}
 */
const API_BASE_REGISTRE = window.PARELLES_AUTH?.API_BASE || 'http://localhost:3000/api';

/**
 * Objecte amb referències als camps del formulari
 * @type {Object<string, HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>}
 */
const camps = {
  nom: document.getElementById('nom'),
  cognoms: document.getElementById('cognoms'),
  correu: document.getElementById('correu'),
  password: document.getElementById('password'),
  passwordConfirm: document.getElementById('password_confirm'),
  telefon: document.getElementById('telefon'),
  parroquia: document.getElementById('parroquia'),
  dataNaixement: document.getElementById('data_naixement'),
  disponibilitat: document.getElementById('disponibilitat'),
  motivacio: document.getElementById('motivacio'),
  observacions: document.getElementById('observacions')
};

/**
 * Mostra un missatge d'estat a l'usuari
 * @param {string} missatge - Text del missatge a mostrar
 * @param {'success'|'danger'|'warning'|'info'} tipus - Tipus d'alerta (Bootstrap)
 */
function mostrarEstat(missatge, tipus) {
  estatVoluntari.className = `mt-3 alert alert-${tipus}`;
  estatVoluntari.textContent = missatge;
}

/**
 * Valida el format del correu electrònic
 * @returns {boolean}
 */
function validarCorreu() {
  const esValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(camps.correu.value.trim());
  camps.correu.setCustomValidity(esValid ? '' : 'Correu electronic no valid');
  return esValid;
}

/**
 * Valida el número de telèfon (6 a 15 dígits)
 * @returns {boolean}
 */
function validarTelefon() {
  const valor = camps.telefon.value.trim();
  if (!valor) {
    camps.telefon.setCustomValidity('Cal indicar el telefon.');
    return false;
  }

  const esValid = /^[0-9]{6,15}$/.test(valor);
  camps.telefon.setCustomValidity(esValid ? '' : 'Telefon no valid');
  return esValid;
}

/**
 * Valida que la data de naixement no sigui futura
 * @returns {boolean}
 */
function validarDataNaixement() {
  const valor = camps.dataNaixement.value;
  if (!valor) {
    camps.dataNaixement.setCustomValidity('Cal indicar la data de naixement.');
    return false;
  }

  const avui = new Date().toISOString().split('T')[0];
  const esValid = valor <= avui;
  camps.dataNaixement.setCustomValidity(esValid ? '' : 'La data de naixement no pot ser futura.');
  return esValid;
}

/**
 * Valida la contrasenya i la seva confirmació
 * @returns {boolean}
 */
function validarContrasenya() {
  const passwordValida = camps.password.value.trim().length >= 6;
  const confirmacioValida = camps.passwordConfirm.value === camps.password.value;

  camps.password.setCustomValidity(passwordValida ? '' : 'La contrasenya ha de tenir minim 6 caracters.');
  camps.passwordConfirm.setCustomValidity(confirmacioValida ? '' : 'La confirmacio no coincideix.');

  return passwordValida && confirmacioValida;
}

/**
 * Event: Validació en temps real del correu
 */
camps.correu.addEventListener('input', validarCorreu);

/**
 * Event: Validació en temps real del telèfon
 */
camps.telefon.addEventListener('input', validarTelefon);

/**
 * Event: Validació de la data de naixement
 */
camps.dataNaixement.addEventListener('change', validarDataNaixement);

/**
 * Event: Validació de la contrasenya
 */
camps.password.addEventListener('input', validarContrasenya);

/**
 * Event: Validació de la confirmació de contrasenya
 */
camps.passwordConfirm.addEventListener('input', validarContrasenya);

/**
 * Gestor d'enviament del formulari voluntari
 * @param {SubmitEvent} event
 */
formulariVoluntari.addEventListener('submit', async (event) => {
  event.preventDefault();

  validarCorreu();
  validarTelefon();
  validarDataNaixement();
  validarContrasenya();
  formulariVoluntari.classList.add('was-validated');

  if (!formulariVoluntari.checkValidity()) {
    mostrarEstat('Revisa els camps obligatoris del formulari de registre.', 'warning');
    return;
  }

  botoEnviar.disabled = true;
  botoEnviar.textContent = 'Enviant...';

  try {
    const resposta = await fetch(`${API_BASE_REGISTRE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nom: camps.nom.value.trim(),
        cognoms: camps.cognoms.value.trim(),
        email: camps.correu.value.trim(),
        password: camps.password.value,
        rol: 'voluntari',
        telefon: camps.telefon.value.trim(),
        parroquia: camps.parroquia.value,
        data_naixement: camps.dataNaixement.value,
        disponibilitat: camps.disponibilitat.value.trim(),
        observacions: [camps.motivacio.value.trim(), camps.observacions.value.trim()].filter(Boolean).join(' | ')
      })
    });

    const dades = await resposta.json();
    if (!resposta.ok) {
      throw new Error(dades.message || "No s'ha pogut completar el registre de voluntari.");
    }

    formulariVoluntari.reset();
    formulariVoluntari.classList.remove('was-validated');
    mostrarEstat('Registre completat correctament. Ja pots iniciar sessio.', 'success');
  } catch (error) {
    mostrarEstat(error.message, 'danger');
  } finally {
    botoEnviar.disabled = false;
    botoEnviar.textContent = 'Enviar formulari';
  }
});
