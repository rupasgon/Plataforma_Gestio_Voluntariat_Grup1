const crypto = require('crypto');

const sessions = new Map();
const SESSION_DURATION_MS = 1000 * 60 * 60 * 8;

function createSession(user, rememberSession = false) {
  const token = crypto.randomUUID();
  const expiresAt = rememberSession
    ? Date.now() + SESSION_DURATION_MS * 7
    : Date.now() + SESSION_DURATION_MS;

  sessions.set(token, {
    token,
    user,
    expiresAt
  });

  return sessions.get(token);
}

function getSession(token) {
  if (!token) {
    return null;
  }

  const session = sessions.get(token);
  if (!session) {
    return null;
  }

  if (session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }

  return session;
}

function deleteSession(token) {
  return sessions.delete(token);
}

function updateSessionUser(token, user) {
  const session = getSession(token);
  if (!session) {
    return null;
  }

  session.user = { ...user };
  sessions.set(token, session);
  return session;
}

module.exports = {
  createSession,
  getSession,
  deleteSession,
  updateSessionUser
};
