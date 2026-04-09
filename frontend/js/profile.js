const sessioPerfil = AuthSession.requireAuth({ allowedRoles: ["voluntari", "aprenent"] });

if (sessioPerfil) {
  const formulariPerfil = document.getElementById("formulari_perfil");
  const estatPerfil = document.getElementById("estat_perfil");
  const estatSessio = document.getElementById("estat_sessio");
  const usuariAutenticat = document.getElementById("usuari_autenticat");
  const botoTancarSessio = document.getElementById("tancar_sessio");

  usuariAutenticat.textContent = `${sessioPerfil.user.nom} (${sessioPerfil.user.rol})`;
  estatSessio.textContent = "Sessio activa. Perfil protegit correctament.";

  function omplirPerfil(user) {
    document.getElementById("nom").value = user.nom || "";
    document.getElementById("cognoms").value = user.cognoms || "";
    document.getElementById("correu").value = user.email || "";
  }

  async function carregarPerfil() {
    try {
      const resposta = await AuthSession.authFetch("/profile/me");
      const dades = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dades.message || "No s ha pogut recuperar el perfil.");
      }

      omplirPerfil(dades.user);
    } catch (error) {
      estatPerfil.textContent = error.message;
    }
  }

  botoTancarSessio.addEventListener("click", () => {
    AuthSession.clearSession();
    window.location.href = "./login.html";
  });

  formulariPerfil.addEventListener("submit", async (esdeveniment) => {
    esdeveniment.preventDefault();

    const payload = {
      nom: document.getElementById("nom").value,
      cognoms: document.getElementById("cognoms").value,
      correu: document.getElementById("correu").value,
      telefon: document.getElementById("telefon").value,
      parroquia: document.getElementById("parroquia").value,
      data_naixement: document.getElementById("data_naixement").value,
      disponibilitat: document.getElementById("disponibilitat").value,
      observacions: document.getElementById("observacions").value
    };

    try {
      const resposta = await AuthSession.authFetch("/profile/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const dades = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dades.message || "No s ha pogut actualitzar el perfil.");
      }

      estatPerfil.textContent = dades.message;
    } catch (error) {
      estatPerfil.textContent = error.message;
    }
  });

  carregarPerfil();
}
