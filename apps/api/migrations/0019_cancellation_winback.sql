-- Migration 0019: Cancellation retention, 90-day custody, 30-day reactivation window, winback drip templates and pixel tracking
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS purge_scheduled_at TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS reactivation_deadline_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS cancellation_email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    step_day INT NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    preview_text VARCHAR(200) NOT NULL DEFAULT '',
    body_html TEXT NOT NULL,
    body_text TEXT NOT NULL,
    has_free_month_offer BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER cancellation_email_templates_updated_at BEFORE UPDATE ON cancellation_email_templates FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS cancellation_email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    recipient_email VARCHAR(200) NOT NULL,
    recipient_name VARCHAR(150) NOT NULL,
    clinic_name VARCHAR(150) NOT NULL,
    step_day INT NOT NULL,
    subject VARCHAR(200) NOT NULL,
    tracking_token VARCHAR(64) NOT NULL UNIQUE,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    opened_at TIMESTAMPTZ,
    open_count INT NOT NULL DEFAULT 0,
    last_opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    click_count INT NOT NULL DEFAULT 0,
    reactivated_at TIMESTAMPTZ,
    user_agent TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cancellation_email_logs_tenant ON cancellation_email_logs(tenant_id, step_day);
CREATE INDEX IF NOT EXISTS idx_cancellation_email_logs_token ON cancellation_email_logs(tracking_token);

-- Insert the 6 pre-configured, high-converting dental winback templates
INSERT INTO cancellation_email_templates (step_day, name, subject, preview_text, has_free_month_offer, body_html, body_text)
VALUES
(
    5,
    'Día 5: Custodia y seguridad de tus datos',
    'Tus expedientes clínicos y agenda siguen intactos en Dentistes',
    'Tus historiales odontológicos y citas están custodiados durante 90 días.',
    false,
    '<div style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: #0f766e; padding: 28px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Dentistes</h1>
        <p style="color: #ccfbf1; margin: 6px 0 0 0; font-size: 14px;">Software de Gestión Clínica Odontológica</p>
      </div>
      <div style="padding: 32px 24px; color: #1e293b; line-height: 1.6;">
        <h2 style="font-size: 20px; font-weight: 600; color: #0f172a; margin-top: 0;">Hola {{owner_name}},</h2>
        <p>Hace 5 días que se tramitó la baja de <strong>{{clinic_name}}</strong>. Queremos transmitirte total tranquilidad: todos tus expedientes clínicos, odontogramas, tarifario y citas pasadas están <strong>guardados y protegidos con cifrado de grado médico durante 90 días</strong>.</p>
        <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; border-radius: 6px; margin: 24px 0;">
          <p style="margin: 0; font-weight: 600; color: #065f46;">🔒 Ventana de reactivación directa activa</p>
          <p style="margin: 6px 0 0 0; font-size: 14px; color: #047857;">Dispones de <strong>{{days_remaining}} días</strong> para reactivar tu cuenta con un solo clic, sin perder ninguna configuración ni historial.</p>
        </div>
        <p>Sabemos el esfuerzo que supone gestionar una clínica dental. Si cambiaste de opinión o si la pausa fue temporal, puedes recuperar tu ritmo de trabajo habitual al instante.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="{{reactivate_url}}" style="background: #0f766e; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">Reactivar mi clínica en 1 clic</a>
        </div>
        <p style="font-size: 13px; color: #64748b; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px;">Si necesitas asistencia de nuestro equipo o resolver cualquier duda técnica, responde directamente a este correo.</p>
      </div>
      <img src="{{tracking_pixel_url}}" width="1" height="1" style="display:none;" alt="" />
    </div>',
    'Hola {{owner_name}},\n\nHace 5 días que se tramitó la baja de {{clinic_name}}. Todos tus expedientes clínicos, odontogramas y citas están guardados y protegidos durante 90 días.\n\nDispones de {{days_remaining}} días para reactivar tu clínica en un solo clic:\n{{reactivate_url}}\n\nUn saludo,\nEquipo Dentistes'
),
(
    10,
    'Día 10: Continuidad operativa y tiempo ahorrado',
    '¿Cómo van las citas en {{clinic_name}}? Te ayudamos a volver',
    'La gestión manual de agenda y cobros consume tiempo valioso. Retómalo fácilmente.',
    false,
    '<div style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: #0f766e; padding: 28px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Dentistes</h1>
        <p style="color: #ccfbf1; margin: 6px 0 0 0; font-size: 14px;">Continuidad y Eficiencia Odontológica</p>
      </div>
      <div style="padding: 32px 24px; color: #1e293b; line-height: 1.6;">
        <h2 style="font-size: 20px; font-weight: 600; color: #0f172a; margin-top: 0;">Estimado/a Dr./Dra. {{owner_name}},</h2>
        <p>Han pasado 10 días desde la pausa de <strong>{{clinic_name}}</strong>. Organizar la agenda, controlar la lista de espera dinámica y emitir facturas conformes a Veri*Factu de forma manual es una sobrecarga innecesaria para tu equipo.</p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; font-size: 15px; color: #334155;">Lo que sigue esperándote tal como lo dejaste:</h3>
          <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #475569;">
            <li>Tus gabinetes y disponibilidad semanal configurados.</li>
            <li>Catálogo de tratamientos y tabla maestra de especialidades.</li>
            <li>Historiales médicos y presupuestos de pacientes.</li>
          </ul>
        </div>
        <p>Te quedan <strong>{{days_remaining}} días</strong> para reactivar tu cuenta conservando todos los accesos inmediatos.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="{{reactivate_url}}" style="background: #0f766e; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">Reactivar y retomar el control</a>
        </div>
      </div>
      <img src="{{tracking_pixel_url}}" width="1" height="1" style="display:none;" alt="" />
    </div>',
    'Estimado/a Dr./Dra. {{owner_name}},\n\nHan pasado 10 días desde la pausa de {{clinic_name}}. Todo tu catálogo de tratamientos, especialidades y pacientes sigue intacto.\n\nTe quedan {{days_remaining}} días para reactivar directamente:\n{{reactivate_url}}\n\nEquipo Dentistes'
),
(
    15,
    'Día 15: Oferta especial 1 Mes Gratis',
    '🎁 1 mes sin costo para {{clinic_name}}: Queremos que vuelvas',
    'Activa hoy 30 días gratuitos adicionales sin compromiso. Te lo ponemos muy fácil.',
    true,
    '<div style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #0f766e 0%, #115e59 100%); padding: 32px 24px; text-align: center;">
        <span style="background: #fef08a; color: #854d0e; font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em;">Oferta Exclusiva de Reactivación</span>
        <h1 style="color: #ffffff; margin: 12px 0 0 0; font-size: 26px; font-weight: 800;">Te regalamos 1 mes sin costo</h1>
        <p style="color: #ccfbf1; margin: 6px 0 0 0; font-size: 15px;">Válido para la reactivación de {{clinic_name}}</p>
      </div>
      <div style="padding: 32px 24px; color: #1e293b; line-height: 1.6;">
        <h2 style="font-size: 20px; font-weight: 600; color: #0f172a; margin-top: 0;">Hola {{owner_name}},</h2>
        <p>Sabemos que el día a día en clínica es exigente y queremos apoyarte. Por eso, hemos preparado para ti <strong>un mes completo de Dentistes a costo cero (100% bonificado)</strong>.</p>
        <div style="background: #fffbeb; border: 2px dashed #f59e0b; padding: 20px; border-radius: 10px; margin: 24px 0; text-align: center;">
          <p style="margin: 0; font-size: 14px; color: #92400e; font-weight: 600; text-transform: uppercase;">Cupón exclusivo para tu clínica:</p>
          <p style="margin: 8px 0; font-size: 22px; font-weight: 800; color: #b45309; letter-spacing: 2px;">VUELVE-MES-GRATIS</p>
          <p style="margin: 0; font-size: 13px; color: #78350f;">Sin compromiso de permanencia. Reactiva tu clínica y disfruta de 30 días gratuitos.</p>
        </div>
        <p>Aprovecha las últimas mejoras de la plataforma: carga y compresión automática de imágenes radiográficas, unificación de especialidades y presupuestos multipropuesta.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="{{reactivate_url}}" style="background: #f59e0b; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(245, 158, 11, 0.3);">Reclamar 1 mes gratis y reactivar</a>
        </div>
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">Quedan {{days_remaining}} días para beneficiarte de esta reactivación preferente.</p>
      </div>
      <img src="{{tracking_pixel_url}}" width="1" height="1" style="display:none;" alt="" />
    </div>',
    'Hola {{owner_name}},\n\nQueremos que vuelvas a contar con Dentistes en {{clinic_name}}. Te regalamos 1 mes adicional sin costo alguno.\n\nReclama tus 30 días gratis y reactiva tu clínica aquí:\n{{reactivate_url}}\n\nEquipo Dentistes'
),
(
    20,
    'Día 20: Recordatorio cupón de 1 Mes Gratis',
    'Tu mes de cortesía para {{clinic_name}} sigue disponible',
    'Quedan 10 días de reactivación garantizada. Tu cupón de 30 días gratis te espera.',
    true,
    '<div style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: #0f766e; padding: 28px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Dentistes</h1>
        <p style="color: #ccfbf1; margin: 6px 0 0 0; font-size: 14px;">Tu cupón de 1 mes gratis continúa activo</p>
      </div>
      <div style="padding: 32px 24px; color: #1e293b; line-height: 1.6;">
        <h2 style="font-size: 20px; font-weight: 600; color: #0f172a; margin-top: 0;">Estimado/a {{owner_name}},</h2>
        <p>Solo un breve recordatorio: tu oferta de <strong>1 mes gratuito</strong> para la reactivación de <strong>{{clinic_name}}</strong> continúa disponible en tu panel.</p>
        <div style="background: #f1f5f9; padding: 18px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #334155;">⏳ <strong>Tiempo restante:</strong> Quedan exactamente <strong>{{days_remaining}} días</strong> para reactivar con restauración inmediata antes del archivado profundo.</p>
        </div>
        <p>¿Tienes dudas sobre cómo exportar datos o sobre alguna funcionalidad específica? Responde a este correo y nuestro equipo técnico te atenderá de forma prioritaria.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="{{reactivate_url}}" style="background: #0f766e; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">Reactivar con 1 mes gratis</a>
        </div>
      </div>
      <img src="{{tracking_pixel_url}}" width="1" height="1" style="display:none;" alt="" />
    </div>',
    'Estimado/a {{owner_name}},\n\nTu oferta de 1 mes gratuito para {{clinic_name}} sigue activa. Quedan {{days_remaining}} días para reactivar directamente con tus datos intactos:\n{{reactivate_url}}\n\nEquipo Dentistes'
),
(
    25,
    'Día 25: Últimos 5 días de reactivación directa',
    'Últimos 5 días: Mantén tu clínica {{clinic_name}} activa con 1 mes gratis',
    'Pronto se cerrará la ventana preferente de reactivación de 30 días.',
    true,
    '<div style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: #b91c1c; padding: 28px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Dentistes</h1>
        <p style="color: #fecaca; margin: 6px 0 0 0; font-size: 14px;">Aviso de finalización de reactivación preferente</p>
      </div>
      <div style="padding: 32px 24px; color: #1e293b; line-height: 1.6;">
        <h2 style="font-size: 20px; font-weight: 600; color: #0f172a; margin-top: 0;">Hola {{owner_name}},</h2>
        <p>Te escribimos porque solo quedan <strong>5 días</strong> para que finalice el plazo preferente de 30 días de <strong>{{clinic_name}}</strong>.</p>
        <p>Una vez transcurridos estos 5 días, la cuenta se congelará definitivamente en modo custodia hasta el cumplimiento de los 90 días legales para la posterior purga de datos.</p>
        <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 6px; margin: 24px 0;">
          <p style="margin: 0; font-weight: 700; color: #991b1b;">Última oportunidad con 30 días gratis</p>
          <p style="margin: 6px 0 0 0; font-size: 14px; color: #b91c1c;">Reactivando ahora conservas tu histórico íntegro y disfrutas del mes gratuito bonificado.</p>
        </div>
        <div style="text-align: center; margin: 32px 0;">
          <a href="{{reactivate_url}}" style="background: #dc2626; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 700; font-size: 16px; display: inline-block;">Reactivar antes de que expire</a>
        </div>
      </div>
      <img src="{{tracking_pixel_url}}" width="1" height="1" style="display:none;" alt="" />
    </div>',
    'Hola {{owner_name}},\n\nSolo quedan 5 días para que finalice tu plazo preferente de reactivación para {{clinic_name}}.\n\nReactiva ahora con tu mes bonificado:\n{{reactivate_url}}\n\nEquipo Dentistes'
),
(
    30,
    'Día 30: Último aviso de reactivación',
    'Último día: Se cierra la reactivación preferente de {{clinic_name}}',
    'Hoy finaliza el plazo de 30 días. Tu cuenta pasará a custodia pasiva hasta la purga final.',
    true,
    '<div style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: #334155; padding: 28px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Dentistes</h1>
        <p style="color: #cbd5e1; margin: 6px 0 0 0; font-size: 14px;">Cierre del período de reactivación preferente</p>
      </div>
      <div style="padding: 32px 24px; color: #1e293b; line-height: 1.6;">
        <h2 style="font-size: 20px; font-weight: 600; color: #0f172a; margin-top: 0;">Estimado/a {{owner_name}},</h2>
        <p>Hoy se cumplen los <strong>30 días</strong> desde la cancelación de <strong>{{clinic_name}}</strong>. A partir de mañana, la opción de reactivación directa en 1 clic dejará de estar disponible de forma automática.</p>
        <p>Tus datos permanecerán en custodia de seguridad hasta completar los <strong>90 días</strong> reglamentarios, fecha en la que se ejecutará el borrado definitivo e irreversible de la base de datos de tu clínica.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="{{reactivate_url}}" style="background: #0f766e; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">Reactivar cuenta hoy mismo</a>
        </div>
        <p style="font-size: 13px; color: #64748b; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px;">Ha sido un honor colaborar con tu clínica dental. Si en el futuro deseas volver a implementar Dentistes, siempre serás bienvenido.</p>
      </div>
      <img src="{{tracking_pixel_url}}" width="1" height="1" style="display:none;" alt="" />
    </div>',
    'Estimado/a {{owner_name}},\n\nHoy se cumplen los 30 días desde la cancelación de {{clinic_name}}. Es tu última oportunidad para reactivar directamente con 1 mes bonificado antes de que entre en custodia pasiva hacia el borrado de 90 días:\n{{reactivate_url}}\n\nEquipo Dentistes'
)
ON CONFLICT (step_day) DO NOTHING;
