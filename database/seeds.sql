USE parelles_linguistiques;

INSERT INTO users (nom, cognoms, email, password, rol)
VALUES
  ('Admin', 'Principal', 'admin@example.com', 'hashed_password', 'admin'),
  ('Joan', 'Voluntari', 'voluntari@example.com', 'hashed_password', 'voluntari'),
  ('Maria', 'Aprenent', 'aprenent@example.com', 'hashed_password', 'aprenent');

INSERT INTO voluntaris (user_id, telefon, parroquia, data_naixement, disponibilitat, observacions)
VALUES
  (2, '600111222', 'Sant Pere', '1990-05-10', 'Dilluns i dimecres', 'Cap');

INSERT INTO aprenents (user_id, telefon, parroquia, data_naixement, disponibilitat, observacions)
VALUES
  (3, '600333444', 'Santa Maria', '1995-09-21', 'Dimarts i dijous', 'Cap');

INSERT INTO parelles (voluntari_id, aprenent_id, data_inici, estat, observacions)
VALUES
  (1, 1, '2024-01-15', 'activa', 'Parella inicial');
