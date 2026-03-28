const formulariVoluntari = document.getElementById("formulari_voluntari");
const estatVoluntari = document.getElementById("estat_voluntari");

formulariVoluntari.addEventListener("submit", (esdeveniment) => {
  esdeveniment.preventDefault();
  estatVoluntari.textContent = "Formulari de voluntari enviat correctament (simulacio).";
  formulariVoluntari.reset();
});
