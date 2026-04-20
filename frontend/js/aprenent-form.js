const formulariAprenent = document.getElementById('formulari_aprenent');
const estatAprenent = document.getElementById('estat_aprenent');
const botoEnviar = document.getElementById('boto_enviar_aprenent');
const API_BASE_REGISTRE = window.PARELLES_AUTH?.API_BASE || 'http://localhost:3000/api';

const camps = {
  nom: document.getElementById('nom'),
  cognoms: document.getElementById('cognoms'),
  correu: document.getElementById('correu'),
  password: document.getElementById('password'),
  passwordConfirm: document.getElementById('password_confirm'),
  telefon: document.getElementById('telefon'),
  parroquia: document.getElementById('parroquia'),
  dataNaixement: document.getElementById('data_naixement'),
  nivellCatala: document.getElementById('nivell_catala'),
  objectiuPrincipal: document.getElementById('objectiu_principal'),
  potConversar: document.getElementById('pot_conversar'),
  disponibilitat: document.getElementById('disponibilitat'),
  observacions: document.getElementById('observacions')
};

function mostrarEstat(missatge, tipus) {
  estatAprenent.className = `mt-3 alert alert-${tipus}`;
  estatAprenent.textContent = missatge;
}

function validarCorreu() {
  const esValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(camps.correu.value.trim());
  camps.correu.setCustomValidity(esValid ? '' : 'Correu electronic no valid');
  return esValid;
}

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

function validarContrasenya() {
  const passwordValida = camps.password.value.trim().length >= 6;
  const confirmacioValida = camps.passwordConfirm.value === camps.password.value;

  camps.password.setCustomValidity(passwordValida ? '' : 'La contrasenya ha de tenir minim 6 caracters.');
  camps.passwordConfirm.setCustomValidity(confirmacioValida ? '' : 'La confirmacio no coincideix.');

  return passwordValida && confirmacioValida;
}

camps.correu.addEventListener('input', validarCorreu);
camps.telefon.addEventListener('input', validarTelefon);
camps.dataNaixement.addEventListener('change', validarDataNaixement);
camps.password.addEventListener('input', validarContrasenya);
camps.passwordConfirm.addEventListener('input', validarContrasenya);

formulariAprenent.addEventListener('submit', async (event) => {
  event.preventDefault();

  validarCorreu();
  validarTelefon();
  validarDataNaixement();
  validarContrasenya();
  formulariAprenent.classList.add('was-validated');

  if (!formulariAprenent.checkValidity()) {
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
        rol: 'aprenent',
        telefon: camps.telefon.value.trim(),
        parroquia: camps.parroquia.value,
        data_naixement: camps.dataNaixement.value,
        nivell_catala: camps.nivellCatala.value,
        objectiu_principal: camps.objectiuPrincipal.value.trim(),
        pot_conversar: camps.potConversar.value,
        disponibilitat: camps.disponibilitat.value.trim(),
        observacions: camps.observacions.value.trim()
      })
    });

    const dades = await resposta.json();
    if (!resposta.ok) {
      throw new Error(dades.message || "No s'ha pogut completar el registre d'aprenent.");
    }

    formulariAprenent.reset();
    formulariAprenent.classList.remove('was-validated');
    mostrarEstat('Registre completat correctament. Ja pots iniciar sessio.', 'success');
  } catch (error) {
    mostrarEstat(error.message, 'danger');
  } finally {
    botoEnviar.disabled = false;
    botoEnviar.textContent = 'Enviar formulari';
  }
});
