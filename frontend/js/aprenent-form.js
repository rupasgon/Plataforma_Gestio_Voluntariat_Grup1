const formulariAprenent = document.getElementById("formulari_aprenent");
const estatAprenent = document.getElementById("estat_aprenent");
const botoEnviar = document.getElementById("boto_enviar_aprenent");
const campNom = document.getElementById("nom");
const campCognoms = document.getElementById("cognoms");
const campCorreu = document.getElementById("correu");
const campTelefon = document.getElementById("telefon");
const campParroquia = document.getElementById("parroquia");
const campDataNaixement = document.getElementById("data_naixement");
const campNivellCatala = document.getElementById("nivell_catala");
const campObjectiuPrincipal = document.getElementById("objectiu_principal");
const campPotConversar = document.getElementById("pot_conversar");
const campDisponibilitat = document.getElementById("disponibilitat");
const campObservacions = document.getElementById("observacions");

const API_BASE = "http://localhost:3000/api";

function mostrarEstat(missatge, tipus) {
  estatAprenent.className = `mt-3 alert alert-${tipus}`;
  estatAprenent.textContent = missatge;
}

function validarTelefon() {
  const valor = campTelefon.value.trim();
  const esValid = /^[0-9]{6,15}$/.test(valor);
  campTelefon.setCustomValidity(esValid ? "" : "Telefon invalid");
  return esValid;
}

function validarDataNaixement() {
  const valor = campDataNaixement.value;
  if (!valor) {
    campDataNaixement.setCustomValidity("");
    return false;
  }

  const avui = new Date().toISOString().split("T")[0];
  const esValid = valor <= avui;
  campDataNaixement.setCustomValidity(esValid ? "" : "Data invalid");
  return esValid;
}

campTelefon.addEventListener("input", () => {
  validarTelefon();
});

campDataNaixement.addEventListener("change", () => {
  validarDataNaixement();
});

formulariAprenent.addEventListener("submit", async (esdeveniment) => {
  esdeveniment.preventDefault();

  validarTelefon();
  validarDataNaixement();
  formulariAprenent.classList.add("was-validated");

  if (!formulariAprenent.checkValidity()) {
    mostrarEstat("Revisa els camps obligatoris del formulari de registre.", "warning");
    return;
  }

  botoEnviar.disabled = true;
  botoEnviar.textContent = "Enviant...";

  try {
    const payload = {
      nom: campNom.value.trim(),
      cognoms: campCognoms.value.trim(),
      correu: campCorreu.value.trim(),
      telefon: campTelefon.value.trim(),
      parroquia: campParroquia.value,
      data_naixement: campDataNaixement.value,
      nivell_catala: campNivellCatala.value,
      objectiu_principal: campObjectiuPrincipal.value.trim(),
      pot_conversar: campPotConversar.value,
      disponibilitat: campDisponibilitat.value.trim(),
      observacions: campObservacions.value.trim()
    };

    const resposta = await fetch(`${API_BASE}/aprenents/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const resultat = await resposta.json();

    if (!resposta.ok) {
      throw new Error(resultat.message || "No s'ha pogut registrar l'aprenent.");
    }

    botoEnviar.disabled = false;
    botoEnviar.textContent = "Enviar formulari";
    formulariAprenent.reset();
    formulariAprenent.classList.remove("was-validated");
    mostrarEstat("Registre d'aprenent desat a la base de dades.", "success");
  } catch (error) {
    botoEnviar.disabled = false;
    botoEnviar.textContent = "Enviar formulari";
    mostrarEstat(error.message, "danger");
  }
});
