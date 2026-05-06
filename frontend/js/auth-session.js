/**
 * @file auth.js
 * @author Grup1
 * @description Gestió de la sessió d'usuari, emmagatzematge en localStorage/sessionStorage i generació de capçaleres d'autenticació per a l'API.
 */

/**
 * Clau per emmagatzemar la sessió persistent (localStorage)
 * @type {string}
 */
const CLAU_LOCAL = 'parelles_auth_local';

/**
 * Clau per emmagatzemar la sessió temporal (sessionStorage)
 * @type {string}
 */
const CLAU_SESSIO = 'parelles_auth_sessio';

/**
 * URL base de l'API backend
 * @type {string}
 */
const API_BASE = 'http://localhost:3000/api';

/**
 * Comprova si una sessió ha caducat segons la data d'expiració.
 * @param {Object} sessio - Objecte de sessió.
 * @param {number} [sessio.expiresAt] - Timestamp d'expiració.
 * @returns {boolean} True si ha caducat, false si no.
 */
function sessioHaCaducat(sessio) {
  return Boolean(sessio?.expiresAt) && Number(sessio.expiresAt) <= Date.now();
}

/**
 * Llegeix una clau de l'storage i la converteix a objecte.
 * @param {string} clau - Clau d'emmagatzematge.
 * @param {Storage} storage - localStorage o sessionStorage.
 * @returns {Object|null} Objecte o null si hi ha error.
 */
function llegirStorage(clau, storage) {
  try {
    const contingut = storage.getItem(clau);
    return contingut ? JSON.parse(contingut) : null;
  } catch (error) {
    return null;
  }
}

/**
 * Obté la sessió actual des de localStorage o sessionStorage.
 * Si la sessió ha caducat, s'elimina.
 * @returns {Object|null} Sessió activa o null.
 */
function obtenirSessio() {
  const sessio = llegirStorage(CLAU_LOCAL, window.localStorage) || llegirStorage(CLAU_SESSIO, window.sessionStorage);

  if (sessioHaCaducat(sessio)) {
    esborrarSessio();
    return null;
  }

  return sessio;
}

/**
 * Desa la sessió a l'storage corresponent segons la preferència.
 * @param {Object} sessio - Objecte de sessió.
 * @param {boolean} recordarSessio - Indica si es vol persistir la sessió.
 */
function desarSessio(sessio, recordarSessio) {
  esborrarSessio();
  const storage = recordarSessio ? window.localStorage : window.sessionStorage;
  storage.setItem(obtenirClauStorage(recordarSessio), JSON.stringify(sessio));
}

/**
 * Retorna la clau d'storage segons si es recorda la sessió.
 * @param {boolean} recordarSessio
 * @returns {string} Clau d'emmagatzematge.
 */
function obtenirClauStorage(recordarSessio) {
  return recordarSessio ? CLAU_LOCAL : CLAU_SESSIO;
}

/**
 * Comprova si existeix una sessió persistent a localStorage.
 * @returns {boolean} True si existeix, false si no.
 */
function teSessioRecordada() {
  return Boolean(llegirStorage(CLAU_LOCAL, window.localStorage));
}

/**
 * Elimina qualsevol sessió guardada en localStorage i sessionStorage.
 */
function esborrarSessio() {
  window.localStorage.removeItem(CLAU_LOCAL);
  window.sessionStorage.removeItem(CLAU_SESSIO);
}

/**
 * Genera les capçaleres HTTP amb autenticació si hi ha sessió activa.
 * @returns {Object} Objecte amb headers per a peticions fetch.
 */
function obtenirCapcaleresAutenticades() {
  const sessio = obtenirSessio();

  return sessio?.token
    ? {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessio.token}`
    }
    : { 'Content-Type': 'application/json' };
}

/**
 * Objecte global amb utilitats d'autenticació
 * @type {Object}
 */
window.PARELLES_AUTH = {
  API_BASE,
  obtenirSessio,
  desarSessio,
  esborrarSessio,
  teSessioRecordada,
  obtenirCapcaleresAutenticades
};
