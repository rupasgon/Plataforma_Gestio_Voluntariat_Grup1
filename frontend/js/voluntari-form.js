const formulariVoluntari = document.getElementById('formulari_voluntari');
const estatVoluntari = document.getElementById('estat_voluntari');
const botoEnviar = formulariVoluntari.querySelector('button[type="submit"]');

const camps = {
  nom: document.getElementById('nom'),
  cognoms: document.getElementById('cognoms'),
  correu: document.getElementById('correu'),
  password: document.getElementById('password'),
  passwordConfirm: document.getElementById('password_confirm'),
  telefon: document.getElementById('telefon'),
  disponibilitat: document.getElementById('disponibilitat'),
  motivacio: document.getElementById('motivacio')
};

function mostrarEstat(missatge, tipus) {
  estatVoluntari.className = `mt-3 alert alert-${tipus}`;
  estatVoluntari.textContent = missatge;
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

async function validarAccesAdmin() {
  const sessio = window.PARELLES_AUTH.obtenirSessio();
  if (!sessio?.token) {
    window.location.href = './login2.html';
    return false;
  }

  try {
    const resposta = await fetch(`${window.PARELLES_AUTH.API_BASE}/auth/me`, {
      headers: window.PARELLES_AUTH.obtenirCapcaleresAutenticades()
    });

    if (!resposta.ok) {
      window.PARELLES_AUTH.esborrarSessio();
      window.location.href = './login2.html';
      return false;
    }

    const dades = await resposta.json();
    if (dades.user.rol !== 'admin') {
      window.location.href = './profile.html';
      return false;
    }

    return true;
  } catch (_error) {
    mostrarEstat("No s'ha pogut validar la sessio d'administrador.", 'danger');
    return false;
  }
}

camps.correu.addEventListener('input', validarCorreu);
camps.telefon.addEventListener('input', validarTelefon);
camps.password.addEventListener('input', validarContrasenya);
camps.passwordConfirm.addEventListener('input', validarContrasenya);

formulariVoluntari.addEventListener('submit', async (event) => {
  event.preventDefault();

  validarCorreu();
  validarTelefon();
  validarContrasenya();
  formulariVoluntari.classList.add('was-validated');

  if (!formulariVoluntari.checkValidity()) {
    mostrarEstat('Revisa els camps obligatoris del formulari.', 'warning');
    return;
  }

  botoEnviar.disabled = true;
  botoEnviar.textContent = 'Enviant...';

  try {
    const resposta = await fetch(`${window.PARELLES_AUTH.API_BASE}/users`, {
      method: 'POST',
      headers: window.PARELLES_AUTH.obtenirCapcaleresAutenticades(),
      body: JSON.stringify({
        nom: camps.nom.value.trim(),
        cognoms: camps.cognoms.value.trim(),
        email: camps.correu.value.trim(),
        password: camps.password.value,
        rol: 'voluntari',
        telefon: camps.telefon.value.trim(),
        disponibilitat: camps.disponibilitat.value.trim(),
        observacions: camps.motivacio.value.trim()
      })
    });

    const dades = await resposta.json();
    if (!resposta.ok) {
      throw new Error(dades.message || "No s'ha pogut crear el voluntari.");
    }

    formulariVoluntari.reset();
    formulariVoluntari.classList.remove('was-validated');
    mostrarEstat('Usuari voluntari creat correctament.', 'success');
  } catch (error) {
    mostrarEstat(error.message, 'danger');
  } finally {
    botoEnviar.disabled = false;
    botoEnviar.textContent = 'Enviar formulari';
  }
});

(async () => {
  await validarAccesAdmin();
})();
