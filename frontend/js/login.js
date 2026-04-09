// ===== ELEMENTS DEL FORMULARI =====
const formulariAcces = document.getElementById("formulari_acces");
const estatAcces = document.getElementById("estat_acces");
const campIdentificador = document.getElementById("identificador");
const campContrasenya = document.getElementById("contrasenya");
const botoEntrar = document.getElementById("boto_entrar");
const botoMostrarContrasenya = document.getElementById("mostrar_contrasenya");
const checkRecordarSessio = document.getElementById("recordar_sessio");
const errorIdentificador = document.getElementById("error_identificador");
const errorContrasenya = document.getElementById("error_contrasenya");

const sessioActiva = AuthSession.loadSession();
if (sessioActiva?.user?.rol) {
  AuthSession.redirectByRole(sessioActiva.user.rol);
}

function mostrarEstat(missatge, tipus) {
  estatAcces.className = `login-status mt-4 alert alert-${tipus}`;
  estatAcces.textContent = missatge;
}

function validarIdentificador() {
  const valor = campIdentificador.value.trim();
  const semblaCorreu = valor.includes("@");
  const correuValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
  const usuariValid = valor.length >= 3;
  const esValid = semblaCorreu ? correuValid : usuariValid;

  let missatge = "";
  if (!valor) {
    missatge = "Introdueix el teu usuari o correu electronic.";
  } else if (semblaCorreu && !correuValid) {
    missatge = "El format del correu electronic no es valid.";
  } else if (!semblaCorreu && !usuariValid) {
    missatge = "El nom d usuari ha de tenir minim 3 caracters.";
  }

  errorIdentificador.textContent = missatge;
  campIdentificador.classList.toggle("is-invalid", !esValid);
  return esValid;
}

function validarContrasenya() {
  const valor = campContrasenya.value.trim();
  const valida = valor.length >= 6;

  let missatge = "";
  if (!valor) {
    missatge = "Introdueix la contrasenya.";
  } else if (!valida) {
    missatge = "La contrasenya ha de tenir minim 6 caracters.";
  }

  errorContrasenya.textContent = missatge;
  campContrasenya.classList.toggle("is-invalid", !valida);
  return valida;
}

async function enviarCredencials() {
  const resposta = await fetch(`${AuthSession.API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      identificador: campIdentificador.value.trim(),
      password: campContrasenya.value
    })
  });

  const dades = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    throw new Error(dades.message || "No s ha pogut iniciar la sessio.");
  }

  return dades;
}

botoMostrarContrasenya.addEventListener("click", () => {
  const esText = campContrasenya.type === "text";
  campContrasenya.type = esText ? "password" : "text";
  botoMostrarContrasenya.textContent = esText ? "Mostrar" : "Ocultar";
});

campIdentificador.addEventListener("input", () => {
  if (campIdentificador.classList.contains("is-invalid")) {
    validarIdentificador();
  }
});

campContrasenya.addEventListener("input", () => {
  if (campContrasenya.classList.contains("is-invalid")) {
    validarContrasenya();
  }
});

formulariAcces.addEventListener("submit", async (esdeveniment) => {
  esdeveniment.preventDefault();

  const identificadorValid = validarIdentificador();
  const contrasenyaValida = validarContrasenya();

  if (!identificadorValid || !contrasenyaValida) {
    mostrarEstat("Revisa els camps obligatoris abans d entrar.", "warning");
    return;
  }

  botoEntrar.disabled = true;
  botoEntrar.textContent = "Verificant...";
  mostrarEstat("Validant les credencials...", "info");

  try {
    const dades = await enviarCredencials();

    AuthSession.saveSession(
      {
        token: dades.token,
        user: dades.user
      },
      checkRecordarSessio.checked
    );

    mostrarEstat("Sessio iniciada correctament. Redirigint...", "success");
    window.setTimeout(() => {
      AuthSession.redirectByRole(dades.user.rol);
    }, 350);
  } catch (error) {
    mostrarEstat(error.message, "danger");
  } finally {
    botoEntrar.disabled = false;
    botoEntrar.textContent = "Entrar";
  }
});
