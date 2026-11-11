INSERT INTO features (key, name, description) VALUES
    ('patients', 'Pacients', 'Fitxa de pacients i cerca'),
    ('agenda', 'Agenda', 'Agenda multigabinet en temps real'),
    ('odontogram', 'Odontograma', 'Odontograma interactiu FDI'),
    ('clinical_history', 'Historial clínic', 'Historial mèdic i alertes'),
    ('whatsapp', 'WhatsApp', 'Recordatoris i confirmacions per WhatsApp'),
    ('waiting_list', 'Llista d''espera', 'Llista d''espera dinàmica'),
    ('billing_pdf', 'Facturació', 'Factures i pressupostos PDF amb QR'),
    ('reports', 'Informes', 'Quadre de comandament i informes')
ON CONFLICT (key) DO NOTHING;

INSERT INTO plans (key, name, description, price_monthly_cents, currency, sort_order) VALUES
    ('starter', 'Starter', 'Per a clíniques que comencen', 9900, 'EUR', 10),
    ('clinic', 'Clinic', 'Per a clíniques en creixement', 19900, 'EUR', 20),
    ('enterprise', 'Enterprise', 'Per a grups i clíniques grans', 34900, 'EUR', 30)
ON CONFLICT (key) DO NOTHING;

INSERT INTO plan_features (plan_key, feature_key) VALUES
    ('starter', 'patients'),
    ('starter', 'agenda'),
    ('clinic', 'patients'),
    ('clinic', 'agenda'),
    ('clinic', 'odontogram'),
    ('clinic', 'clinical_history'),
    ('clinic', 'billing_pdf'),
    ('enterprise', 'patients'),
    ('enterprise', 'agenda'),
    ('enterprise', 'odontogram'),
    ('enterprise', 'clinical_history'),
    ('enterprise', 'whatsapp'),
    ('enterprise', 'waiting_list'),
    ('enterprise', 'billing_pdf'),
    ('enterprise', 'reports')
ON CONFLICT DO NOTHING;
