USE parelles_linguistiques;

CREATE INDEX idx_parelles_voluntari_estat ON parelles (voluntari_id, estat);
CREATE INDEX idx_parelles_aprenent_estat ON parelles (aprenent_id, estat);
CREATE INDEX idx_parelles_estat_data ON parelles (estat, data_inici);
