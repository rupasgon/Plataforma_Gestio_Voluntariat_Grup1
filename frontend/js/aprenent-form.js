const formulariAprenent = document.getElementById("formulari_aprenent");
const estatAprenent = document.getElementById("estat_aprenent");

formulariAprenent.addEventListener("submit", (esdeveniment) => {
  esdeveniment.preventDefault();
  estatAprenent.textContent = "Formulari d'aprenent enviat correctament (simulacio).";
  formulariAprenent.reset();
});
