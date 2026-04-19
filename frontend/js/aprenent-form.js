const formulariAprenent = document.getElementById('formulari_aprenent');
const estatAprenent = document.getElementById('estat_aprenent');
const botoEnviar = formulariAprenent.querySelector('button[type="submit"]');
const API_BASE = window.PARELLES_AUTH?.API_BASE || 'http://localhost:3000/api';

const camps = {
  nom: document.getElementById('nom'),
  cognoms: document.getElementById('cognoms'),
  correu: document.getElementById('correu'),
  password: document.getElementById('password'),
  passwordConfirm: document.getElementById('password_confirm'),
  telefon: document.getElementById('telefon'),
  nivellCatala: document.getElementById('nivell_catala'),
  objectiuPrincipal: document.getElementById('objectiu_principal'),
  disponibilitat: document.getElementById('disponibilitat')
};

function mostrarEstat(missatge, tipus) {
  estatAprenent.className = `mt-3 alert alert-${tipus}`;
  estatAprenent.textContent = missatge;
}

function validarCorreu() {
  const esValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(camps.correu.value.trim());
  camps.correu.setCustomValidity(esValid ? '' : 'Correu electronic invalid');
  return esValid;
}

function validarTelefon() {
  const valor = camps.telefon.value.trim();
  if (!valor) {
    camps.telefon.setCustomValidity('');
    return true;
  }

  const esValid = /^[0-9]{6,15}$/.test(valor);
  camps.telefon.setCustomValidity(esValid ? '' : 'Telefon invalid');
  return esValid;
}

function validarContrasenya() {
  const passwordValida = camps.password.value.trim().length >= 6;
  const confirmacioValida = camps.passwordConfirm.value === camps.password.value;

  camps.password.setCustomValidity(passwordValida ? '' : 'Contrasenya massa curta');
  camps.passwordConfirm.setCustomValidity(confirmacioValida ? '' : 'La confirmacio no coincideix');

  return passwordValida && confirmacioValida;
}

camps.correu.addEventListener('input', validarCorreu);
camps.telefon.addEventListener('input', validarTelefon);
camps.password.addEventListener('input', validarContrasenya);
camps.passwordConfirm.addEventListener('input', validarContrasenya);

formulariAprenent.addEventListener('submit', async (event) => {
  event.preventDefault();

  validarCorreu();
  validarTelefon();
  validarContrasenya();
  formulariAprenent.classList.add('was-validated');

  if (!formulariAprenent.checkValidity()) {
    mostrarEstat('Revisa els camps obligatoris del formulari.', 'warning');
    return;
  }

  botoEnviar.disabled = true;
  botoEnviar.textContent = 'Enviant...';

  try {
    const resposta = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nom: camps.nom.value.trim(),
        cognoms: camps.cognoms.value.trim(),
        email: camps.correu.value.trim(),
        password: camps.password.value,
        rol: 'aprenent',
        telefon: camps.telefon.value.trim(),
        disponibilitat: camps.disponibilitat.value.trim(),
        observacions: `Nivell: ${camps.nivellCatala.value || '-'} | Objectiu: ${camps.objectiuPrincipal.value.trim() || '-'}`
      })
    });

    const dades = await resposta.json();
    if (!resposta.ok) {
      throw new Error(dades.message || "No s'ha pogut crear l'aprenent.");
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
