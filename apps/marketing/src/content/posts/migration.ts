import type { Post } from "./types";

export const migration: Post = {
  id: "migration",
  slug: {
    es: "migrar-datos-clinica-dental-sin-perder-pacientes",
    en: "migrate-dental-clinic-data-without-losing-patients",
    ca: "migrar-dades-clinica-dental-sense-perdre-pacients",
  },
  title: {
    es: "Cómo migrar los datos de una clínica dental sin perder pacientes",
    en: "How to migrate dental clinic data without losing patients",
    ca: "Com migrar les dades d'una clínica dental sense perdre pacients",
  },
  seoTitle: {
    es: "Migrar datos de una clínica dental sin perder pacientes",
    en: "Migrate dental clinic data without losing patients",
    ca: "Migrar dades d'una clínica dental sense perdre pacients",
  },
  description: {
    es: "Plan práctico para cambiar de software dental: qué migrar, cómo validar historiales, qué comunicar al equipo y cómo evitar duplicados y citas perdidas.",
    en: "A practical plan for changing dental software: what to migrate, how to validate records, what to tell the team and how to avoid duplicates and lost appointments.",
    ca: "Pla pràctic per canviar de programari dental: què migrar, com validar historials, què comunicar a l'equip i com evitar duplicats i cites perdudes.",
  },
  excerpt: {
    es: "Cambiar de software no es copiar una base de datos. Es un proyecto con responsables, pruebas y un plan B.",
    en: "Changing software is not copying a database. It is a project with owners, tests and a fallback plan.",
    ca: "Canviar de programari no és copiar una base de dades. És un projecte amb responsables, proves i un pla B.",
  },
  date: "2026-11-12",
  updated: "2026-11-12",
  category: { es: "Migración", en: "Migration", ca: "Migració" },
  readingTime: { es: "6 min", en: "6 min", ca: "6 min" },
  cover: "/images/blog/migration.webp",
  coverAlt: {
    es: "Proceso de migración de historiales dentales con validación de datos",
    en: "Dental record migration process with data validation",
    ca: "Procés de migració d'historials dentals amb validació de dades",
  },
  author: { es: "Equipo Dentistes", en: "Dentistes team", ca: "Equip Dentistes" },
  blocks: {
    es: [
      {
        type: "p",
        text: "La mayoría de las clínicas que cambian de software no tienen miedo de aprender una pantalla nueva. Tienen miedo de perder un historial, duplicar un paciente o descubrir en plena agenda que una cita no se ha pasado.",
      },
      {
        type: "p",
        text: "Ese miedo es razonable. Una migración no se resuelve con un export y un import. Se resuelve con un plan que define qué se mueve, quién lo valida y cuándo se apaga el sistema anterior.",
      },
      { type: "h2", text: "Qué hay que migrar de verdad", id: "que-migrar" },
      {
        type: "ul",
        items: [
          "Pacientes: datos identificativos, contacto, consentimientos y alertas médicas.",
          "Historiales: evoluciones, diagnósticos, tratamientos y documentos adjuntos.",
          "Citas: pasadas y futuras, con gabinete, profesional y estado.",
          "Presupuestos y facturas: importes, pagos y estado de cobro.",
          "Catálogo de tratamientos: nombres, códigos y precios.",
          "Usuarios y roles: quién puede ver qué desde el primer día.",
        ],
      },
      {
        type: "p",
        text: "No todo tiene el mismo valor. Un historial clínico incompleto es un problema asistencial. Un listado de facturas antiguas con un formato distinto es un problema contable. Prioriza lo primero y valida lo segundo por muestreo.",
      },
      { type: "h2", text: "El plan en cinco fases", id: "plan" },
      {
        type: "ol",
        items: [
          "Extraer: pide al proveedor actual una exportación completa en CSV o SQL, no capturas de pantalla.",
          "Limpiar: elimina duplicados, normaliza teléfonos y emails y separa pacientes inactivos de los que siguen en tratamiento.",
          "Mapear: decide qué campo del sistema antiguo va a qué campo del nuevo y qué se queda fuera.",
          "Probar: migra una muestra de 100 pacientes y revisa historiales, citas y facturas con recepción y un dentista.",
          "Cambiar: fija una fecha, congela escrituras en el sistema anterior y ten un plan B si algo falla.",
        ],
      },
      {
        type: "callout",
        title: "Regla práctica",
        text: "Si no puedes explicar en una hoja qué pasa con cada tipo de dato, todavía no estás listo para cambiar.",
      },
      { type: "h2", text: "Cómo comunicarlo al equipo", id: "equipo" },
      {
        type: "p",
        text: "El equipo no necesita un curso de 20 horas. Necesita saber qué cambia en su día a día y a quién preguntar. Haz una sesión corta por rol: recepción, dentistas e higienistas. Usa citas reales de la semana, no un paciente de ejemplo.",
      },
      {
        type: "p",
        text: "Durante la primera semana, deja una persona de referencia por turno. Si todo el mundo pregunta a la misma persona, esa persona no puede atender a pacientes. Y avisa a los pacientes con antelación si cambia el número de teléfono o el sistema de confirmación.",
      },
      { type: "h2", text: "Los errores que más se repiten", id: "errores" },
      {
        type: "ul",
        items: [
          "Migrar sin probar con una muestra y descubrir los problemas el primer lunes.",
          "No definir quién valida los historiales incompletos.",
          "Mantener los dos sistemas abiertos durante meses y duplicar citas.",
          "Perder los documentos adjuntos porque el proveedor solo exporta texto.",
          "No comunicar el cambio a los pacientes y generar llamadas innecesarias.",
          "No medir el resultado: citas perdidas, duplicados, tiempo de recepción.",
        ],
      },
      { type: "h2", text: "Checklist del día del cambio", id: "checklist" },
      {
        type: "ul",
        items: [
          "Exportación completa guardada y verificada.",
          "Muestra de 100 pacientes revisada por recepción y un dentista.",
          "Citas de la semana siguiente comprobadas una a una.",
          "Usuarios y roles creados antes de abrir la clínica.",
          "Plan B definido: qué hacer si el sistema nuevo no responde.",
          "Canal de soporte directo durante las primeras 48 horas.",
        ],
      },
      {
        type: "p",
        text: "Una buena migración no se nota. La clínica abre el lunes, la agenda funciona y nadie tiene que contar una historia de terror. Ese es el objetivo.",
      },
      {
        type: "cta",
        title: "Te acompañamos en la migración",
        text: "La prueba de 30 días incluye acompañamiento para pasar pacientes, historiales y citas. Sin coste de alta.",
        href: "/#contact",
        label: "Hablar con el equipo",
      },
    ],
    en: [
      {
        type: "p",
        text: "Most clinics that change software are not afraid of learning a new screen. They are afraid of losing a record, duplicating a patient or discovering during the schedule that an appointment was not migrated.",
      },
      {
        type: "p",
        text: "That fear is reasonable. A migration is not solved with an export and an import. It is solved with a plan that defines what moves, who validates it and when the old system is switched off.",
      },
      { type: "h2", text: "What actually needs to migrate", id: "what-to-migrate" },
      {
        type: "ul",
        items: [
          "Patients: identification, contact details, consent and medical alerts.",
          "Records: progress notes, diagnoses, treatments and attached documents.",
          "Appointments: past and future, with room, professional and status.",
          "Quotes and invoices: amounts, payments and collection status.",
          "Treatment catalogue: names, codes and prices.",
          "Users and roles: who can see what from day one.",
        ],
      },
      {
        type: "p",
        text: "Not everything has the same value. An incomplete clinical record is a care problem. A list of old invoices in a different format is an accounting problem. Prioritise the first and validate the second by sampling.",
      },
      { type: "h2", text: "The five-phase plan", id: "plan" },
      {
        type: "ol",
        items: [
          "Extract: ask the current provider for a full CSV or SQL export, not screenshots.",
          "Clean: remove duplicates, normalise phone numbers and emails and separate inactive patients from those still in treatment.",
          "Map: decide which field from the old system goes to which field in the new one and what stays behind.",
          "Test: migrate a sample of 100 patients and review records, appointments and invoices with reception and a dentist.",
          "Switch: set a date, freeze writes in the old system and keep a fallback plan if something fails.",
        ],
      },
      {
        type: "callout",
        title: "Rule of thumb",
        text: "If you cannot explain on one page what happens to each type of data, you are not ready to switch yet.",
      },
      { type: "h2", text: "How to communicate it to the team", id: "team" },
      {
        type: "p",
        text: "The team does not need a 20-hour course. It needs to know what changes in their day and who to ask. Run a short session per role: reception, dentists and hygienists. Use real appointments from the week, not a sample patient.",
      },
      {
        type: "p",
        text: "During the first week, leave one reference person per shift. If everyone asks the same person, that person cannot look after patients. And tell patients in advance if the phone number or confirmation system changes.",
      },
      { type: "h2", text: "The most common mistakes", id: "mistakes" },
      {
        type: "ul",
        items: [
          "Migrating without a sample test and discovering the problems on the first Monday.",
          "Not defining who validates incomplete records.",
          "Keeping both systems open for months and duplicating appointments.",
          "Losing attached documents because the provider only exports text.",
          "Not telling patients about the change and creating unnecessary calls.",
          "Not measuring the result: lost appointments, duplicates, reception time.",
        ],
      },
      { type: "h2", text: "Switch-day checklist", id: "checklist" },
      {
        type: "ul",
        items: [
          "Full export saved and verified.",
          "Sample of 100 patients reviewed by reception and a dentist.",
          "Next week's appointments checked one by one.",
          "Users and roles created before opening the clinic.",
          "Fallback plan defined: what to do if the new system does not respond.",
          "Direct support channel during the first 48 hours.",
        ],
      },
      {
        type: "p",
        text: "A good migration goes unnoticed. The clinic opens on Monday, the schedule works and nobody has to tell a horror story. That is the goal.",
      },
      {
        type: "cta",
        title: "We support you through the migration",
        text: "The 30-day trial includes support to move patients, records and appointments. No setup fee.",
        href: "/#contact",
        label: "Talk to the team",
      },
    ],
    ca: [
      {
        type: "p",
        text: "La majoria de les clíniques que canvien de programari no tenen por d'aprendre una pantalla nova. Tenen por de perdre un historial, duplicar un pacient o descobrir en plena agenda que una cita no s'ha passat.",
      },
      {
        type: "p",
        text: "Aquesta por és raonable. Una migració no es resol amb un export i un import. Es resol amb un pla que defineix què es mou, qui ho valida i quan s'apaga el sistema anterior.",
      },
      { type: "h2", text: "Què cal migrar de veritat", id: "que-migrar" },
      {
        type: "ul",
        items: [
          "Pacients: dades identificatives, contacte, consentiments i alertes mèdiques.",
          "Historials: evolucions, diagnòstics, tractaments i documents adjunts.",
          "Cites: passades i futures, amb gabinet, professional i estat.",
          "Pressupostos i factures: imports, pagaments i estat de cobrament.",
          "Catàleg de tractaments: noms, codis i preus.",
          "Usuaris i rols: qui pot veure què des del primer dia.",
        ],
      },
      {
        type: "p",
        text: "No tot té el mateix valor. Un historial clínic incomplet és un problema assistencial. Un llistat de factures antigues amb un format diferent és un problema comptable. Prioritza el primer i valida el segon per mostreig.",
      },
      { type: "h2", text: "El pla en cinc fases", id: "pla" },
      {
        type: "ol",
        items: [
          "Extreure: demana al proveïdor actual una exportació completa en CSV o SQL, no captures de pantalla.",
          "Netejar: elimina duplicats, normalitza telèfons i emails i separa pacients inactius dels que segueixen en tractament.",
          "Mapejar: decideix quin camp del sistema antic va a quin camp del nou i què es queda fora.",
          "Provar: migra una mostra de 100 pacients i revisa historials, cites i factures amb recepció i un dentista.",
          "Canviar: fixa una data, congela escriptures al sistema anterior i tingues un pla B si alguna cosa falla.",
        ],
      },
      {
        type: "callout",
        title: "Regla pràctica",
        text: "Si no pots explicar en un full què passa amb cada tipus de dada, encara no estàs llest per canviar.",
      },
      { type: "h2", text: "Com comunicar-ho a l'equip", id: "equip" },
      {
        type: "p",
        text: "L'equip no necessita un curs de 20 hores. Necessita saber què canvia en el seu dia a dia i a qui preguntar. Fes una sessió curta per rol: recepció, dentistes i higienistes. Usa cites reals de la setmana, no un pacient d'exemple.",
      },
      {
        type: "p",
        text: "Durant la primera setmana, deixa una persona de referència per torn. Si tothom pregunta a la mateixa persona, aquesta persona no pot atendre pacients. I avisa els pacients amb antelació si canvia el número de telèfon o el sistema de confirmació.",
      },
      { type: "h2", text: "Els errors que més es repeteixen", id: "errades" },
      {
        type: "ul",
        items: [
          "Migrar sense provar amb una mostra i descobrir els problemes el primer dilluns.",
          "No definir qui valida els historials incomplets.",
          "Mantenir els dos sistemes oberts durant mesos i duplicar cites.",
          "Perdre els documents adjunts perquè el proveïdor només exporta text.",
          "No comunicar el canvi als pacients i generar trucades innecessàries.",
          "No mesurar el resultat: cites perdudes, duplicats, temps de recepció.",
        ],
      },
      { type: "h2", text: "Checklist del dia del canvi", id: "checklist" },
      {
        type: "ul",
        items: [
          "Exportació completa guardada i verificada.",
          "Mostra de 100 pacients revisada per recepció i un dentista.",
          "Cites de la setmana següent comprovades una a una.",
          "Usuaris i rols creats abans d'obrir la clínica.",
          "Pla B definit: què fer si el sistema nou no respon.",
          "Canal de suport directe durant les primeres 48 hores.",
        ],
      },
      {
        type: "p",
        text: "Una bona migració no es nota. La clínica obre dilluns, l'agenda funciona i ningú no ha de contar una història de por. Aquest és l'objectiu.",
      },
      {
        type: "cta",
        title: "T'acompanyem en la migració",
        text: "La prova de 30 dies inclou acompanyament per passar pacients, historials i cites. Sense cost d'alta.",
        href: "/#contact",
        label: "Parlar amb l'equip",
      },
    ],
  },
  faq: {
    es: [
      {
        q: "¿Cuánto tarda una migración de software dental?",
        a: "Depende del volumen y de la calidad de los datos. Una clínica pequeña puede estar lista en dos o tres semanas si la exportación es limpia. Si hay historiales en papel o documentos adjuntos, el plazo se alarga.",
      },
      {
        q: "¿Puedo mantener el sistema antiguo en paralelo?",
        a: "Puedes mantenerlo como consulta durante unos días, pero no como sistema activo. Dos sistemas abiertos durante semanas generan duplicados y citas perdidas. Define una fecha de corte clara.",
      },
      {
        q: "¿Qué pasa con los documentos adjuntos?",
        a: "Hay que comprobar si el proveedor actual los exporta y en qué formato. Si solo exporta texto, los PDF e imágenes deben migrarse aparte y asociarse al paciente correcto.",
      },
    ],
    en: [
      {
        q: "How long does a dental software migration take?",
        a: "It depends on volume and data quality. A small clinic can be ready in two or three weeks if the export is clean. If there are paper records or attached documents, it takes longer.",
      },
      {
        q: "Can I keep the old system running in parallel?",
        a: "You can keep it for reference for a few days, but not as an active system. Two open systems for weeks create duplicates and lost appointments. Set a clear cut-off date.",
      },
      {
        q: "What happens to attached documents?",
        a: "Check whether the current provider exports them and in what format. If it only exports text, PDFs and images must be migrated separately and linked to the right patient.",
      },
    ],
    ca: [
      {
        q: "Quant triga una migració de programari dental?",
        a: "Depèn del volum i de la qualitat de les dades. Una clínica petita pot estar a punt en dues o tres setmanes si l'exportació és neta. Si hi ha historials en paper o documents adjunts, el termini s'allarga.",
      },
      {
        q: "Puc mantenir el sistema antic en paral·lel?",
        a: "El pots mantenir com a consulta durant uns dies, però no com a sistema actiu. Dos sistemes oberts durant setmanes generen duplicats i cites perdudes. Defineix una data de tall clara.",
      },
      {
        q: "Què passa amb els documents adjunts?",
        a: "Cal comprovar si el proveïdor actual els exporta i en quin format. Si només exporta text, els PDF i les imatges s'han de migrar a part i associar al pacient correcte.",
      },
    ],
  },
  related: ["choose-software", "cost"],
};
