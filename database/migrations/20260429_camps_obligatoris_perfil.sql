USE parelles_linguistiques;

-- Executa abans aquests ALTER si la taula aprenents es va crear amb una versio antiga de l esquema:
-- ALTER TABLE aprenents ADD COLUMN nivell_catala VARCHAR(30) AFTER data_naixement;
-- ALTER TABLE aprenents ADD COLUMN objectiu_principal VARCHAR(255) AFTER nivell_catala;
-- ALTER TABLE aprenents ADD COLUMN pot_conversar ENUM('si','no') AFTER objectiu_principal;

UPDATE voluntaris
SET
  telefon = COALESCE(NULLIF(telefon, ''), '000000000'),
  parroquia = COALESCE(NULLIF(parroquia, ''), 'pendent'),
  data_naixement = COALESCE(data_naixement, '1900-01-01'),
  disponibilitat = COALESCE(NULLIF(disponibilitat, ''), 'pendent');

UPDATE aprenents
SET
  telefon = COALESCE(NULLIF(telefon, ''), '000000000'),
  parroquia = COALESCE(NULLIF(parroquia, ''), 'pendent'),
  data_naixement = COALESCE(data_naixement, '1900-01-01'),
  nivell_catala = COALESCE(NULLIF(nivell_catala, ''), 'inicial'),
  objectiu_principal = COALESCE(NULLIF(objectiu_principal, ''), 'pendent'),
  pot_conversar = COALESCE(pot_conversar, 'si'),
  disponibilitat = COALESCE(NULLIF(disponibilitat, ''), 'pendent');

ALTER TABLE voluntaris
  MODIFY telefon VARCHAR(30) NOT NULL,
  MODIFY parroquia VARCHAR(150) NOT NULL,
  MODIFY data_naixement DATE NOT NULL,
  MODIFY disponibilitat VARCHAR(255) NOT NULL;

ALTER TABLE aprenents
  MODIFY telefon VARCHAR(30) NOT NULL,
  MODIFY parroquia VARCHAR(150) NOT NULL,
  MODIFY data_naixement DATE NOT NULL,
  MODIFY nivell_catala VARCHAR(30) NOT NULL,
  MODIFY objectiu_principal VARCHAR(255) NOT NULL,
  MODIFY pot_conversar ENUM('si','no') NOT NULL,
  MODIFY disponibilitat VARCHAR(255) NOT NULL;
