const formulariPerfil = document.getElementById('formulari_perfil');
const estatPerfil = document.getElementById('estat_perfil');
const botoGuardar = document.getElementById('boto_guardar');
const badgeRol = document.getElementById('rol_usuari');

const campsPerfil = {
  nom: document.getElementById('nom'),
  cognoms: document.getElementById('cognoms'),
  correu: document.getElementById('correu'),
  telefon: document.getElementById('telefon'),
  parroquia: document.getElementById('parroquia'),
  data_naixement: document.getElementById('data_naixement'),
  disponibilitat: document.getElementById('disponibilitat'),
  observacions: document.getElementById('observacions')
};

function mostrarEstat(missatge, tipus) {
  estatPerfil.className = `alert alert-${tipus} mt-3`;
  estatPerfil.textContent = missatge;
}

async function tancarSessio() {
  try {
    await fetch(`${window.PARELLES_AUTH.API_BASE}/auth/logout`, {
      method: 'POST',
      headers: window.PARELLES_AUTH.obtenirCapcaleresAutenticades()
    });
  } catch (error) {
    // No cal bloquejar el tancament local si l API no respon.
  }

  window.PARELLES_AUTH.esborrarSessio();
  window.location.href = './login.html';
}

function emplenarFormulari(perfil) {
  campsPerfil.nom.value = perfil.nom || '';
  campsPerfil.cognoms.value = perfil.cognoms || '';
  campsPerfil.correu.value = perfil.email || '';
  campsPerfil.telefon.value = perfil.telefon || '';
  campsPerfil.parroquia.value = perfil.parroquia || '';
  campsPerfil.data_naixement.value = perfil.data_naixement ? String(perfil.data_naixement).slice(0, 10) : '';
  campsPerfil.disponibilitat.value = perfil.disponibilitat || '';
  campsPerfil.observacions.value = perfil.observacions || '';
  badgeRol.textContent = `Rol: ${perfil.rol}`;
}

async function carregarPerfil() {
  const sessio = window.PARELLES_AUTH.obtenirSessio();
  if (!sessio?.token) {
    window.location.href = './login.html';
    return;
  }

  try {
    const respostaSessio = await fetch(`${window.PARELLES_AUTH.API_BASE}/auth/me`, {
      headers: window.PARELLES_AUTH.obtenirCapcaleresAutenticades()
    });

    if (!respostaSessio.ok) {
      await tancarSessio();
      return;
    }

    const dadesSessio = await respostaSessio.json();
    if (!['voluntari', 'aprenent'].includes(dadesSessio.user.rol)) {
      window.location.href = dadesSessio.user.rol === 'admin' ? './admin.html' : './login.html';
      return;
    }

    const respostaPerfil = await fetch(`${window.PARELLES_AUTH.API_BASE}/profile/me`, {
      headers: window.PARELLES_AUTH.obtenirCapcaleresAutenticades()
    });

    const dadesPerfil = await respostaPerfil.json();
    if (!respostaPerfil.ok) {
      mostrarEstat(dadesPerfil.message || 'No s ha pogut carregar el perfil.', 'danger');
      return;
    }

    emplenarFormulari(dadesPerfil.data);
  } catch (error) {
    mostrarEstat('No s ha pogut carregar el perfil. Revisa la connexio amb l API.', 'danger');
  }
}

formulariPerfil.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!formulariPerfil.checkValidity()) {
    mostrarEstat('Revisa els camps obligatoris del formulari.', 'warning');
    return;
  }

  botoGuardar.disabled = true;
  botoGuardar.textContent = 'Guardant...';

  try {
    const resposta = await fetch(`${window.PARELLES_AUTH.API_BASE}/profile/me`, {
      method: 'PUT',
      headers: window.PARELLES_AUTH.obtenirCapcaleresAutenticades(),
      body: JSON.stringify({
        nom: campsPerfil.nom.value.trim(),
        cognoms: campsPerfil.cognoms.value.trim(),
        email: campsPerfil.correu.value.trim(),
        telefon: campsPerfil.telefon.value.trim(),
        parroquia: campsPerfil.parroquia.value.trim(),
        data_naixement: campsPerfil.data_naixement.value,
        disponibilitat: campsPerfil.disponibilitat.value.trim(),
        observacions: campsPerfil.observacions.value.trim()
      })
    });

    const dades = await resposta.json();
    if (!resposta.ok) {
      mostrarEstat(dades.message || 'No s ha pogut actualitzar el perfil.', 'danger');
      return;
    }

    const sessio = window.PARELLES_AUTH.obtenirSessio();
    if (sessio) {
      window.PARELLES_AUTH.desarSessio(
        {
          ...sessio,
          user: {
            ...sessio.user,
            nom: dades.data.nom,
            cognoms: dades.data.cognoms,
            email: dades.data.email,
            rol: dades.data.rol
          }
        },
        window.PARELLES_AUTH.teSessioRecordada()
      );
    }

    emplenarFormulari(dades.data);
    mostrarEstat('Perfil actualitzat correctament.', 'success');
  } catch (error) {
    mostrarEstat('No s ha pogut desar el perfil. Revisa la connexio amb l API.', 'danger');
  } finally {
    botoGuardar.disabled = false;
    botoGuardar.textContent = 'Guardar canvis';
  }
});

carregarPerfil();
