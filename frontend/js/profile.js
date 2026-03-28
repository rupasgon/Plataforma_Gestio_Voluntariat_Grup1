const formulariPerfil = document.getElementById("formulari_perfil");
const estatPerfil = document.getElementById("estat_perfil");

formulariPerfil.addEventListener("submit", (esdeveniment) => {
  esdeveniment.preventDefault();
  estatPerfil.textContent = "Perfil desat correctament (simulacio).";
});
