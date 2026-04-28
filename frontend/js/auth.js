const AuthSession = (() => {
  const API_BASE_URL = "http://localhost:3000/api";
  const SESSION_KEY = "plataforma_auth_session";

  function parseSession(rawSession) {
    if (!rawSession) {
      return null;
    }

    try {
      return JSON.parse(rawSession);
    } catch (_error) {
      return null;
    }
  }

  function loadSession() {
    return (
      parseSession(localStorage.getItem(SESSION_KEY)) ||
      parseSession(sessionStorage.getItem(SESSION_KEY))
    );
  }

  function saveSession(sessionData, rememberSession) {
    clearSession();
    const storage = rememberSession ? localStorage : sessionStorage;
    storage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    return sessionData;
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  }

  function getUser() {
    return loadSession()?.user || null;
  }

  function getToken() {
    return loadSession()?.token || null;
  }

  function getDefaultPathByRole(role) {
    return role === "admin" ? "./admin.html" : "./profile.html";
  }

  function redirectByRole(role) {
    window.location.href = getDefaultPathByRole(role);
  }

  function authFetch(path, options = {}) {
    const token = getToken();
    const headers = new Headers(options.headers || {});

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers
    });
  }

  function requireAuth({ allowedRoles = [], redirectTo = "./login.html" } = {}) {
    const session = loadSession();

    if (!session?.token || !session?.user) {
      window.location.href = redirectTo;
      return null;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(session.user.rol)) {
      redirectByRole(session.user.rol);
      return null;
    }

    return session;
  }

  return {
    API_BASE_URL,
    loadSession,
    saveSession,
    clearSession,
    getUser,
    getToken,
    getDefaultPathByRole,
    redirectByRole,
    authFetch,
    requireAuth
  };
})();
