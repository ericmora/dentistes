import type { Post } from "./types";

export const choose: Post = {
  id: "choose-software",
  slug: {
    es: "como-elegir-software-dental-clinica-independiente",
    en: "how-to-choose-dental-software-independent-clinic",
    ca: "com-triar-programari-dental-clinica-independent",
  },
  title: {
    es: "Cómo elegir un software dental para una clínica independiente",
    en: "How to choose dental software for an independent clinic",
    ca: "Com triar un programari dental per a una clínica independent",
  },
  seoTitle: {
    es: "Cómo elegir software dental para una clínica independiente",
    en: "How to choose dental software for an independent clinic",
    ca: "Com triar un programari dental per a una clínica independent",
  },
  description: {
    es: "Guía práctica para comparar software dental: coste real, migración, agenda, odontograma, soporte y propiedad de los datos. Sin demos de 40 minutos.",
    en: "A practical guide to comparing dental software: real cost, migration, scheduling, odontogram, support and data ownership. No 40-minute demos.",
    ca: "Guia pràctica per comparar programaris dentals: cost real, migració, agenda, odontograma, suport i propietat de les dades. Sense demos de 40 minuts.",
  },
  excerpt: {
    es: "Siete criterios para comparar software dental sin quedarte solo con la cuota de la primera pantalla.",
    en: "Seven criteria for comparing dental software without judging it by the first price you see.",
    ca: "Set criteris per comparar programaris dentals sense quedar-te només amb la quota de la primera pantalla.",
  },
  date: "2026-11-12",
  updated: "2026-11-12",
  category: {
    es: "Gestión de clínica",
    en: "Clinic management",
    ca: "Gestió de clínica",
  },
  readingTime: { es: "6 min", en: "6 min", ca: "6 min" },
  cover: "/images/blog/choose.webp",
  coverAlt: {
    es: "Comparación de software dental con agenda, odontograma y facturación",
    en: "Dental software comparison with scheduling, odontogram and billing",
    ca: "Comparació de programari dental amb agenda, odontograma i facturació",
  },
  author: { es: "Equipo Dentistes", en: "Dentistes team", ca: "Equip Dentistes" },
  blocks: {
    es: [
      {
        type: "p",
        text: "Un buen software dental no es el que tiene más funciones. Es el que la recepción usa cada día sin llamar a nadie, el que el dentista abre entre dos pacientes y el que no te obliga a pagar una licencia nueva cada vez que contratas un auxiliar.",
      },
      {
        type: "p",
        text: "Esta guía no compara marcas. Compara decisiones. Son las preguntas que deberías hacerte antes de firmar un contrato de software para una clínica independiente.",
      },
      { type: "h2", text: "1. Calcula el coste total, no la cuota inicial", id: "coste-total" },
      {
        type: "p",
        text: "La cuota de la página web suele ser el precio de un usuario, de un módulo o de un plan que no incluye lo que necesitas. Antes de decidir, suma lo que pagarás cuando la clínica tenga tres, cinco u ocho personas.",
      },
      {
        type: "p",
        text: "Si un sistema cobra 75 € por usuario y mes y tres personas acceden, la factura es de 225 €/mes antes de añadir WhatsApp o firma digital. Con una cuota plana por clínica, el coste no cambia cuando crece el equipo. Puedes ver cómo lo calculamos en [nuestra página de precios](/#pricing).",
      },
      { type: "h2", text: "2. Prueba la agenda con tu equipo real", id: "agenda" },
      {
        type: "p",
        text: "Una demo con el comercial no es una prueba. Siéntate con la recepcionista y un dentista y haced una semana de citas simulada. Mirad si pueden ver varios gabinetes a la vez, mover una cita sin perder el historial y confirmar un recordatorio sin salir de la pantalla.",
      },
      {
        type: "p",
        text: "La agenda es la pieza que más se toca al día. Si es lenta, el resto del software da igual. Si no tiene vista multigabinete, la recepción acabará haciendo llamadas para saber si el gabinete 2 está libre.",
      },
      { type: "h2", text: "3. Mira el odontograma como lo usará el dentista", id: "odontograma" },
      {
        type: "p",
        text: "El odontograma no es un dibujo decorativo. Debe permitir marcar piezas, caras y estados, y conectar el diagnóstico con el presupuesto. Haz una restauración, una extracción y un tratamiento planificado en la misma boca. Después comprueba si el presupuesto refleja los tratamientos sin volver a escribirlos.",
      },
      { type: "h2", text: "4. Pregunta por la migración antes de firmar", id: "migracion" },
      {
        type: "p",
        text: "Cambiar de software no es instalar una aplicación. Es trasladar pacientes, historiales, citas, presupuestos y facturas sin perder información ni duplicar registros. Pide un plan concreto, no una promesa de que lo pasarán todo.",
      },
      {
        type: "ol",
        items: [
          "¿Qué formato exporta el proveedor actual: CSV, SQL, PDF o solo pantallas?",
          "¿Quién limpia los duplicados y valida los campos obligatorios?",
          "¿Cuánto tiempo convivirán los dos sistemas?",
          "¿Quién responde si una historia clínica llega incompleta?",
          "¿Puedes probar con una muestra de 100 pacientes antes del cambio definitivo?",
        ],
      },
      { type: "h2", text: "5. Comprueba dónde están los datos y quién accede", id: "datos" },
      {
        type: "p",
        text: "Las datos de una clínica dental son datos de salud. No basta con un candado en la página web. Necesitas saber dónde se alojan, cómo se aíslan los datos de cada clínica, qué roles pueden ver la historia clínica y cómo se registran los accesos. Pregunta también si podrás exportar tus datos el día que quieras marcharte.",
      },
      { type: "h2", text: "6. Valora el soporte en tu idioma y en tu horario", id: "soporte" },
      {
        type: "p",
        text: "Cuando la recepción no puede confirmar una cita y el teléfono no para de sonar, no quieres un formulario que responde en 48 horas. Quieres alguien que entienda la clínica y conteste durante el horario de consulta. Prueba el soporte antes de ser cliente: envía una pregunta concreta y mira cuánto tarda en llegar una respuesta útil.",
      },
      { type: "h2", text: "Checklist antes de decidir", id: "checklist" },
      {
        type: "ul",
        items: [
          "He calculado el coste con el número real de personas que usarán el sistema.",
          "He probado la agenda con recepción y con un dentista.",
          "He hecho un odontograma completo y he comprobado que genera presupuesto.",
          "Tengo un plan de migración con responsables, plazos y validación.",
          "Sé dónde se alojan los datos y cómo puedo exportarlos.",
          "He leído las condiciones de permanencia y de subida de precio.",
        ],
      },
      {
        type: "cta",
        title: "¿Quieres ver cómo lo resolvemos nosotros?",
        text: "Dentistes es una cuota plana de 18,50 $ USD/mes por clínica, con usuarios y pacientes ilimitados. La prueba dura 30 días (0 $ hoy al activar con Stripe).",
        href: "/#pricing",
        label: "Ver precios y prueba",
      },
    ],
    en: [
      {
        type: "p",
        text: "Good dental software is not the one with the most features. It is the one reception uses every day without calling anyone, the one the dentist opens between two patients and the one that does not charge a new licence every time you hire an assistant.",
      },
      {
        type: "p",
        text: "This guide does not compare brands. It compares decisions. These are the questions you should ask before signing a software contract for an independent clinic.",
      },
      { type: "h2", text: "1. Calculate the total cost, not the first price", id: "total-cost" },
      {
        type: "p",
        text: "The price on the website is often for one user, one module or a plan that does not include what you need. Before deciding, add up what you will pay when the clinic has three, five or eight people.",
      },
      {
        type: "p",
        text: "If a system charges €75 per user per month and three people need access, the bill is €225/month before WhatsApp or digital signature. With a flat fee per clinic, the cost does not change as the team grows. You can see how we calculate it on [our pricing page](/#pricing).",
      },
      { type: "h2", text: "2. Test the schedule with your real team", id: "schedule" },
      {
        type: "p",
        text: "A demo with the salesperson is not a test. Sit down with reception and a dentist and run a simulated week of appointments. Check whether they can see several rooms at once, move an appointment without losing the record and confirm a reminder without leaving the screen.",
      },
      {
        type: "p",
        text: "The schedule is the part your team touches most. If it is slow, the rest of the software does not matter. If it has no multi-room view, reception will end up calling to ask whether room 2 is free.",
      },
      { type: "h2", text: "3. Look at the odontogram the way the dentist will use it", id: "odontogram" },
      {
        type: "p",
        text: "The odontogram is not a decorative drawing. It must let you mark teeth, surfaces and states, and connect the diagnosis to the quote. Do a filling, an extraction and a planned treatment on the same mouth. Then check whether the quote reflects the treatments without typing them again.",
      },
      { type: "h2", text: "4. Ask about migration before signing", id: "migration" },
      {
        type: "p",
        text: "Changing software is not installing an app. It means moving patients, records, appointments, quotes and invoices without losing information or duplicating records. Ask for a concrete plan, not a promise that everything will be transferred.",
      },
      {
        type: "ol",
        items: [
          "What format does the current provider export: CSV, SQL, PDF or only screens?",
          "Who cleans duplicates and validates required fields?",
          "How long will the two systems run in parallel?",
          "Who is responsible if a clinical record arrives incomplete?",
          "Can you test with a sample of 100 patients before the final switch?",
        ],
      },
      { type: "h2", text: "5. Check where the data lives and who can access it", id: "data" },
      {
        type: "p",
        text: "Dental clinic data is health data. A padlock on the website is not enough. You need to know where it is hosted, how each clinic's data is isolated, which roles can see the clinical record and how access is logged. Also ask whether you can export your data the day you decide to leave.",
      },
      { type: "h2", text: "6. Value support in your language and your hours", id: "support" },
      {
        type: "p",
        text: "When reception cannot confirm an appointment and the phone will not stop ringing, you do not want a form that answers in 48 hours. You want someone who understands the clinic and replies during consultation hours. Test support before becoming a customer: send a specific question and see how long a useful answer takes.",
      },
      { type: "h2", text: "Checklist before deciding", id: "checklist" },
      {
        type: "ul",
        items: [
          "I have calculated the cost with the real number of people who will use the system.",
          "I have tested the schedule with reception and with a dentist.",
          "I have completed an odontogram and checked that it generates a quote.",
          "I have a migration plan with owners, deadlines and validation.",
          "I know where the data is hosted and how I can export it.",
          "I have read the commitment and price-increase terms.",
        ],
      },
      {
        type: "cta",
        title: "Want to see how we solve it?",
        text: "Dentistes is a flat $18.50 USD/month per clinic, with unlimited users and patients. The trial lasts 30 days ($0 today when activating via Stripe).",
        href: "/#pricing",
        label: "See pricing and trial",
      },
    ],
    ca: [
      {
        type: "p",
        text: "Un bon programari dental no és el que té més funcions. És el que la recepció fa servir cada dia sense trucar a ningú, el que el dentista obre entre dos pacients i el que no t'obliga a pagar una llicència nova cada vegada que contractes un auxiliar.",
      },
      {
        type: "p",
        text: "Aquesta guia no compara marques. Compara decisions. Són les preguntes que hauries de fer-te abans de signar un contracte de programari per a una clínica independent.",
      },
      { type: "h2", text: "1. Calcula el cost total, no la quota inicial", id: "cost-total" },
      {
        type: "p",
        text: "La quota que veus a la pàgina web acostuma a ser el preu d'un usuari, d'un mòdul o d'un pla que no inclou el que necessites. Abans de decidir, suma el que pagaràs quan la clínica tingui tres, cinc o vuit persones.",
      },
      {
        type: "p",
        text: "Si un sistema cobra 75 € per usuari i mes i tres persones hi accedeixen, la factura és de 225 €/mes abans d'afegir WhatsApp o signatura digital. Amb una quota plana per clínica, el cost no canvia quan creix l'equip. Pots veure com ho calculem a [la nostra pàgina de preus](/#pricing).",
      },
      { type: "h2", text: "2. Prova l'agenda amb el teu equip real", id: "agenda" },
      {
        type: "p",
        text: "Una demo amb el comercial no és una prova. Asseu-te amb la recepcionista i un dentista i feu una setmana de cites simulada. Mireu si poden veure diversos gabinets alhora, moure una cita sense perdre l'historial i confirmar un recordatori sense sortir de la pantalla.",
      },
      {
        type: "p",
        text: "L'agenda és la peça que més vegades es toca al dia. Si és lenta, la resta del programari dona igual. Si no té vista multigabinet, la recepció acabarà fent trucades per saber si el gabinet 2 és lliure.",
      },
      { type: "h2", text: "3. Mira l'odontograma com el farà servir el dentista", id: "odontograma" },
      {
        type: "p",
        text: "L'odontograma no és un dibuix decoratiu. Ha de permetre marcar peces, cares i estats, i connectar el diagnòstic amb el pressupost. Fes una restauració, una extracció i un tractament planificat en una mateixa boca. Després comprova si el pressupost reflecteix els tractaments sense tornar-los a escriure.",
      },
      { type: "h2", text: "4. Pregunta per la migració abans de signar", id: "migracio" },
      {
        type: "p",
        text: "Canviar de programari no és instal·lar una aplicació. És traslladar pacients, historials, cites, pressupostos i factures sense perdre informació ni duplicar registres. Demana un pla concret, no una promesa que ho passaran tot.",
      },
      {
        type: "ol",
        items: [
          "Quin format exporta el proveïdor actual: CSV, SQL, PDF o només pantalles?",
          "Qui neteja els duplicats i valida els camps obligatoris?",
          "Quant temps conviuran els dos sistemes?",
          "Qui respon si una història clínica arriba incompleta?",
          "Pots provar amb una mostra de 100 pacients abans del canvi definitiu?",
        ],
      },
      { type: "h2", text: "5. Comprova on són les dades i qui hi accedeix", id: "dades" },
      {
        type: "p",
        text: "Les dades d'una clínica dental són dades de salut. No n'hi ha prou amb un cadenat a la pàgina web. Necessites saber on s'allotgen, com s'aïllen les dades de cada clínica, quins rols poden veure l'historial i com es registren els accessos. Pregunta també si podràs exportar les teves dades el dia que vulguis marxar.",
      },
      { type: "h2", text: "6. Valora el suport en el teu idioma i en el teu horari", id: "suport" },
      {
        type: "p",
        text: "Quan la recepció no pot confirmar una cita i el telèfon no para de sonar, no vols un formulari que respon en 48 hores. Vols algú que entengui la clínica i contesti durant l'horari de consulta. Prova el suport abans de ser client: envia una pregunta concreta i mira quant triga a arribar una resposta útil.",
      },
      { type: "h2", text: "Checklist abans de decidir", id: "checklist" },
      {
        type: "ul",
        items: [
          "He calculat el cost amb el nombre real de persones que faran servir el sistema.",
          "He provat l'agenda amb recepció i amb un dentista.",
          "He fet un odontograma complet i he comprovat que genera pressupost.",
          "Tinc un pla de migració amb responsables, terminis i validació.",
          "Sé on s'allotgen les dades i com puc exportar-les.",
          "He llegit les condicions de permanència i de pujada de preu.",
        ],
      },
      {
        type: "cta",
        title: "Vols veure com ho resolem nosaltres?",
        text: "Dentistes és una quota plana de 18,50 $ USD/mes per clínica, amb usuaris i pacients il·limitats. La prova dura 30 dies (0 $ avui en activar amb Stripe).",
        href: "/#pricing",
        label: "Veure preus i prova",
      },
    ],
  },
  faq: {
    es: [
      {
        q: "¿Cuánto debería costar un software dental para una clínica pequeña?",
        a: "Depende del modelo. Los programas por usuario pueden sumar 225 $ o más al mes en una clínica de tres personas. Una cuota plana como la de Dentistes cuesta 18,50 $ USD/mes por clínica, con usuarios y pacientes ilimitados.",
      },
      {
        q: "¿Es mejor un software en la nube o instalado en el servidor de la clínica?",
        a: "Un software en la nube no requiere servidores locales, se actualiza solo y permite acceder desde cualquier gabinete. Aun así, comprueba dónde se alojan los datos, cómo se aíslan por clínica y qué copias de seguridad existen.",
      },
      {
        q: "¿Qué debo preguntar antes de migrar los datos?",
        a: "El formato de exportación, quién limpia los duplicados, cómo se validan los historiales, cuánto tiempo convivirán los dos sistemas y quién responde si un dato llega mal. Pide una prueba con una muestra antes del cambio definitivo.",
      },
    ],
    en: [
      {
        q: "How much should dental software cost for a small clinic?",
        a: "It depends on the model. Per-user software can add up to $225/month or more for a three-person clinic. A flat fee like Dentistes costs $18.50 USD/month per clinic, with unlimited users and patients.",
      },
      {
        q: "Is cloud software better than software installed on the clinic server?",
        a: "Cloud software requires no local servers, updates itself and lets you access it from any room. Still, check where data is hosted, how it is isolated per clinic and what backups exist.",
      },
      {
        q: "What should I ask before migrating data?",
        a: "The export format, who cleans duplicates, how records are validated, how long the two systems will run in parallel and who is responsible if a record arrives incomplete. Ask for a sample test before the final switch.",
      },
    ],
    ca: [
      {
        q: "Quant hauria de costar un programari dental per a una clínica petita?",
        a: "Depèn del model. Els programaris per usuari poden sumar 225 $ o més al mes en una clínica de tres persones. Una quota plana com la de Dentistes costa 18,50 $ USD/mes per clínica, amb usuaris i pacients il·limitats.",
      },
      {
        q: "És millor un programari al núvol o instal·lat al servidor de la clínica?",
        a: "Un programari al núvol no requereix servidors locals, s'actualitza sol i permet accedir-hi des de qualsevol gabinet. Cal comprovar igualment on s'allotgen les dades, com s'aïllen per clínica i quines còpies de seguretat existeixen.",
      },
      {
        q: "Què he de preguntar abans de migrar les dades?",
        a: "El format d'exportació, qui neteja els duplicats, com es validen els historials, quant temps conviuran els dos sistemes i qui respon si una dada arriba malament. Demana una prova amb una mostra abans del canvi definitiu.",
      },
    ],
  },
  related: ["cost", "migration"],
};
