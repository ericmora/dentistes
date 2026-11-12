import type { Copy } from "./types";

export const es: Copy = {
  meta: {
    home: {
      title: "Dentistes — Software de gestión dental para clínicas independientes",
      description:
        "Agenda multigabinete, odontograma, historial y facturación en una sola plataforma. 18,50 $ USD/mes por clínica, usuarios y pacientes ilimitados. Prueba 30 días, 0 $ hoy con Stripe.",
    },
    blog: {
      title: "Blog para clínicas dentales independientes | Dentistes",
      description:
        "Guías prácticas sobre gestión, precios, migración y operaciones para clínicas dentales independientes. Contenido útil para decidir mejor, sin humo.",
    },
    notFound: {
      title: "Página no encontrada | Dentistes",
      description: "La página que buscas no existe o se ha movido.",
    },
  },
  nav: {
    product: "Producto",
    how: "Cómo funciona",
    pricing: "Precios",
    security: "Seguridad",
    blog: "Blog",
    login: "Entrar",
    trial: "Prueba 30 días",
    menu: "Abrir menú",
    close: "Cerrar menú",
    language: "Idioma",
  },
  hero: {
    eyebrow: "Software de gestión dental para clínicas independientes",
    h1a: "Tu clínica crece.",
    h1b: "Tu cuota se mantiene.",
    intro:
      "Agenda multigabinete, odontograma, historial y facturación en una sola plataforma. Una cuota plana por clínica, todo tu equipo dentro y menos trabajo administrativo.",
    ctaPrimary: "Empieza la prueba de 30 días",
    ctaSecondary: "Ver cómo funciona",
    trust: ["0 $ hoy con Stripe", "0 $ de alta", "Migración asistida", "Datos en la UE"],
    panel: {
      title: "Agenda / martes",
      subtitle: "3 gabinetes · 12 citas",
      live: "En directo",
      cabinets: ["Gabinete 1", "Gabinete 2", "Gabinete 3"],
      appointments: [
        {
          time: "09:00",
          name: "Anna P.",
          treatment: "Limpieza",
          cabinet: "Gabinete 1",
          status: "Confirmada",
          tone: "confirmed",
        },
        {
          time: "09:30",
          name: "Marc R.",
          treatment: "Endodoncia",
          cabinet: "Gabinete 2",
          status: "En silla",
          tone: "chair",
        },
        {
          time: "10:15",
          name: "Laia M.",
          treatment: "Revisión",
          cabinet: "Gabinete 1",
          status: "Confirmada",
          tone: "confirmed",
        },
        {
          time: "10:30",
          name: "Jordi S.",
          treatment: "Primera visita",
          cabinet: "Gabinete 3",
          status: "Pendiente",
          tone: "pending",
        },
        {
          time: "11:00",
          name: "Nuria B.",
          treatment: "Obturación",
          cabinet: "Gabinete 2",
          status: "Confirmada",
          tone: "confirmed",
        },
      ],
      free: "3 huecos libres",
      whatsapp: "WhatsApp confirmado",
      footer: "Arrastra una cita. El hueco se actualiza en los tres gabinetes.",
    },
  },
  proof: {
    items: [
      { value: "18,50 $", label: "USD por clínica y mes" },
      { value: "∞", label: "usuarios y pacientes" },
      { value: "30", label: "días de prueba" },
      { value: "0 $", label: "de coste de alta" },
    ],
    note: "Tarifa plana global en USD. Impuestos no incluidos.",
  },
  problem: {
    index: "01 / El problema",
    title: "El software no debería castigar el crecimiento de tu clínica",
    intro:
      "Cuando cada persona nueva cuesta una licencia más, el equipo crece y el margen no. Cuando el sistema obliga a saltar entre módulos, la recepción pierde tiempo y el dentista también.",
    points: [
      {
        title: "Pagas por persona",
        text: "El precio sube con cada incorporación y acabas decidiendo quién entra al sistema y quién no.",
      },
      {
        title: "Módulos que se suman",
        text: "WhatsApp, firma, recordatorios o informes se cobran aparte. La factura final no se parece a la inicial.",
      },
      {
        title: "Datos difíciles de mover",
        text: "Si cambiar de proveedor da miedo, no es porque sea fácil: es porque el proveedor no te lo pone fácil.",
      },
    ],
    footnote: "Nuestra propuesta es sencilla: una cuota plana por clínica y un producto que se usa todos los días.",
  },
  product: {
    index: "02 / Producto",
    title: "Todo el flujo clínico, en una sola pantalla",
    intro: "Sin ventanas emergentes, sin exportar a Excel y sin buscar el historial en otra pestaña.",
    modules: [
      {
        id: "agenda",
        title: "Agenda multigabinete",
        text: "Ve todos los gabinetes a la vez, mueve una cita sin solapar y confirma por WhatsApp desde la misma pantalla.",
        bullets: ["Vista por gabinete y profesional", "Reprogramación con validación", "Recordatorios y confirmaciones"],
      },
      {
        id: "odontograma",
        title: "Odontograma interactivo",
        text: "32 piezas, cinco caras por diente y estados claros. Del diagnóstico al presupuesto sin volver a escribirlo.",
        bullets: ["Estados por cara", "Adulto e infantil", "Presupuesto conectado"],
      },
      {
        id: "historial",
        title: "Historial con alertas",
        text: "Evoluciones, diagnósticos y alertas médicas en una ficha que recepción y dentista pueden leer según su rol.",
        bullets: ["Alertas visibles", "Permisos por rol", "Registro de accesos"],
      },
      {
        id: "facturacion",
        title: "Facturación con QR",
        text: "Presupuestos y facturas verificables, pagos parciales y cobro por sesión. Sin calcular impuestos a mano.",
        bullets: ["PDF con QR", "Pagos parciales", "Estado de cobro"],
      },
      {
        id: "espera",
        title: "Lista de espera dinámica",
        text: "Cuando se cancela una cita, el sistema te dice a quién llamar según urgencia, disponibilidad y compatibilidad.",
        bullets: ["Prioridad clínica", "Disponibilidad real", "Cobertura de huecos"],
      },
    ],
  },
  odontogram: {
    title: "Odontograma interactivo",
    hint: "Toca una cara dental para cambiar su estado. Así se documenta un diagnóstico en segundos.",
    states: {
      healthy: "Sana",
      caries: "Caries",
      restored: "Restaurada",
      planned: "Planificada",
      missing: "Ausente",
    },
    selected: "Seleccionado",
    reset: "Reiniciar",
    tooth: "Pieza",
  },
  receipt: {
    index: "03 / La cuenta clara",
    title: "La diferencia se ve en la factura",
    intro:
      "Ejemplo ilustrativo con 4 personas y una cuota de mercado de 75 $ USD por usuario. Los precios de cada proveedor varían; lo que no varía es la lógica.",
    traditional: {
      label: "Software por usuario",
      lines: [
        { label: "4 usuarios × 75 $", value: "300 $/mes" },
        { label: "WhatsApp", value: "+20 $/mes" },
        { label: "Firma digital", value: "+10 $/mes" },
      ],
      totalLabel: "Total orientativo",
      total: "330 $/mes",
    },
    dentistes: {
      label: "Dentistes",
      lines: [
        { label: "Cuota plana por clínica", value: "18,50 $/mes" },
        { label: "WhatsApp", value: "+20 $/mes" },
        { label: "Firma digital", value: "+10 $/mes" },
      ],
      totalLabel: "Total con los mismos add-ons",
      total: "48,50 $/mes",
    },
    saving: "281,50 $/mes de diferencia",
    note: "Cálculo ilustrativo, no es una oferta de terceros. Los precios de cada proveedor pueden variar según módulos y volumen.",
  },
  whatsapp: {
    index: "04 / WhatsApp",
    title: "La conversación que evita una llamada",
    intro:
      "Un agente responde confirmaciones y reprogramaciones. Si hay una duda clínica, deriva a recepción con todo el contexto.",
    bullets: [
      "Confirmaciones y recordatorios",
      "Reprogramación en lenguaje natural",
      "Derivación a una persona",
      "Consentimiento y trazabilidad",
    ],
    phone: {
      title: "Dentistes · Recepción",
      status: "Agente activo",
      messages: [
        { from: "clinic", text: "Hola, Anna. Te esperamos mañana a las 10:30 en el gabinete 2. ¿Confirmas?", time: "17:42" },
        { from: "patient", text: "Sí, confirmo.", time: "17:43" },
        { from: "clinic", text: "Perfecto. Si necesitas cambiarla, responde a este mensaje.", time: "17:43" },
        { from: "patient", text: "Mejor el jueves por la tarde.", time: "17:45" },
        { from: "clinic", text: "Te ofrezco jueves a las 17:00 o viernes a las 9:30.", time: "17:45" },
      ],
      note: "Si la conversación se complica, recepción recibe el contexto y toma el control.",
    },
    addon: "Add-on: 20 $ USD/mes",
    cta: "Ver precios y add-ons",
  },
  security: {
    index: "05 / Seguridad",
    title: "Datos de salud, con el cuidado que exige el sector",
    intro:
      "Dentistes está diseñado para clínicas que trabajan con historiales médicos y datos personales todos los días.",
    points: [
      {
        title: "Aislamiento por clínica",
        text: "Cada clínica tiene sus datos separados por fila y un contexto de seguridad propio.",
      },
      {
        title: "Acceso por roles",
        text: "Recepción, dentista, higienista y administración ven solo lo que necesitan.",
      },
      {
        title: "Datos en la UE",
        text: "Alojamiento en la Unión Europea y tránsito cifrado con TLS.",
      },
      {
        title: "Trazabilidad",
        text: "Registro de accesos y cambios para poder auditar qué ha pasado.",
      },
      {
        title: "Copias de seguridad",
        text: "Copias diarias y un plan de recuperación documentado.",
      },
      {
        title: "Sin permanencia",
        text: "Puedes exportar tus datos y marcharte. La puerta siempre está abierta.",
      },
    ],
    diagram: { clinic: "Clínica", api: "API", db: "PostgreSQL + RLS", label: "Aislamiento por tenant" },
    note: "La seguridad no es una página web: es una arquitectura. Podemos explicarte cómo funciona la nuestra en una llamada.",
  },
  pricing: {
    index: "06 / Precios",
    title: "Una cuota. Toda la clínica.",
    intro:
      "El Paquete Base Esencial incluye lo que una clínica independiente necesita para trabajar. Sin coste de alta y sin permanencia.",
    monthly: "Mensual",
    annual: "Anual",
    annualNote: "2 meses gratis",
    perMonth: "/mes",
    perYear: "/año",
    billed: "Facturado anualmente",
    globalLabel: "Tarifa plana global · USD",
    baseName: "Paquete Base Esencial",
    baseDescription: "Agenda, odontograma, historial, facturación y recordatorios para toda la clínica.",
    included: "Incluido",
    features: [
      "Agenda multigabinete en tiempo real",
      "Odontograma interactivo de 32 piezas",
      "Historial clínico con alertas médicas",
      "Presupuestos y facturas con QR",
      "Recordatorios automáticos de visita",
      "Usuarios y pacientes ilimitados",
      "Migración de datos asistida",
      "Soporte en español y catalán",
      "Actualizaciones incluidas",
      "Datos alojados en la UE",
    ],
    addonsTitle: "Add-ons opcionales",
    addonsNote: "Solo pagas lo que activas. Puedes empezar con el paquete base y añadir después.",
    addons: {
      whatsapp: {
        name: "Agente de WhatsApp",
        description: "Confirmaciones, recordatorios y reprogramación con derivación a recepción cuando hace falta.",
      },
      signature: {
        name: "Firma digital",
        description: "Consentimientos informados firmados desde el móvil, con trazabilidad y fecha.",
      },
      pack: {
        name: "Pack Completo",
        description: "Base Esencial + WhatsApp + firma digital, con un precio conjunto.",
      },
    },
    packNote: "Ahorra frente a contratar los add-ons por separado.",
    cta: "Empieza la prueba de 30 días",
    footnote: "Precios sin impuestos. La prueba de 30 días se activa con Stripe sin cargo hoy. El plan anual equivale a 10 mensualidades.",
  },
  comparison: {
    index: "07 / Comparativa",
    title: "Lo que cambia con Dentistes",
    intro:
      "Una comparación genérica con el modelo habitual del mercado. Sin nombres comerciales y sin promesas que no podamos cumplir.",
    columns: ["Dentistes", "Modelo habitual"],
    rows: [
      { label: "Modelo de precio", dentistes: "Por clínica", other: "Por usuario o por módulo" },
      { label: "Usuarios", dentistes: "Ilimitados", other: "A menudo, de pago" },
      { label: "Pacientes", dentistes: "Ilimitados", other: "Límite o módulo" },
      { label: "Alta y migración", dentistes: "0 $ + asistida", other: "Variable" },
      { label: "Permanencia", dentistes: "Sin permanencia", other: "12–24 meses habituales" },
      { label: "WhatsApp IA", dentistes: "Add-on opcional", other: "Módulo o servicio externo" },
      { label: "Datos", dentistes: "UE + aislamiento RLS", other: "Variable" },
    ],
    note: "Comparación genérica basada en nuestro análisis de mercado de noviembre de 2026. Cada proveedor tiene sus propias condiciones.",
  },
  audience: {
    index: "08 / Para quién es",
    title: "Pensado para clínicas que quieren crecer sin pagar más por ello",
    intro:
      "Si tu clínica tiene entre 2 y 10 personas y quieres dejar de pagar por usuario, estás en el sitio correcto.",
    items: [
      {
        title: "Clínica independiente",
        text: "Decides tú, no un grupo inversor. Necesitas un sistema que no te obligue a contratar un departamento de IT.",
      },
      {
        title: "Equipo pequeño que crece",
        text: "Cada incorporación debe sumar, no restar margen.",
      },
      {
        title: "Clínica que cambia de software",
        text: "Quieres migrar sin perder historiales ni la confianza del equipo.",
      },
      {
        title: "Proyecto nuevo",
        text: "Abres consulta y quieres empezar con una base ordenada desde el primer día.",
      },
    ],
  },
  faq: {
    index: "09 / Preguntas",
    title: "Lo que suelen preguntarnos",
    intro: "Respuestas directas. Si falta algo, escríbenos desde el formulario.",
    items: [
      {
        q: "¿Cuánto cuesta Dentistes?",
        a: "El Paquete Base Esencial cuesta 18,50 $ USD/mes por clínica. Incluye usuarios y pacientes ilimitados, agenda, odontograma, historial, facturación y recordatorios. No hay coste de alta ni permanencia. El pago anual equivale a 10 meses (185 $ USD/año).",
      },
      {
        q: "¿La prueba de 30 días es realmente gratuita?",
        a: "Sí. Los primeros 30 días son gratuitos (0 $ hoy). Para activarlos se introduce la tarjeta en Stripe Checkout, sin ningún cargo hasta el día 31, y puedes cancelar en cualquier momento.",
      },
      {
        q: "¿Puedo migrar los datos de mi clínica actual?",
        a: "Sí. La migración de pacientes, historiales y citas está asistida por el equipo de Dentistes. Revisamos el origen de los datos, acordamos el formato y validamos los registros antes de poner la clínica en marcha.",
      },
      {
        q: "¿Dónde se alojan los datos de los pacientes?",
        a: "En la Unión Europea. La arquitectura multi-tenant aísla los datos de cada clínica por fila con RLS, aplica control de acceso por roles y cifra el tráfico con TLS. Los accesos quedan registrados para poder auditarlos.",
      },
      {
        q: "¿Hay que instalar algún programa?",
        a: "No. Dentistes funciona en el navegador, también en tablets y móviles. No hay que instalar nada ni mantener servidores locales.",
      },
      {
        q: "¿Qué pasa si quiero cancelar?",
        a: "No hay permanencia. Puedes cancelar la suscripción y exportar los datos de la clínica. El servicio deja de estar activo al final del periodo ya pagado.",
      },
      {
        q: "¿El agente de WhatsApp y la firma digital están incluidos?",
        a: "Son add-ons del Paquete Base Esencial. El agente de WhatsApp cuesta 20 $ USD/mes y la firma digital, 10 $ USD/mes. El Pack Completo agrupa el paquete base y ambos add-ons por 39 $ USD/mes.",
      },
      {
        q: "¿Habéis trabajado con clínicas reales?",
        a: "Estamos abriendo el programa piloto con clínicas independientes del Garraf y el Penedès. El piloto incluye acompañamiento en la migración, formación del equipo y un canal directo con el producto para resolver incidencias.",
      },
    ],
  },
  contact: {
    index: "10 / Hablemos",
    title: "Empieza con una prueba real",
    intro:
      "Crea la clínica y prueba el paquete base durante 30 días. Si prefieres una demo de 15 minutos, déjanos tus datos y te llamamos.",
    name: "Tu nombre",
    clinic: "Clínica",
    email: "Email",
    phone: "Teléfono (opcional)",
    submitTrial: "Empezar prueba de 30 días",
    submitDemo: "Quiero una demo de 15 min",
    submitting: "Enviando solicitud...",
    demoSuccess: "Solicitud recibida. Te contactaremos pronto para agendar la demo de 15 minutos.",
    demoError: "No se pudo enviar la solicitud. Inténtalo de nuevo o empieza la prueba directa.",
    privacy: "Al enviar aceptas nuestra",
    note: "0 $ hoy con Stripe. Sin permanencia. Migración asistida.",
  },
  footer: {
    tagline: "Software de gestión dental para clínicas independientes.",
    product: "Producto",
    resources: "Recursos",
    legal: "Legal",
    pricing: "Precios",
    security: "Seguridad",
    blog: "Blog",
    privacy: "Privacidad",
    terms: "Términos",
    cookies: "Cookies",
    trial: "Prueba 30 días",
    rights: "© 2026 Dentistes. Todos los derechos reservados.",
    madeIn: "Hecho en el Garraf, para clínicas de verdad.",
  },
  legal: {
    privacy: {
      title: "Privacidad y protección de datos",
      updated: "Última actualización: 12 de noviembre de 2026",
      intro:
        "Esta política explica cómo tratamos los datos personales que nos facilitas a través de la web pública de Dentistes.",
      sections: [
        {
          title: "Responsable del tratamiento",
          text: "Dentistes es un producto de 2mes4. Para cualquier consulta relacionada con privacidad puedes escribirnos a través del formulario de contacto de esta web.",
        },
        {
          title: "Datos que tratamos",
          text: "Tratamos los datos que introduces en el formulario de contacto o en el registro: nombre, nombre de la clínica, email y teléfono. Si contratas el servicio, tratamos también los datos necesarios para la relación comercial y los datos de salud que la clínica introduce en la plataforma como responsable del tratamiento.",
        },
        {
          title: "Finalidad y base jurídica",
          text: "Usamos tus datos para responder a tu solicitud, gestionar la prueba y prestar el servicio contratado. La base jurídica es tu consentimiento, la ejecución de un contrato o nuestro interés legítimo en responder a consultas comerciales.",
        },
        {
          title: "Conservación",
          text: "Conservamos los datos de contacto mientras exista una relación comercial o durante el tiempo necesario para atender responsabilidades legales. Los datos de salud se conservan según la normativa aplicable y las instrucciones de la clínica responsable.",
        },
        {
          title: "Derechos",
          text: "Puedes solicitar acceso, rectificación, supresión, oposición, limitación y portabilidad de tus datos. También puedes presentar una reclamación ante la Agencia Española de Protección de Datos.",
        },
        {
          title: "Seguridad",
          text: "Aplicamos medidas técnicas y organizativas para proteger los datos: control de acceso por roles, aislamiento por clínica, cifrado en tránsito y copias de seguridad.",
        },
      ],
    },
    terms: {
      title: "Condiciones del servicio",
      updated: "Última actualización: 12 de noviembre de 2026",
      intro:
        "Estas condiciones regulan el uso de la web pública y de la prueba del servicio Dentistes. Las condiciones completas de la suscripción se facilitan antes de contratar.",
      sections: [
        {
          title: "Objeto",
          text: "Dentistes es una plataforma de gestión para clínicas dentales. La web pública permite informarse sobre el producto, solicitar una demo y empezar una prueba.",
        },
        {
          title: "Prueba y suscripción",
          text: "La prueba dura 30 días y se activa mediante Stripe Checkout sin ningún cargo durante el periodo de prueba. Si no cancelas antes del día 31, se inicia la suscripción mensual o anual elegida.",
        },
        {
          title: "Precios y pagos",
          text: "Los precios publicados son de referencia y no incluyen impuestos, salvo que se indique lo contrario. El precio aplicable es el que aparece en la propuesta o en el proceso de contratación.",
        },
        {
          title: "Cancelación",
          text: "No hay permanencia. Puedes cancelar en cualquier momento y exportar tus datos. El servicio se mantiene activo hasta el final del periodo ya pagado.",
        },
        {
          title: "Uso aceptable",
          text: "No está permitido usar la plataforma para actividades ilícitas, introducir código malicioso, intentar acceder a datos de otra clínica o revender el servicio sin autorización.",
        },
        {
          title: "Responsabilidad",
          text: "La clínica es responsable de la veracidad y legalidad de los datos que introduce. Dentistes presta el servicio con la diligencia debida y no sustituye el criterio clínico de los profesionales.",
        },
      ],
    },
    cookies: {
      title: "Cookies",
      updated: "Última actualización: 12 de noviembre de 2026",
      intro:
        "La web pública de Dentistes utiliza únicamente cookies y almacenamiento técnico necesarios para su funcionamiento. No utilizamos cookies publicitarias ni de perfilado.",
      sections: [
        {
          title: "Qué son las cookies",
          text: "Las cookies son pequeños archivos que un sitio web guarda en tu dispositivo. También pueden utilizarse tecnologías similares, como el almacenamiento local.",
        },
        {
          title: "Cookies que utilizamos",
          text: "Usamos almacenamiento técnico para recordar preferencias básicas, como el idioma o el estado de un formulario. No instalamos cookies de publicidad, redes sociales o analítica de terceros en esta web.",
        },
        {
          title: "Cómo desactivarlas",
          text: "Puedes borrar o bloquear las cookies desde la configuración de tu navegador. Si bloqueas el almacenamiento técnico, algunas funciones de la web pueden no funcionar correctamente.",
        },
        {
          title: "Cambios",
          text: "Si incorporamos cookies analíticas o de marketing, actualizaremos esta página y solicitaremos el consentimiento cuando sea necesario.",
        },
      ],
    },
  },
  blog: {
    indexTitle: "Guías para gestionar mejor tu clínica dental",
    indexIntro:
      "Contenido práctico sobre precios, migración, agenda y operaciones. Sin humo y sin demos de 40 minutos.",
    featured: "Destacado",
    all: "Todos los artículos",
    read: "Leer artículo",
    minRead: "min de lectura",
    published: "Publicado",
    updated: "Actualizado",
    author: "Autor",
    related: "También te puede interesar",
    back: "Volver al blog",
    ctaTitle: "¿Quieres verlo en tu clínica?",
    ctaText: "Prueba el paquete base durante 30 días (0 $ hoy con Stripe).",
    ctaLabel: "Empezar prueba",
    category: "Categoría",
  },
  notFound: {
    title: "Esta página no existe",
    text: "Puede que el enlace esté mal o que la página se haya movido. Vuelve al inicio o prueba el blog.",
    cta: "Volver al inicio",
  },
  common: {
    skip: "Saltar al contenido",
    trialBadge: "30 días de prueba",
    noCard: "0 $ hoy con Stripe",
    setup: "0 $ de alta",
    migration: "Migración asistida",
    vat: "IVA no incluido",
    month: "/mes",
    year: "/año",
    free: "Gratis",
    optional: "Opcional",
    included: "Incluido",
    consult: "Consúltanos",
    from: "Desde",
  },
};
