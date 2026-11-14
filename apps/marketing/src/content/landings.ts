import type { Lang } from "./languages";

export type Localized<T> = Record<Lang, T>;

export interface LandingBenefit {
  title: string;
  description: string;
}

export interface LandingFaqItem {
  q: string;
  a: string;
}

export interface CampaignLandingData {
  id: "tarifa-plana" | "gestion-integral" | "verifactu-ticketbai" | "migracion";
  slug: Localized<string>;
  keyword: Localized<string>; // Paraula clau líder per a l'enllaç del footer
  metaTitle: Localized<string>;
  metaDescription: Localized<string>;
  badge: Localized<string>;
  h1: Localized<string>;
  h1Highlight: Localized<string>;
  subtitle: Localized<string>;
  painPointTitle: Localized<string>;
  painPointBody: Localized<string>;
  benefits: Localized<LandingBenefit[]>;
  comparisonHead: Localized<string[]>;
  comparisonRows: Localized<string[][]>;
  ctaText: Localized<string>;
  faq: Localized<LandingFaqItem[]>;
}

export const LANDINGS: CampaignLandingData[] = [
  {
    id: "tarifa-plana",
    slug: {
      ca: "software-dental-tarifa-plana",
      es: "software-dental-tarifa-plana",
      en: "flat-rate-dental-software",
    },
    keyword: {
      ca: "Software dental tarifa plana",
      es: "Software dental tarifa plana",
      en: "Flat-rate dental software",
    },
    metaTitle: {
      ca: "Software dental tarifa plana: 18,50 $ USD/mes amb usuaris il·limitats | Dentistes",
      es: "Software dental tarifa plana: 18,50 $ USD/mes con usuarios ilimitados | Dentistes",
      en: "Flat-rate dental software: $18.50 USD/mo with unlimited users | Dentistes",
    },
    metaDescription: {
      ca: "Oblida't de pagar quotes per cada doctor o gabinet. Software dental complet en un sol preu pla de 18,50 $ USD/mes. Prova 30 dies gratis amb Stripe.",
      es: "Olvídate de pagar cuotas por cada doctor o gabinete. Software dental completo en un solo precio plano de 18,50 $ USD/mes. Prueba 30 días gratis con Stripe.",
      en: "Stop paying per-dentist or per-operatory license fees. Complete dental practice management for a $18.50 USD/mo flat rate. Try 30 days free.",
    },
    badge: {
      ca: "Preu transparent · Sense sorpreses",
      es: "Precio transparente · Sin sorpresas",
      en: "Transparent pricing · Zero hidden fees",
    },
    h1: {
      ca: "El programari dental més fàcil d'utilitzar.",
      es: "El software dental más fácil de utilizar.",
      en: "The easiest dental software to use.",
    },
    h1Highlight: {
      ca: "Una sola tarifa plana, zero sorpreses.",
      es: "Una sola tarifa plana, cero sorpresas.",
      en: "One flat fee, zero surprises.",
    },
    subtitle: {
      ca: "Oblida't de pagar per doctor col·laborador, per gabinet o per manteniments. Tot l'equip inclòs per 18,50 $ USD/mes amb 30 dies de prova.",
      es: "Olvídate de pagar por doctor colaborador, por gabinete o por mantenimientos. Todo el equipo incluido por 18,50 $ USD/mes con 30 días de prueba.",
      en: "No fees per collaborating doctor, per operatory, or for upgrades. Your entire team included for $18.50 USD/month with a 30-day trial.",
    },
    painPointTitle: {
      ca: "Per què continues pagant una quota per cada dentista que trepitja la clínica?",
      es: "¿Por qué sigues pagando una cuota por cada dentista que pisa tu clínica?",
      en: "Why keep paying extra licenses for every dentist joining your clinic?",
    },
    painPointBody: {
      ca: "Si col·laboren amb tu un ortodoncista, un cirurgià o un higienista a temps parcial, els programaris tradicionals com Gesden o Dentalink disparen la factura mensual fins a 150 € - 300 €/mes, a més d'alts costos d'alta de fins a 1.200 €. A Dentistes pagues només 18,50 $ USD/mes per clínica: afegeix tants usuaris com vulguis sense gastar ni un cèntim més.",
      es: "Si colaboran contigo un ortodoncista, un cirujano o un higienista a tiempo parcial, los softwares tradicionales como Gesden o Dentalink disparan la factura mensual hasta 150 € - 300 €/mes, además de costes de alta de hasta 1.200 €. En Dentistes pagas solo 18,50 $ USD/mes por clínica: añade tantos usuarios como necesites sin pagar un céntimo más.",
      en: "When part-time orthodontists, surgeons, or hygienists join your clinic, traditional software like Gesden or Dentalink inflates monthly bills to $150 - $300/month, plus onboarding fees up to $1,200. With Dentistes you pay just $18.50 USD/month flat: grow your staff with zero toll fees.",
    },
    benefits: {
      ca: [
        { title: "Tarifa plana real", description: "18,50 $ USD/mes per clínica amb usuaris, facultatius i gabinets il·limitats." },
        { title: "Corba d'aprenentatge zero", description: "Dissenyat perquè recepció i equip mèdic el dominin des del primer minut sense manuals feixucs." },
        { title: "Sense permanència ni quotes d'alta", description: "0 $ de despeses de configuració. Comença amb 30 dies gratis i cancel·la quan vulguis amb un clic." },
        { title: "Dades protegides a la UE", description: "Allotjament sobirà que compleix estrictament el RGPD Art. 9 per a dades de salut." },
      ],
      es: [
        { title: "Tarifa plana real", description: "18,50 $ USD/mes por clínica con usuarios, facultativos y gabinetes ilimitados." },
        { title: "Curva de aprendizaje cero", description: "Diseñado para que recepción y equipo médico lo dominen desde el primer minuto sin cursos pesados." },
        { title: "Sin permanencia ni costes de alta", description: "0 $ de gastos de configuración. Empieza con 30 días gratis y cancela cuando quieras en un clic." },
        { title: "Datos protegidos en la UE", description: "Alojamiento soberano que cumple estrictamente el RGPD Art. 9 para datos de salud." },
      ],
      en: [
        { title: "Real flat fee", description: "$18.50 USD/month per clinic with unlimited users, doctors, and operatories." },
        { title: "Zero learning curve", description: "Built for receptionists and doctors to master instantly without endless training." },
        { title: "No lock-in, zero setup fee", description: "$0 initial setup. Start with a 30-day free trial and cancel anytime in one click." },
        { title: "EU Sovereign Data", description: "Full compliance with GDPR Art. 9 strict health data standards." },
      ],
    },
    comparisonHead: {
      ca: ["Criteri", "Programaris Tradicionals", "Dentistes"],
      es: ["Criterio", "Softwares Tradicionales", "Dentistes"],
      en: ["Criteria", "Legacy Software", "Dentistes"],
    },
    comparisonRows: {
      ca: [
        ["Model de preu", "Per doctor / llicència (100 € - 250 €/mes)", "Tarifa plana: 18,50 $ USD/mes per clínica"],
        ["Límit d'usuaris", "Penalitzat amb recàrrecs per usuari", "Sense límit (doctors, higienistes, recepció)"],
        ["Cost d'alta i activació", "Fins a 1.200 €", "0 $ de quota d'alta"],
        ["Permanència", "12 a 36 mesos amb penalització", "Sense permanència"],
      ],
      es: [
        ["Modelo de precio", "Por doctor / licencia (100 € - 250 €/mes)", "Tarifa plana: 18,50 $ USD/mes por clínica"],
        ["Límite de usuarios", "Penalizado con recargos por usuario", "Sin límite (doctores, higienistas, recepción)"],
        ["Coste de alta y activación", "Hasta 1.200 €", "0 $ de cuota de alta"],
        ["Permanencia", "12 a 36 meses con penalización", "Sin permanencia"],
      ],
      en: [
        ["Pricing model", "Per doctor / per seat ($100 - $250/mo)", "Flat rate: $18.50 USD/mo per clinic"],
        ["User limits", "Surcharges per user", "Unlimited (dentists, hygienists, desk staff)"],
        ["Setup and onboarding fees", "Up to $1,200", "$0 setup fee"],
        ["Contract lock-in", "12 to 36 months", "No commitment, cancel anytime"],
      ],
    },
    ctaText: {
      ca: "Comença els teus 30 dies gratis amb tarifa plana",
      es: "Comienza tus 30 días gratis con tarifa plana",
      en: "Start your 30-day free trial with flat pricing",
    },
    faq: {
      ca: [
        { q: "Què inclou la tarifa plana de 18,50 $ USD/mes?", a: "Inclou totes les funcionalitats essencials: agenda multigabinet en temps real, odontograma interactiu adult i infantil, historial clínic inalterable, alertes mèdiques JSONB i gestió de facturació i rebuts." },
        { q: "Què passa si incorporem nous odontòlegs a la clínica?", a: "Absolutament res. El teu preu continua sent 18,50 $ USD/mes sense cap cost extra per usuari." },
      ],
      es: [
        { q: "¿Qué incluye la tarifa plana de 18,50 $ USD/mes?", a: "Incluye todas las funcionalidades esenciales: agenda multigabinete en tiempo real, odontograma interactivo adulto e infantil, historial clínico inalterable, alertas médicas JSONB y gestión de facturación y recibos." },
        { q: "¿Qué ocurre si incorporamos nuevos odontólogos a la clínica?", a: "Absolutamente nada. Tu cuota sigue siendo 18,50 $ USD/mes sin ningún coste extra por usuario." },
      ],
      en: [
        { q: "What is included in the $18.50 USD/mo flat rate?", a: "It includes all essential clinical tools: real-time multi-operatory schedule, adult/pediatric odontogram, immutable clinical records, critical medical alerts, and billing/receipt management." },
        { q: "What happens if new dentists join our practice?", a: "Nothing changes. Your monthly bill remains $18.50 USD with zero per-seat surcharge." },
      ],
    },
  },
  {
    id: "gestion-integral",
    slug: {
      ca: "software-gestio-clinica-dental",
      es: "software-gestion-clinica-dental",
      en: "dental-practice-management-software",
    },
    keyword: {
      ca: "Software gestió clínica dental",
      es: "Software gestión clínica dental",
      en: "Dental practice management software",
    },
    metaTitle: {
      ca: "Software de gestió clínica dental 360° al núvol | Dentistes",
      es: "Software de gestión clínica dental 360° en la nube | Dentistes",
      en: "All-in-one dental practice management cloud software | Dentistes",
    },
    metaDescription: {
      ca: "Connecta agenda multigabinet, odontograma interactiu, evolutius inalterables i control de cobraments en una sola plataforma d'alta velocitat. 18,50 $ USD/mes.",
      es: "Conecta agenda multigabinete, odontograma interactivo, evolutivos inalterables y control de cobros en una sola plataforma de alta velocidad. 18,50 $ USD/mes.",
      en: "Connect scheduling, FDI odontogram, immutable medical history, and billing in a single ultra-fast cloud system. $18.50 USD/month.",
    },
    badge: {
      ca: "Control operatiu total · 360°",
      es: "Control operativo total · 360°",
      en: "Total practice control · 360°",
    },
    h1: {
      ca: "Tota la teva clínica dental sota control.",
      es: "Toda tu clínica dental bajo control.",
      en: "Your entire dental clinic under control.",
    },
    h1Highlight: {
      ca: "De la primera cita al cobrament final.",
      es: "De la primera cita al cobro final.",
      en: "From first check-in to final payment.",
    },
    subtitle: {
      ca: "Connecta l'agenda multigabinet en temps real, l'odontograma de 5 cares, l'historial mèdic inalterable i la facturació en una plataforma dissenyada per a tauletes i escriptori.",
      es: "Conecta la agenda multigabinete en tiempo real, el odontograma de 5 caras, el historial médico inalterable y la facturación en una plataforma diseñada para tabletas y escritorio.",
      en: "Connect real-time scheduling, 5-surface odontogram, immutable clinical records, and billing in a platform built for tablets and desktops.",
    },
    painPointTitle: {
      ca: "Prou de dades disperses entre agenda, fitxers locals i papers",
      es: "Basta de datos dispersos entre agenda, carpetas locales y papeles",
      en: "Stop juggling data between calendars, local files, and paperwork",
    },
    painPointBody: {
      ca: "La pèrdua d'informació entre la recepció i el box provoca retards, solapament de sillons i pressupostos oblidats. Dentistes sincronitza tota la clínica a l'instant amb una arquitectura en Go que respon en mil·lisegons, mantenint la recepció i el facultatiu sempre connectats.",
      es: "La pérdida de información entre recepción y box provoca retrasos, solapamiento de sillones y presupuestos olvidados. Dentistes sincroniza toda la clínica al instante con una arquitectura en Go que responde en milisegundos, manteniendo recepción y facultativos siempre conectados.",
      en: "Fragmented information causes patient delays, double-booked chairs, and forgotten treatments. Dentistes syncs your entire practice in milliseconds via Go realtime streams.",
    },
    benefits: {
      ca: [
        { title: "Agenda multigabinet en temps real", description: "Canvis arrossegant amb el ratolí i sincronització instantània per Server-Sent Events (<500ms)." },
        { title: "Odontograma interactiu FDI", description: "5 cares independents, arrels anatòmiques i commutació ràpida entre dentició adulta i infantil." },
        { title: "Historial inalterable append-only", description: "Compliment estricte sanitari: les notes no es poden manipular i admeten addendes firmades." },
        { title: "Alertes mèdiques permanents", description: "Al·lèrgies, anticoagulants i profilaxis visibles sempre a la capçalera abans d'anestesiar." },
      ],
      es: [
        { title: "Agenda multigabinete en tiempo real", description: "Cambios arrastrando con el ratón y sincronización instantánea por Server-Sent Events (<500ms)." },
        { title: "Odontograma interactivo FDI", description: "5 caras independientes, raíces anatómicas y conmutación rápida entre dentición adulta e infantil." },
        { title: "Historial inalterable append-only", description: "Cumplimiento estricto sanitario: las notas no se pueden manipular y admiten adendas firmadas." },
        { title: "Alertas médicas permanentes", description: "Alergias, anticoagulantes y profilaxis visibles siempre en cabecera antes de anestesiar." },
      ],
      en: [
        { title: "Real-time Multi-chair Schedule", description: "Smooth drag-and-drop rescheduling synced instantly across boxes via Server-Sent Events (<500ms)." },
        { title: "Interactive FDI Odontogram", description: "5 independent surfaces, anatomical roots, and one-click toggle between adult and pediatric teeth." },
        { title: "Immutable Append-only Records", description: "Strict healthcare compliance: notes cannot be deleted and support signed addendums." },
        { title: "Critical Medical Alert Banner", description: "Allergies and anticoagulants permanently displayed on top before administering anesthesia." },
      ],
    },
    comparisonHead: {
      ca: ["Mòdul", "Com ho fa el software antic", "Com ho fa Dentistes"],
      es: ["Módulo", "Cómo lo hace el software antiguo", "Cómo lo hace Dentistes"],
      en: ["Module", "Legacy dental software", "Dentistes"],
    },
    comparisonRows: {
      ca: [
        ["Agenda", "Lenta, requereix recarregar pàgina", "Temps real ultra reactiu amb Server-Sent Events"],
        ["Odontograma", "Gràfics pesats, sense vistes infantils clares", "Vectorial SVG natiu FDI adult i temporal"],
        ["Història clínica", "Modificable sense traçabilitat", "Immutable auditable (append-only) segons RGPD Art. 9"],
        ["Dispositius", "Bloquejat a un servidor local de la clínica", "Accés segur al núvol des de PC, Mac i tauletes"],
      ],
      es: [
        ["Agenda", "Lenta, requiere recargar página", "Tiempo real ultra reactivo con Server-Sent Events"],
        ["Odontograma", "Gráficos pesados, sin vistas infantiles claras", "Vectorial SVG nativo FDI adulto y temporal"],
        ["Historia clínica", "Modificable sin trazabilidad", "Inmutable auditable (append-only) según RGPD Art. 9"],
        ["Dispositivos", "Bloqueado en un servidor local de la clínica", "Acceso seguro en la nube desde PC, Mac y tabletas"],
      ],
      en: [
        ["Scheduling", "Clunky, requires manual page reloads", "Ultra-fast realtime sync with Server-Sent Events"],
        ["Odontogram", "Heavy outdated graphics", "Native responsive SVG with adult & pediatric FDI charts"],
        ["Medical records", "Editable without audit trails", "Immutable append-only audit trail meeting strict health laws"],
        ["Hardware", "Locked to an on-premise local server", "Cloud-native, encrypted access from PC, Mac, and tablets"],
      ],
    },
    ctaText: {
      ca: "Descobreix la gestió 360° durant 30 dies gratis",
      es: "Descubre la gestión 360° durante 30 días gratis",
      en: "Experience all-in-one practice management free for 30 days",
    },
    faq: {
      ca: [
        { q: "Necessito instal·lar algun servidor a la clínica?", a: "No. Dentistes és una plataforma al núvol d'alt rendiment que funciona des de qualsevol navegador web modern (Chrome, Safari, Firefox) en escriptori o tauleta." },
        { q: "Puc gestionar múltiples gabinets en paral·lel?", a: "Sí, l'agenda permet visualitzar tants boxes com tingui la teva clínica simultàniament, amb intervals de 15 minuts i colors per tipus de tractament." },
      ],
      es: [
        { q: "¿Necesito instalar algún servidor en la clínica?", a: "No. Dentistes es una plataforma en la nube de alto rendimiento que funciona desde cualquier navegador web moderno (Chrome, Safari, Firefox) en escritorio o tableta." },
        { q: "¿Puedo gestionar múltiples gabinetes en paralelo?", a: "Sí, la agenda permite visualizar tantos boxes como tenga tu clínica simultáneamente, con intervalos de 15 minutos y colores por tipo de tratamiento." },
      ],
      en: [
        { q: "Do I need a local server in my clinic?", a: "No. Dentistes is a secure cloud application running on any modern browser across PCs, Macs, and tablets." },
        { q: "Can I manage multiple chairs side by side?", a: "Yes, the scheduler shows all clinic operatories in parallel columns with 15-minute grids and color-coded appointments." },
      ],
    },
  },
  {
    id: "verifactu-ticketbai",
    slug: {
      ca: "verifactu-ticketbai-clinica-dental",
      es: "verifactu-ticketbai-clinica-dental",
      en: "dental-billing-verifactu-ticketbai",
    },
    keyword: {
      ca: "VeriFactu i TicketBAI dental",
      es: "VeriFactu y TicketBAI clínica dental",
      en: "Dental practice tax compliance",
    },
    metaTitle: {
      ca: "Software dental adaptat a VeriFactu i TicketBAI | Facturació amb QR | Dentistes",
      es: "Software dental adaptado a VeriFactu y TicketBAI | Facturación con QR | Dentistes",
      en: "Dental billing software with VeriFactu, TicketBAI and QR compliance | Dentistes",
    },
    metaDescription: {
      ca: "Adapta la teva clínica a la llei antifrau d'Hisenda (VeriFactu i TicketBAI) sense pagar quotes d'actualització. Factures amb codi QR incloses a 18,50 $ USD/mes.",
      es: "Adapta tu clínica a la ley antifraude de Hacienda (VeriFactu y TicketBAI) sin pagar cuotas de actualización. Facturas con código QR incluidas a 18,50 $ USD/mes.",
      en: "Comply with electronic invoicing mandates and anti-fraud tax rules with verified QR receipts. Included in the $18.50 USD/mo flat fee.",
    },
    badge: {
      ca: "Compliment fiscal · Llei Antifrau",
      es: "Cumplimiento fiscal · Ley Antifraude",
      en: "Fiscal & anti-fraud compliance",
    },
    h1: {
      ca: "Facturació legal amb codi QR per a Hisenda.",
      es: "Facturación legal con código QR para Hacienda.",
      en: "Compliant dental invoicing with verified QR codes.",
    },
    h1Highlight: {
      ca: "Sense pagar quotes d'actualització sorpresa.",
      es: "Sin pagar cuotas de actualización sorpresa.",
      en: "With zero surprise upgrade fees.",
    },
    subtitle: {
      ca: "Emet pressupostos, factures sanitàries i tiquets de cobrament amb encadenament VeriFactu, TicketBAI i codi QR oficial, directament inclòs a la tarifa plana de 18,50 $ USD/mes.",
      es: "Emite presupuestos, facturas sanitarias y recibos de cobro con encadenamiento VeriFactu, TicketBAI y código QR oficial, directamente incluido en la tarifa plana de 18,50 $ USD/mes.",
      en: "Issue treatment estimates, dental invoices, and receipts with security hashes and official QR codes, included in the $18.50 USD/mo flat rate.",
    },
    painPointTitle: {
      ca: "El negoci de cobrar milers d'euros per 'actualitzacions normatives'",
      es: "El negocio de cobrar miles de euros por 'actualizaciones normativas'",
      en: "The practice of charging thousands for regulatory updates",
    },
    painPointBody: {
      ca: "Molts proveïdors clàssics de software dental aprofiten l'entrada en vigor de VeriFactu i normatives antifrau per exigir pagaments de 500 € a 1.500 € en concepte de renovació de llicència o mòdul fiscal. Amb Dentistes, l'adaptació legal i la generació de codis QR és nativa i està 100% inclosa a la teva subscripció.",
      es: "Muchos proveedores clásicos de software dental aprovechan la entrada en vigor de VeriFactu y normativas antifraude para exigir pagos de 500 € a 1.500 € en concepto de renovación de licencia o módulo fiscal. Con Dentistes, la adaptación legal y la generación de códigos QR es nativa y está 100% incluida en tu suscripción.",
      en: "Legacy dental software vendors often charge $500 to $1,500 for tax and anti-fraud modules. With Dentistes, compliance and QR generation are natively built-in at no extra charge.",
    },
    benefits: {
      ca: [
        { title: "Encadenament VeriFactu i TicketBAI", description: "Registres d'emissió amb hash criptogràfic inalterable segons els requisits tributaris." },
        { title: "Codis QR d'alta resolució", description: "Comprovació pública instantània des de qualsevol mòbil sense necessitat d'iniciar sessió." },
        { title: "Exempció d'IVA mèdic per defecte", description: "Configurat per defecte amb taxa 0% per a actes odontològics i desglossament per a estètica." },
        { title: "Control de caixa i cobraments parcials", description: "Arqueig diari, seguiment de saldos pendents i cobrament per quotes de tractament." },
      ],
      es: [
        { title: "Encadenamiento VeriFactu y TicketBAI", description: "Registros de emisión con hash criptográfico inalterable según los requisitos tributarios." },
        { title: "Códigos QR de alta resolución", description: "Comprobación pública instantánea desde cualquier móvil sin necesidad de iniciar sesión." },
        { title: "Exención de IVA médico por defecto", description: "Configurado por defecto con tasa 0% para actos odontológicos y desglose para estética." },
        { title: "Control de caja y cobros parciales", description: "Arqueo diario, seguimiento de saldos pendientes y cobro por cuotas de tratamiento." },
      ],
      en: [
        { title: "Chained Anti-fraud Audit Trails", description: "Cryptographic chaining ensuring invoices cannot be altered or deleted." },
        { title: "High-resolution QR Verification", description: "Instant mobile QR scanning linking to verified payment proofs." },
        { title: "Medical VAT exemption presets", description: "Preconfigured 0% health tax with flexible rules for cosmetic dentistry." },
        { title: "Cash reconciliation & partial payments", description: "Track session payments, treatment installments, and end-of-day register balancing." },
      ],
    },
    comparisonHead: {
      ca: ["Requisit", "Altres Programaris", "Dentistes"],
      es: ["Requisito", "Otros Softwares", "Dentistes"],
      en: ["Requirement", "Other Software", "Dentistes"],
    },
    comparisonRows: {
      ca: [
        ["Adaptació VeriFactu/TicketBAI", "Mòdul extra de pagament (300 € - 1.200 €)", "Inclòs a la tarifa plana (18,50 $ USD/mes)"],
        ["Generació de QR fiscal", "Sovint requereix impressora física o plugin", "Integrat al document PDF automàticament"],
        ["Immutabilitat del registre", "Modificacions manuals no auditades", "Encadenament criptogràfic i traça d'auditoria"],
        ["Quotes de manteniment anual", "Obligatòries per rebre pegats fiscals", "0 € de manteniment, actualitzacions al núvol"],
      ],
      es: [
        ["Adaptación VeriFactu/TicketBAI", "Módulo extra de pago (300 € - 1.200 €)", "Incluido en la tarifa plana (18,50 $ USD/mes)"],
        ["Generación de QR fiscal", "A menudo requiere impresora física o plugin", "Integrado en el documento PDF automáticamente"],
        ["Inmutabilidad del registro", "Modificaciones manuales no auditadas", "Encadenamiento criptográfico y traza de auditoría"],
        ["Cuotas de mantenimiento anual", "Obligatorias para recibir parches fiscales", "0 € de mantenimiento, actualizaciones en la nube"],
      ],
      en: [
        ["Anti-fraud compliance", "Paid add-on ($300 - $1,200)", "Included in flat fee ($18.50 USD/mo)"],
        ["Fiscal QR code generation", "Requires third-party plugins", "Rendered directly inside PDF documents"],
        ["Audit immutability", "Manual changes without trails", "Tamper-evident cryptographically chained records"],
        ["Annual maintenance fees", "Mandatory to get regulatory patches", "$0 maintenance, continuous cloud updates"],
      ],
    },
    ctaText: {
      ca: "Comença els teus 30 dies gratis amb facturació legal",
      es: "Comienza tus 30 días gratis con facturación legal",
      en: "Start your 30-day trial with verified billing",
    },
    faq: {
      ca: [
        { q: "Què és VeriFactu i quan s'aplica?", a: "VeriFactu és el reglament tècnic derivat de la Llei Antifrau a Espanya que obliga els sistemes informàtics de facturació a garantir la integritat, conservació, accessibilitat, llegibilitat i inalterabilitat dels registres, afegint un codi QR de comprovació." },
        { q: "Dentistes cobra algun suplement per generar factures amb QR?", a: "No. Tots els requeriments fiscals i la generació de documents amb codi QR formen part del Paquet Base Essencial." },
      ],
      es: [
        { q: "¿Qué es VeriFactu y cuándo se aplica?", a: "VeriFactu es el reglamento técnico derivado de la Ley Antifraude en España que obliga a los sistemas informáticos de facturación a garantizar la integridad, conservación, accesibilidad, legibilidad e inalterabilidad de los registros, añadiendo un código QR de comprobación." },
        { q: "¿Dentistes cobra algún suplemento por generar facturas con QR?", a: "No. Todos los requerimientos fiscales y la generación de documentos con código QR forman parte del Paquete Base Esencial." },
      ],
      en: [
        { q: "What is the anti-fraud billing requirement?", a: "Tax authorities require billing systems to ensure invoice immutability with verified cryptographic hashes and scannable QR codes." },
        { q: "Does Dentistes charge extra for compliant QR receipts?", a: "No. Full receipt generation and QR verification are included in the $18.50 USD/mo base subscription." },
      ],
    },
  },
  {
    id: "migracion",
    slug: {
      ca: "canviar-software-dental-migracio",
      es: "cambiar-software-dental-migracion",
      en: "switch-dental-practice-software",
    },
    keyword: {
      ca: "Canviar software clínica dental",
      es: "Cambiar software clínica dental",
      en: "Switch dental software",
    },
    metaTitle: {
      ca: "Canviar de software dental sense estrès en 48 hores | Dentistes",
      es: "Cambiar de software dental sin estrés en 48 horas | Dentistes",
      en: "Switch dental software in 48 hours with zero downtime | Dentistes",
    },
    metaDescription: {
      ca: "Traspàs assistit d'historials, odontogrames i cites futures a cost 0. Canvia des de Gesden, Dentalink o XDental sense aturar la consulta. Tarifa plana 18,50 $ USD/mes.",
      es: "Traspaso asistido de historiales, odontogramas y citas futuras a coste 0. Cambia desde Gesden, Dentalink o XDental sin detener la consulta. Tarifa plana 18,50 $ USD/mes.",
      en: "Assisted migration for patients, charts, and upcoming appointments. Switch from legacy dental software without downtime. Flat $18.50 USD/mo.",
    },
    badge: {
      ca: "Migració assistida · Cost 0",
      es: "Migración asistida · Coste 0",
      en: "Assisted migration · Zero cost",
    },
    h1: {
      ca: "Canvia de programari dental en 48 hores.",
      es: "Cambia de software dental en 48 horas.",
      en: "Switch dental software in 48 hours.",
    },
    h1Highlight: {
      ca: "Sense aturar la clínica ni perdre dades.",
      es: "Sin detener la clínica ni perder datos.",
      en: "With zero downtime and zero data loss.",
    },
    subtitle: {
      ca: "Traspassem les teves fitxes de pacients, cites programades i tractaments sense interrupció. Comença a estalviar des del primer mes amb la nostra tarifa plana de 18,50 $ USD/mes.",
      es: "Traspasamos tus fichas de pacientes, citas programadas y tratamientos sin interrupción. Empieza a ahorrar desde el primer mes con nuestra tarifa plana de 18,50 $ USD/mes.",
      en: "We migrate your patient records, appointments, and treatment history seamlessly. Start saving immediately with our flat $18.50 USD/mo rate.",
    },
    painPointTitle: {
      ca: "La por a canviar és l'únic que et manté lligat a un software car i lent",
      es: "El miedo a cambiar es lo único que te mantiene atado a un software caro y lento",
      en: "Fear of migration is the only reason clinics stay with overpriced legacy software",
    },
    painPointBody: {
      ca: "El 82% dels dentistes titulars que continuen pagant llicències cares admeten que no canvien per por de perdre historials clínics o bloquejar la recepció durant setmanes. Amb el nostre protocol de migració en 3 passos, el traspàs es realitza durant el cap de setmana o en hores no lectives per garantir un inici net i tranquil.",
      es: "El 82% de los dentistas titulares que siguen pagando licencias caras admiten que no cambian por miedo a perder historiales clínicos o bloquear la recepción durante semanas. Con nuestro protocolo de migración en 3 pasos, el traspaso se realiza durante el fin de semana o en horas no lectivas para garantizar un arranque limpio y tranquilo.",
      en: "Most dental clinic owners stay with legacy tools solely out of fear of lost records or front-desk chaos. Our assisted 3-step migration protocol runs without disturbing your clinical hours.",
    },
    benefits: {
      ca: [
        { title: "Dia 1: Exportació guiada", description: "T'ajudem a exportar els teus pacients, antecedents i cites en format obert sense dependre del teu antic proveïdor." },
        { title: "Dia 2: Mapeig i validació", description: "Verifiquem la integritat de les dades i fem una sessió de 30 minuts per resoldre qualsevol dubte de l'equip." },
        { title: "Dia 3: Operant amb total normalitat", description: "La clínica obre amb tots els pacients carregats i l'agenda llesta per passar consulta." },
        { title: "Sense costos d'importació", description: "El procés d'acompanyament està 100% inclòs durant el teu període de prova de 30 dies." },
      ],
      es: [
        { title: "Día 1: Exportación guiada", description: "Te ayudamos a exportar tus pacientes, antecedentes y citas en formato abierto sin depender de tu antiguo proveedor." },
        { title: "Día 2: Mapeo y validación", description: "Verificamos la integridad de los datos y realizamos una sesión de 30 minutos para resolver cualquier duda del equipo." },
        { title: "Día 3: Operando con total normalidad", description: "La clínica abre con todos los pacientes cargados y la agenda lista para pasar consulta." },
        { title: "Sin costes de importación", description: "El proceso de acompañamiento está 100% incluido durante tu periodo de prueba de 30 días." },
      ],
      en: [
        { title: "Day 1: Guided Export", description: "We help extract your patients, medical alerts, and appointments in standard formats." },
        { title: "Day 2: Mapping & Verification", description: "We clean and verify data integrity and run a fast 30-minute orientation with your staff." },
        { title: "Day 3: Fully Operational", description: "Doors open with every patient and schedule ready in Dentistes." },
        { title: "Zero Migration Cost", description: "Full onboarding assistance is included during your 30-day trial." },
      ],
    },
    comparisonHead: {
      ca: ["Fase", "Com ho fa el mercat tradicional", "Protocol Dentistes"],
      es: ["Fase", "Cómo lo hace el mercado tradicional", "Protocolo Dentistes"],
      en: ["Step", "Legacy vendors", "Dentistes protocol"],
    },
    comparisonRows: {
      ca: [
        ["Cost de migració", "300 € a 800 € per paquet de dades", "0 $ inclòs a la prova"],
        ["Termini de traspàs", "De 2 a 4 setmanes amb talls de servei", "En menys de 48 hores"],
        ["Formació de l'equip", "Jornades feixugues de formació de pagament", "Interfície intuïtiva: aprenentatge en 30 minuts"],
        ["Continuïtat d'agenda", "Risc de solapament o pèrdua de cites", "Verificació d'agenda futura cita per cita"],
      ],
      es: [
        ["Coste de migración", "300 € a 800 € por paquete de datos", "0 $ incluido en la prueba"],
        ["Plazo de traspaso", "De 2 a 4 semanas con cortes de servicio", "En menos de 48 horas"],
        ["Formación del equipo", "Jornadas pesadas de formación de pago", "Interfaz intuitiva: aprendizaje en 30 minutos"],
        ["Continuidad de agenda", "Riesgo de solapamiento o pérdida de citas", "Verificación de agenda futura cita por cita"],
      ],
      en: [
        ["Migration price", "$300 to $800 extra fee", "$0 included in free trial"],
        ["Timeline", "2 to 4 weeks with downtime", "Under 48 hours"],
        ["Staff training", "Paid multi-day sessions", "Intuitive UI: learned in 30 minutes"],
        ["Schedule continuity", "Risk of lost future appointments", "Double-checked future appointment mapping"],
      ],
    },
    ctaText: {
      ca: "Sol·licita el teu pla de migració gratuït",
      es: "Solicita tu plan de migración gratuito",
      en: "Request your free migration plan",
    },
    faq: {
      ca: [
        { q: "Quines dades es poden traspassar des del meu software actual?", a: "Podem migrar dades demogràfiques de pacients, telèfons, DNI, alertes mèdiques estructurades, catàleg de tractaments i cites futures de l'agenda." },
        { q: "Què passa si vull provar el sistema abans de migrar definitivament?", a: "Pots crear el teu compte en 1 minut amb la prova de 30 dies de franc, provar l'agenda i l'odontograma amb dades de mostra i, quan estiguis segur, realitzem la càrrega dels teus pacients reals." },
      ],
      es: [
        { q: "¿Qué datos se pueden traspasar desde mi software actual?", a: "Podemos migrar datos demográficos de pacientes, teléfonos, DNI, alertas médicas estructuradas, catálogo de tratamientos y citas futuras de la agenda." },
        { q: "¿Qué ocurre si quiero probar el sistema antes de migrar definitivamente?", a: "Puedes crear tu cuenta en 1 minuto con la prueba de 30 días gratis, probar la agenda y el odontograma con datos de muestra y, cuando estés seguro, realizamos la carga de tus pacientes reales." },
      ],
      en: [
        { q: "Which data points can be migrated?", a: "Patient contact records, IDs, structured medical alerts, treatment catalogues, and upcoming schedule slots." },
        { q: "Can I test the platform before committing to data transfer?", a: "Yes. You have a 30-day free trial to explore the interface, and we migrate your real data whenever you are ready." },
      ],
    },
  },
];

export function getLandingBySlug(lang: Lang, slug: string): CampaignLandingData | undefined {
  return LANDINGS.find((landing) => landing.slug[lang] === slug || landing.id === slug);
}

export function landingPath(lang: Lang, landing: CampaignLandingData): string {
  const prefix = lang === "es" ? "" : `/${lang}`;
  return `${prefix}/${landing.slug[lang]}/`;
}
