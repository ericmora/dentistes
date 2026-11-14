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
    eyebrow: "De dentista a dentista · Gestión clínica sin complicaciones",
    h1a: "Más tiempo en sillón.",
    h1b: "Cero sorpresas en la factura.",
    intro:
      "El software dental más fácil, seguro y económico para tu clínica. Agenda multigabinete, odontograma, historial y facturación en una sola pantalla. Todo tu equipo dentro por 18,50 $ USD/mes.",
    ctaPrimary: "Empieza la prueba de 30 días",
    ctaSecondary: "Ver cómo funciona",
    trust: ["30 días gratis (0 $ hoy)", "0 $ de alta", "Pasamos tus datos gratis", "Tus historiales a salvo en la UE"],
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
    index: "01 / El día a día",
    title: "Tu clínica no debería pagar un dineral ni perder tiempo entre paciente y paciente",
    intro:
      "Si alguna vez has sentido que trabajas para pagar el software o que pierdes media hora al día peleándote con ventanas y clics interminables, esto está hecho para ti.",
    points: [
      {
        title: "Pierdes tiempo valioso entre visitas",
        text: "Programas lentos con mil menús escondidos. Tienes que apuntar el diagnóstico en un sitio, picar el presupuesto en otro y avisar a recepción a voces.",
      },
      {
        title: "Te cobran como si fueras una franquicia",
        text: "En cuanto entra un higienista o abres otro gabinete, te cobran otra licencia. Acabas pagando 300 $ o más al mes por hacer lo básico.",
      },
      {
        title: "Miedo a perder historiales o quedarte atrapado",
        text: "Si falla el ordenador de recepción o entra un virus, tiemblas. Y si quieres cambiar de software, te ponen mil trabas para llevarte tus pacientes.",
      },
    ],
    footnote: "La solución es sencilla: un programa rápido que cualquier doctor o recepcionista entiende en 5 minutos, por 18,50 $ USD al mes todo incluido.",
  },
  product: {
    index: "02 / Tu jornada en una pantalla",
    title: "Todo el flujo clínico, sin cambiar de ventana",
    intro: "Pensado para el ritmo real de una clínica dental: abres la ficha y lo tienes todo delante para atender al paciente y pasar a la siguiente visita.",
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
    title: "La diferencia se ve en tu bolsillo a fin de mes",
    intro:
      "Ejemplo real de una clínica de 4 personas (2 doctores, 1 higienista y recepción). Con otros programas pagas por cada puesto; con Dentistes pagas una tarifa plana única por clínica.",
    traditional: {
      label: "Software tradicional por usuario",
      lines: [
        { label: "4 puestos × 75 $ (doctores, higienista y recepción)", value: "300 $/mes" },
        { label: "Nuevo doctor que entra a la clínica", value: "+75 $/mes" },
        { label: "Instalación y copias locales", value: "Aparte" },
      ],
      totalLabel: "Lo que pagas cada mes",
      total: "300 $/mes",
    },
    dentistes: {
      label: "Dentistes · Todo incluido",
      lines: [
        { label: "Tarifa plana única para toda la clínica", value: "18,50 $/mes" },
        { label: "Doctores, higienistas, recepción y gabinetes", value: "Ilimitados (0 $)" },
        { label: "Copias diarias, VeriFactu QR y migración", value: "Incluido (0 $)" },
      ],
      totalLabel: "Total real al mes",
      total: "18,50 $/mes",
    },
    saving: "Ahorras 281,50 $/mes",
    note: "Precio único global de 18,50 $ USD/mes por clínica. Sin cuotas ocultas, sin módulos obligatorios ni penalizaciones cuando crece tu equipo.",
  },
  whatsapp: {
    index: "04 / Tiempo que recuperas",
    title: "Menos administración, más tiempo para atender pacientes",
    intro:
      "Cada minuto entre visitas cuenta. Dentistes está diseñado para que termines la consulta con el odontograma, el historial y el presupuesto listos, sin llevarte trabajo a casa.",
    bullets: [
      "Del odontograma al presupuesto en 1 clic",
      "Alertas médicas en rojo antes de sentar al paciente",
      "Lista de espera que cubre cancelaciones en segundos",
      "Agenda sincronizada entre gabinete y recepción",
    ],
    phone: {
      title: "Dentistes · Recepción",
      status: "Hueco cubierto en 2 min",
      messages: [
        { from: "clinic", text: "Hola, Anna. Se ha liberado un hueco mañana a las 10:30 en el gabinete 2. ¿Te va bien venir?", time: "17:42" },
        { from: "patient", text: "¡Sí! Me viene perfecto.", time: "17:43" },
        { from: "clinic", text: "Anotada. Te esperamos mañana a las 10:30.", time: "17:43" },
        { from: "patient", text: "Gracias, hasta mañana.", time: "17:45" },
      ],
      note: "La lista de espera prioriza automáticamente por urgencia clínica y disponibilidad para que nunca pierdas una hora de sillón.",
    },
    addon: "Más de 5 horas ahorradas a la semana por clínica",
    cta: "Ver tarifa única de 18,50 $",
  },
  security: {
    index: "05 / Seguridad y tranquilidad",
    title: "Duerme tranquilo: tus historiales médicos están a salvo de averías, virus e inspecciones",
    intro:
      "Trabajas con datos de salud todos los días. Hemos diseñado Dentistes para proteger tu clínica sin que necesites ser informático ni contratar mantenimiento externo.",
    points: [
      {
        title: "A salvo de virus y ordenadores rotos",
        text: "Si falla el PC de recepción o entra un ransomware, no pierdes ni un historial. Todo se guarda con copias diarias automáticas fuera de la clínica.",
      },
      {
        title: "Cada puesto ve solo lo que necesita",
        text: "Recepción da citas y cobra sin acceder a notas médicas privadas; el dentista y el higienista trabajan en la ficha clínica completa.",
      },
      {
        title: "Cumplimiento RGPD y datos en Europa",
        text: "Todos tus expedientes clínicos se alojan dentro de la Unión Europea cumpliendo la normativa sanitaria para evitar sanciones.",
      },
      {
        title: "Facturas listas para VeriFactu y TicketBAI",
        text: "Presupuestos y facturas con código QR y registro inalterable para cumplir con Hacienda sin pagar programas aparte.",
      },
      {
        title: "Sabes quién tocó qué y cuándo",
        text: "Si alguien modifica una cita o registra un cobro, queda constancia para que en la clínica no haya malentendidos ni descuadres.",
      },
      {
        title: "Tus pacientes son tuyos, sin secuestros",
        text: "No hay permanencia. Si algún día quieres cambiar de programa, exportas todos tus historiales y datos sin trabas ni letra pequeña.",
      },
    ],
    diagram: {
      clinic: "En tu clínica",
      clinicSub: "PC, Mac o tablet · Sin instalar",
      api: "Acceso por puesto",
      apiSub: "Doctor, higienista y recepción",
      db: "Caja fuerte en la UE",
      dbSub: "Copias diarias automáticas",
      label: "Protección real para tu clínica",
      badges: ["Copias diarias", "Cumplimiento RGPD", "Acceso por puesto", "Exportación libre", "VeriFactu / QR"],
    },
    note: "No necesitas servidores en un armario ni pagar a un informático cada mes. De la seguridad nos encargamos nosotros para que tú solo te ocupes de tus pacientes.",
  },
  pricing: {
    index: "06 / Precios",
    title: "Un solo precio. Todo tu equipo incluido.",
    intro:
      "18,50 $ USD al mes por clínica. Sin coste de alta, sin permanencia y sin cobrar por usuario ni por gabinete.",
    monthly: "Mensual",
    annual: "Anual",
    annualNote: "2 meses gratis",
    perMonth: "/mes",
    perYear: "/año",
    billed: "Facturado anualmente",
    globalLabel: "Tarifa plana global · USD",
    baseName: "Paquete Base Esencial",
    baseDescription: "Todo lo que necesita tu clínica para trabajar desde el primer día: agenda, odontograma, historial, lista de espera y facturación.",
    included: "Incluido",
    features: [
      "Agenda multigabinete en tiempo real",
      "Odontograma interactivo de 32 piezas",
      "Historial clínico con alertas médicas",
      "Presupuestos y facturas con QR (VeriFactu)",
      "Lista de espera para cubrir huecos",
      "Usuarios, doctores y pacientes ilimitados",
      "Migración de datos asistida (0 $)",
      "Soporte en español y catalán",
      "Copias de seguridad diarias automáticas",
      "Datos alojados en la UE (RGPD)",
    ],
    addonsTitle: "Todo incluido desde el primer día",
    addonsNote: "No creemos en los módulos escondidos ni en cobrarte un extra por cada persona que trabaja contigo.",
    addons: {
      whatsapp: {
        name: "Equipo y gabinetes ilimitados",
        description: "Añade a todos tus doctores, higienistas y recepción sin pagar un dólar más al mes.",
      },
      signature: {
        name: "Pasamos tus datos gratis",
        description: "Nos encargamos de migrar tus pacientes e historiales desde tu programa actual sin coste.",
      },
      pack: {
        name: "30 días de prueba sin riesgo",
        description: "Úsalo con pacientes reales durante un mes entero. 0 $ hoy con Stripe y cancela cuando quieras.",
      },
    },
    packNote: "Sin permanencia. Tu información es tuya y la exportas en 1 clic.",
    cta: "Empieza la prueba de 30 días",
    footnote: "Precio único global en USD (impuestos no incluidos). Prueba de 30 días sin cargo hoy con Stripe. El plan anual equivale a 10 meses (185 $ USD/año).",
  },
  comparison: {
    index: "07 / Comparativa",
    title: "Lo que cambia con Dentistes",
    intro:
      "Una comparación directa frente a los programas dentales de toda la vida.",
    columns: ["Dentistes", "Software tradicional"],
    rows: [
      { label: "Precio", dentistes: "18,50 $ por clínica", other: "Por usuario o por gabinete" },
      { label: "Doctores e higienistas", dentistes: "Ilimitados", other: "De pago por cada alta" },
      { label: "Pacientes", dentistes: "Ilimitados", other: "Límites por tramo" },
      { label: "Alta y migración", dentistes: "0 $ + asistida", other: "Coste elevado de instalación" },
      { label: "Permanencia", dentistes: "Sin permanencia", other: "12–24 meses habituales" },
      { label: "Facturación con QR", dentistes: "Incluida", other: "Módulo aparte" },
      { label: "Seguridad y copias", dentistes: "Copias diarias en la UE (RGPD)", other: "Riesgo en servidor local" },
    ],
    note: "Comparación basada en el estándar habitual de licencias por puesto del mercado dental.",
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
        q: "¿Dónde se guardan los datos de mis pacientes?",
        a: "En servidores dentro de la Unión Europea cumpliendo la normativa RGPD. Cada clínica tiene su espacio totalmente aislado, cada persona entra con su propio permiso según su puesto y hacemos copias de seguridad automáticas todos los días.",
      },
      {
        q: "¿Hay que instalar algún programa?",
        a: "No. Dentistes funciona en cualquier ordenador, Mac o tablet desde el navegador. No hace falta instalar nada ni tener un servidor en la clínica.",
      },
      {
        q: "¿Qué pasa si quiero cancelar?",
        a: "No hay permanencia. Puedes cancelar en cualquier momento y exportar todos los historiales y pacientes de tu clínica sin penalizaciones.",
      },
      {
        q: "¿Tengo que pagar módulos extra por facturación o por más doctores?",
        a: "No. Todo el software esencial está incluido en la tarifa plana de 18,50 $ USD/mes por clínica: usuarios ilimitados, gabinetes ilimitados, agenda, odontograma, historial clínico, lista de espera y facturación con QR.",
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
