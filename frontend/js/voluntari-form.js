const formulariVoluntari = document.getElementById('formulari_voluntari');
const estatVoluntari = document.getElementById('estat_voluntari');
const botoEnviar = document.getElementById('boto_enviar_voluntari');
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
  disponibilitat: document.getElementById('disponibilitat'),
  motivacio: document.getElementById('motivacio'),
  observacions: document.getElementById('observacions')
};

function mostrarEstat(missatge, tipus) {
  estatVoluntari.className = `mt-3 alert alert-${tipus}`;
  estatVoluntari.textContent = missatge;
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
