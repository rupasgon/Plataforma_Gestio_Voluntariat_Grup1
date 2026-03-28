// ===== ELEMENTS DEL FORMULARI =====
const formulariAcces = document.getElementById("formulari_acces");
const estatAcces = document.getElementById("estat_acces");
const campCorreu = document.getElementById("correu");
const campContrasenya = document.getElementById("contrasenya");
const botoEntrar = document.getElementById("boto_entrar");
const botoMostrarContrasenya = document.getElementById("mostrar_contrasenya");
const errorContrasenya = document.getElementById("error_contrasenya");

// Mostra un missatge visual sota el formulari
function mostrarEstat(missatge, tipus) {
  estatAcces.className = `mt-3 alert alert-${tipus}`;
  estatAcces.textContent = missatge;
}

// Comprova que la contrasenya tingui una longitud mínima
function validarContrasenya() {
  const valida = campContrasenya.value.trim().length >= 6;
  errorContrasenya.textContent = valida ? "" : "La contrasenya ha de tenir minim 6 caracters.";
  campContrasenya.classList.toggle("is-invalid", !valida);
  return valida;
}

// Mostra o amaga el text de la contrasenya
botoMostrarContrasenya.addEventListener("click", () => {
  const esText = campContrasenya.type === "text";
  campContrasenya.type = esText ? "password" : "text";
  botoMostrarContrasenya.textContent = esText ? "Mostrar" : "Ocultar";
});

// Revalida la contrasenya mentre s'escriu
campContrasenya.addEventListener("input", () => {
  if (campContrasenya.classList.contains("is-invalid")) {
    validarContrasenya();
  }
});

// Enviament del formulari d'accés
formulariAcces.addEventListener("submit", (esdeveniment) => {
  esdeveniment.preventDefault();

  const correuValid = campCorreu.checkValidity();
  const contrasenyaValida = validarContrasenya();

  campCorreu.classList.toggle("is-invalid", !correuValid);

  if (!correuValid || !contrasenyaValida) {
    mostrarEstat("Revisa els camps obligatoris abans d'entrar.", "warning");
    return;
  }

  botoEntrar.disabled = true;
  botoEntrar.textContent = "Verificant...";

  setTimeout(() => {
    botoEntrar.disabled = false;
    botoEntrar.textContent = "Entrar";

    const sessioRecordada = document.getElementById("recordar_sessio").checked;
    const textSessio = sessioRecordada ? " Sessio recordada." : "";

    mostrarEstat("Acces correcte." + textSessio, "success");
  }, 600);
});
