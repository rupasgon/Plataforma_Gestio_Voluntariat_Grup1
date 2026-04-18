const CLAU_LOCAL = 'parelles_auth_local';
const CLAU_SESSIO = 'parelles_auth_sessio';
const API_BASE = 'http://localhost:3000/api';

function sessioHaCaducat(sessio) {
  return Boolean(sessio?.expiresAt) && Number(sessio.expiresAt) <= Date.now();
}

function llegirStorage(clau, storage) {
  try {
    const contingut = storage.getItem(clau);
    return contingut ? JSON.parse(contingut) : null;
  } catch (error) {
    return null;
  }
}

function obtenirSessio() {
  const sessio = llegirStorage(CLAU_LOCAL, window.localStorage) || llegirStorage(CLAU_SESSIO, window.sessionStorage);

  if (sessioHaCaducat(sessio)) {
    esborrarSessio();
    return null;
  }

  return sessio;
}

function desarSessio(sessio, recordarSessio) {
  esborrarSessio();
  const storage = recordarSessio ? window.localStorage : window.sessionStorage;
  storage.setItem(obtenirClauStorage(recordarSessio), JSON.stringify(sessio));
}

function obtenirClauStorage(recordarSessio) {
  return recordarSessio ? CLAU_LOCAL : CLAU_SESSIO;
}

function teSessioRecordada() {
  return Boolean(llegirStorage(CLAU_LOCAL, window.localStorage));
}

function esborrarSessio() {
  window.localStorage.removeItem(CLAU_LOCAL);
  window.sessionStorage.removeItem(CLAU_SESSIO);
}

function obtenirCapcaleresAutenticades() {
  const sessio = obtenirSessio();

  return sessio?.token
    ? {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessio.token}`
      }
    : { 'Content-Type': 'application/json' };
}

window.PARELLES_AUTH = {
  API_BASE,
  obtenirSessio,
  desarSessio,
  esborrarSessio,
  teSessioRecordada,
  obtenirCapcaleresAutenticades
};
