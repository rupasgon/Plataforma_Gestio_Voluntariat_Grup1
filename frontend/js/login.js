const formulariAcces = document.getElementById('formulari_acces');
const estatAcces = document.getElementById('estat_acces');
const campCorreu = document.getElementById('correu');
const campContrasenya = document.getElementById('contrasenya');
const botoEntrar = document.getElementById('boto_entrar');
const botoMostrarContrasenya = document.getElementById('mostrar_contrasenya');
const errorContrasenya = document.getElementById('error_contrasenya');
const campRecordarSessio = document.getElementById('recordar_sessio');

function mostrarEstat(missatge, tipus) {
  estatAcces.className = `alert alert-${tipus} mt-3`;
  estatAcces.textContent = missatge;
}

function validarContrasenya() {
  const valida = campContrasenya.value.trim().length >= 6;
  errorContrasenya.textContent = valida ? '' : 'La contrasenya ha de tenir com a minim 6 caracters.';
  campContrasenya.classList.toggle('is-invalid', !valida);
  return valida;
}

function obtenirDestiPerRol(rol) {
  return rol === 'admin' ? './admin.html' : './profile.html';
}

async function redirigirSiJaHiHaSessio() {
  const sessio = window.PARELLES_AUTH.obtenirSessio();
  if (!sessio?.token) {
    return;
  }

  try {
    const resposta = await fetch(`${window.PARELLES_AUTH.API_BASE}/auth/me`, {
      headers: window.PARELLES_AUTH.obtenirCapcaleresAutenticades()
    });

    if (!resposta.ok) {
      window.PARELLES_AUTH.esborrarSessio();
      return;
    }

    const dades = await resposta.json();
    window.location.href = obtenirDestiPerRol(dades.user.rol);
  } catch (error) {
    mostrarEstat('No s\'ha pogut comprovar la sessio actual. Assegura\'t que l\'API estigui en marxa.', 'warning');
  }
}

botoMostrarContrasenya.addEventListener('click', () => {
  const esText = campContrasenya.type === 'text';
  campContrasenya.type = esText ? 'password' : 'text';
  botoMostrarContrasenya.textContent = esText ? 'Mostrar' : 'Ocultar';
});

campContrasenya.addEventListener('input', () => {
  if (campContrasenya.classList.contains('is-invalid')) {
    validarContrasenya();
  }
});

formulariAcces.addEventListener('submit', async (event) => {
  event.preventDefault();

  const correuValid = campCorreu.checkValidity();
  const contrasenyaValida = validarContrasenya();

  campCorreu.classList.toggle('is-invalid', !correuValid);

  if (!correuValid || !contrasenyaValida) {
    mostrarEstat('Revisa els camps obligatoris abans d\'entrar.', 'warning');
    return;
  }

  botoEntrar.disabled = true;
  botoEntrar.textContent = 'Verificant...';

  try {
    const resposta = await fetch(`${window.PARELLES_AUTH.API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: campCorreu.value.trim(),
        password: campContrasenya.value,
        recordarSessio: campRecordarSessio.checked
      })
    });

    const dades = await resposta.json();

    if (!resposta.ok) {
      mostrarEstat(dades.message || 'No s\'ha pogut iniciar la sessio.', 'danger');
      return;
    }

    window.PARELLES_AUTH.desarSessio(
      {
        token: dades.token,
        user: dades.user,
        expiresAt: dades.expiresAt
      },
      campRecordarSessio.checked
    );

    mostrarEstat('Inici de sessio correcte. Redirigint...', 'success');
    window.setTimeout(() => {
      window.location.href = obtenirDestiPerRol(dades.user.rol);
    }, 400);
  } catch (error) {
    mostrarEstat('No s\'ha pogut connectar amb l\'API. Revisa que el servidor backend estigui actiu.', 'danger');
  } finally {
    botoEntrar.disabled = false;
    botoEntrar.textContent = 'Entrar';
  }
});

redirigirSiJaHiHaSessio();
