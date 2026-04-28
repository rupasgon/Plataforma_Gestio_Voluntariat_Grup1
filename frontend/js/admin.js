const sessioAdmin = AuthSession.requireAuth({ allowedRoles: ["admin"] });

if (sessioAdmin) {
  const usuariAutenticat = document.getElementById("usuari_autenticat");
  const estatSessio = document.getElementById("estat_sessio");
  const botoTancarSessio = document.getElementById("tancar_sessio");

  usuariAutenticat.textContent = `${sessioAdmin.user.nom} (${sessioAdmin.user.rol})`;
  estatSessio.textContent = "Sessio activa. Panell protegit correctament.";

  botoTancarSessio.addEventListener("click", () => {
    AuthSession.clearSession();
    window.location.href = "./login.html";
  });

  // ===== ELEMENTS DEL PANELL =====
  const statTotalUsuaris = document.getElementById("stat_total_usuaris");
  const statTotalParelles = document.getElementById("stat_total_parelles");
  const statUltimaAccio = document.getElementById("stat_ultima_accio");

  const TOTAL_USUARIS = 4;
  const TOTAL_PARELLES = 2;

  function horaActual() {
    const ara = new Date();
    return ara.toLocaleTimeString("ca-ES", { hour: "2-digit", minute: "2-digit" });
  }

  function registrarAccio(titol) {
    statUltimaAccio.textContent = `${titol} (${horaActual()})`;
  }

  document.getElementById("carregar_usuaris").addEventListener("click", () => {
    statTotalUsuaris.textContent = String(TOTAL_USUARIS);
    registrarAccio("Usuaris carregats");
  });

  document.getElementById("carregar_parelles").addEventListener("click", () => {
    statTotalParelles.textContent = String(TOTAL_PARELLES);
    registrarAccio("Parelles carregades");
  });

  document.getElementById("netejar_sortida").addEventListener("click", () => {
    statTotalUsuaris.textContent = "0";
    statTotalParelles.textContent = "0";
    statUltimaAccio.textContent = "Cap";
  });

  document.getElementById("exportar_informe").addEventListener("click", () => {
    const informe = {
      data: new Date().toISOString(),
      resum: {
        usuarisTotals: Number(statTotalUsuaris.textContent || "0"),
        parellesActives: Number(statTotalParelles.textContent || "0")
      }
    };

    const blob = new Blob([JSON.stringify(informe, null, 2)], { type: "application/json" });
    const enllac = document.createElement("a");
    enllac.href = URL.createObjectURL(blob);
    enllac.download = "resum-admin.json";
    enllac.click();
    URL.revokeObjectURL(enllac.href);

    registrarAccio("Resum descarregat");
  });
}
