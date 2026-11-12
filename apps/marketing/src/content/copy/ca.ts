import type { Copy } from "./types";

export const ca: Copy = {
  meta: {
    home: {
      title: "Dentistes — Programari de gestió dental per a clíniques independents",
      description:
        "Agenda multigabinet, odontograma, historial i facturació en una sola plataforma. 18,50 $ USD/mes per clínica, usuaris i pacients il·limitats. Prova 30 dies, 0 $ avui amb Stripe.",
    },
    blog: {
      title: "Blog per a clíniques dentals independents | Dentistes",
      description:
        "Guies pràctiques sobre gestió, preus, migració i operacions per a clíniques dentals independents. Contingut útil per decidir millor, sense fum.",
    },
    notFound: {
      title: "Pàgina no trobada | Dentistes",
      description: "La pàgina que busques no existeix o s'ha mogut.",
    },
  },
  nav: {
    product: "Producte",
    how: "Com funciona",
    pricing: "Preus",
    security: "Seguretat",
    blog: "Blog",
    login: "Entrar",
    trial: "Prova 30 dies",
    menu: "Obrir menú",
    close: "Tancar menú",
    language: "Idioma",
  },
  hero: {
    eyebrow: "Programari de gestió dental per a clíniques independents",
    h1a: "La teva clínica creix.",
    h1b: "La teva quota es manté.",
    intro:
      "Agenda multigabinet, odontograma, historial i facturació en una sola plataforma. Una quota plana per clínica, tot l'equip dins i menys feina administrativa.",
    ctaPrimary: "Comença la prova de 30 dies",
    ctaSecondary: "Veure com funciona",
    trust: ["0 $ avui amb Stripe", "0 $ d'alta", "Migració assistida", "Dades a la UE"],
    panel: {
      title: "Agenda / dimarts",
      subtitle: "3 gabinets · 12 cites",
      live: "En directe",
      cabinets: ["Gabinets 1", "Gabinets 2", "Gabinets 3"],
      appointments: [
        {
          time: "09:00",
          name: "Anna P.",
          treatment: "Neteja",
          cabinet: "Gabinets 1",
          status: "Confirmada",
          tone: "confirmed",
        },
        {
          time: "09:30",
          name: "Marc R.",
          treatment: "Endodòncia",
          cabinet: "Gabinets 2",
          status: "A la cadira",
          tone: "chair",
        },
        {
          time: "10:15",
          name: "Laia M.",
          treatment: "Revisió",
          cabinet: "Gabinets 1",
          status: "Confirmada",
          tone: "confirmed",
        },
        {
          time: "10:30",
          name: "Jordi S.",
          treatment: "Primera visita",
          cabinet: "Gabinets 3",
          status: "Pendent",
          tone: "pending",
        },
        {
          time: "11:00",
          name: "Nuria B.",
          treatment: "Obturació",
          cabinet: "Gabinets 2",
          status: "Confirmada",
          tone: "confirmed",
        },
      ],
      free: "3 franges lliures",
      whatsapp: "WhatsApp confirmat",
      footer: "Arrossega una cita. La franja s'actualitza als tres gabinets.",
    },
  },
  proof: {
    items: [
      { value: "18,50 $", label: "USD per clínica i mes" },
      { value: "∞", label: "usuaris i pacients" },
      { value: "30", label: "dies de prova" },
      { value: "0 $", label: "de cost d'alta" },
    ],
    note: "Tarifa plana global en USD. Impostos no inclosos.",
  },
  problem: {
    index: "01 / El problema",
    title: "El programari no hauria de castigar el creixement de la teva clínica",
    intro:
      "Quan cada persona nova costa una llicència més, l'equip creix i el marge no. Quan el sistema obliga a saltar entre mòduls, la recepció perd temps i el dentista també.",
    points: [
      {
        title: "Pagues per persona",
        text: "El preu puja amb cada incorporació i acabes decidint qui entra al sistema i qui no.",
      },
      {
        title: "Mòduls que se sumen",
        text: "WhatsApp, signatura, recordatoris o informes es cobren a part. La factura final no s'assembla a la inicial.",
      },
      {
        title: "Dades difícils de moure",
        text: "Si canviar de proveïdor fa por, no és perquè sigui fàcil: és perquè el proveïdor no t'ho posa fàcil.",
      },
    ],
    footnote: "La nostra proposta és senzilla: una quota plana per clínica i un producte que es fa servir cada dia.",
  },
  product: {
    index: "02 / Producte",
    title: "Tot el flux clínic, en una sola pantalla",
    intro: "Sense finestres emergents, sense exportar a Excel i sense buscar l'historial en una altra pestanya.",
    modules: [
      {
        id: "agenda",
        title: "Agenda multigabinet",
        text: "Veus tots els gabinets alhora, mous una cita sense solapar i confirmes per WhatsApp des de la mateixa pantalla.",
        bullets: ["Vista per gabinet i professional", "Reprogramació amb validació", "Recordatoris i confirmacions"],
      },
      {
        id: "odontograma",
        title: "Odontograma interactiu",
        text: "32 peces, cinc cares per dent i estats clars. Del diagnòstic al pressupost sense tornar-ho a escriure.",
        bullets: ["Estats per cara", "Adult i infantil", "Pressupost connectat"],
      },
      {
        id: "historial",
        title: "Historial amb alertes",
        text: "Evolucions, diagnòstics i alertes mèdiques en una fitxa que recepció i dentista poden llegir segons el seu rol.",
        bullets: ["Alertes visibles", "Permisos per rol", "Registre d'accessos"],
      },
      {
        id: "facturacion",
        title: "Facturació amb QR",
        text: "Pressupostos i factures verificables, pagaments parcials i cobrament per sessió. Sense calcular impostos a mà.",
        bullets: ["PDF amb QR", "Pagaments parcials", "Estat de cobrament"],
      },
      {
        id: "espera",
        title: "Llista d'espera dinàmica",
        text: "Quan es cancel·la una cita, el sistema et diu a qui trucar segons urgència, disponibilitat i compatibilitat.",
        bullets: ["Prioritat clínica", "Disponibilitat real", "Cobertura de franges"],
      },
    ],
  },
  odontogram: {
    title: "Odontograma interactiu",
    hint: "Toca una cara dental per canviar-ne l'estat. Així es documenta un diagnòstic en segons.",
    states: {
      healthy: "Sana",
      caries: "Càries",
      restored: "Restaurada",
      planned: "Planificada",
      missing: "Absent",
    },
    selected: "Seleccionat",
    reset: "Reiniciar",
    tooth: "Peça",
  },
  receipt: {
    index: "03 / El compte clar",
    title: "La diferència es veu a la factura",
    intro:
      "Exemple il·lustratiu amb 4 persones i una quota de mercat de 75 $ USD per usuari. Els preus de cada proveïdor varien; el que no varia és la lògica.",
    traditional: {
      label: "Programari per usuari",
      lines: [
        { label: "4 usuaris × 75 $", value: "300 $/mes" },
        { label: "WhatsApp", value: "+20 $/mes" },
        { label: "Signatura digital", value: "+10 $/mes" },
      ],
      totalLabel: "Total orientatiu",
      total: "330 $/mes",
    },
    dentistes: {
      label: "Dentistes",
      lines: [
        { label: "Quota plana per clínica", value: "18,50 $/mes" },
        { label: "WhatsApp", value: "+20 $/mes" },
        { label: "Signatura digital", value: "+10 $/mes" },
      ],
      totalLabel: "Total amb els mateixos add-ons",
      total: "48,50 $/mes",
    },
    saving: "281,50 $/mes de diferència",
    note: "Càlcul il·lustratiu, no és una oferta de tercers. Els preus de cada proveïdor poden variar segons mòduls i volum.",
  },
  whatsapp: {
    index: "04 / WhatsApp",
    title: "La conversa que evita una trucada",
    intro:
      "Un agent respon confirmacions i reprogramacions. Si hi ha un dubte clínic, deriva a recepció amb tot el context.",
    bullets: [
      "Confirmacions i recordatoris",
      "Reprogramació en llenguatge natural",
      "Derivació a una persona",
      "Consentiment i traçabilitat",
    ],
    phone: {
      title: "Dentistes · Recepció",
      status: "Agent actiu",
      messages: [
        { from: "clinic", text: "Hola, Anna. T'esperem demà a les 10:30 al gabinet 2. Confirmes?", time: "17:42" },
        { from: "patient", text: "Sí, confirmo.", time: "17:43" },
        { from: "clinic", text: "Perfecte. Si necessites canviar-la, respon a aquest missatge.", time: "17:43" },
        { from: "patient", text: "Millor dijous a la tarda.", time: "17:45" },
        { from: "clinic", text: "Et puc oferir dijous a les 17:00 o divendres a les 9:30.", time: "17:45" },
      ],
      note: "Si la conversa es complica, recepció rep el context i pren el control.",
    },
    addon: "Add-on: 20 $ USD/mes",
    cta: "Veure preus i add-ons",
  },
  security: {
    index: "05 / Seguretat",
    title: "Dades de salut, amb la cura que exigeix el sector",
    intro:
      "Dentistes està dissenyat per a clíniques que treballen amb historials mèdics i dades personals cada dia.",
    points: [
      {
        title: "Aïllament per clínica",
        text: "Cada clínica té les dades separades per fila i un context de seguretat propi.",
      },
      {
        title: "Accés per rols",
        text: "Recepció, dentista, higienista i administració veuen només el que necessiten.",
      },
      {
        title: "Dades a la UE",
        text: "Allotjament a la Unió Europea i trànsit xifrat amb TLS.",
      },
      {
        title: "Traçabilitat",
        text: "Registre d'accessos i canvis per poder auditar què ha passat.",
      },
      {
        title: "Còpies de seguretat",
        text: "Còpies diàries i un pla de recuperació documentat.",
      },
      {
        title: "Sense permanència",
        text: "Pots exportar les teves dades i marxar. La porta sempre és oberta.",
      },
    ],
    diagram: { clinic: "Clínica", api: "API", db: "PostgreSQL + RLS", label: "Aïllament per tenant" },
    note: "La seguretat no és una pàgina web: és una arquitectura. Et podem explicar com funciona la nostra en una trucada.",
  },
  pricing: {
    index: "06 / Preus",
    title: "Una quota. Tota la clínica.",
    intro:
      "El Paquet Base Essencial inclou el que una clínica independent necessita per treballar. Sense cost d'alta i sense permanència.",
    monthly: "Mensual",
    annual: "Anual",
    annualNote: "2 mesos gratis",
    perMonth: "/mes",
    perYear: "/any",
    billed: "Facturat anualment",
    globalLabel: "Tarifa plana global · USD",
    baseName: "Paquet Base Essencial",
    baseDescription: "Agenda, odontograma, historial, facturació i recordatoris per a tota la clínica.",
    included: "Inclòs",
    features: [
      "Agenda multigabinet en temps real",
      "Odontograma interactiu de 32 peces",
      "Historial clínic amb alertes mèdiques",
      "Pressupostos i factures amb QR",
      "Recordatoris automàtics de visita",
      "Usuaris i pacients il·limitats",
      "Migració de dades assistida",
      "Suport en català i castellà",
      "Actualitzacions incloses",
      "Dades allotjades a la UE",
    ],
    addonsTitle: "Add-ons opcionals",
    addonsNote: "Només pagues el que actives. Pots començar amb el paquet base i afegir després.",
    addons: {
      whatsapp: {
        name: "Agent de WhatsApp",
        description: "Confirmacions, recordatoris i reprogramació amb derivació a recepció quan cal.",
      },
      signature: {
        name: "Signatura digital",
        description: "Consentiments informats signats des del mòbil, amb traçabilitat i data.",
      },
      pack: {
        name: "Pack Complet",
        description: "Base Essencial + WhatsApp + signatura digital, amb un preu conjunt.",
      },
    },
    packNote: "Estalvia respecte a contractar els add-ons per separat.",
    cta: "Comença la prova de 30 dies",
    footnote: "Preus sense impostos. La prova de 30 dies s'activa amb Stripe sense càrrec avui. El pla anual equival a 10 mensualitats.",
  },
  comparison: {
    index: "07 / Comparativa",
    title: "Què canvia amb Dentistes",
    intro:
      "Una comparació genèrica amb el model habitual del mercat. Sense noms comercials i sense promeses que no puguem complir.",
    columns: ["Dentistes", "Model habitual"],
    rows: [
      { label: "Model de preu", dentistes: "Per clínica", other: "Per usuari o per mòdul" },
      { label: "Usuaris", dentistes: "Il·limitats", other: "Sovint, de pagament" },
      { label: "Pacients", dentistes: "Il·limitats", other: "Límit o mòdul" },
      { label: "Alta i migració", dentistes: "0 $ + assistida", other: "Variable" },
      { label: "Permanència", dentistes: "Sense permanència", other: "12–24 mesos habituals" },
      { label: "WhatsApp IA", dentistes: "Add-on opcional", other: "Mòdul o servei extern" },
      { label: "Dades", dentistes: "UE + aïllament RLS", other: "Variable" },
    ],
    note: "Comparació genèrica basada en la nostra anàlisi de mercat de novembre de 2026. Cada proveïdor té les seves condicions.",
  },
  audience: {
    index: "08 / Per a qui és",
    title: "Pensat per a clíniques que volen créixer sense pagar més per això",
    intro:
      "Si la teva clínica té entre 2 i 10 persones i vols deixar de pagar per usuari, ets al lloc correcte.",
    items: [
      {
        title: "Clínica independent",
        text: "Decideixes tu, no un grup inversor. Necessites un sistema que no t'obligui a contractar un departament d'IT.",
      },
      {
        title: "Equip petit que creix",
        text: "Cada incorporació ha de sumar, no restar marge.",
      },
      {
        title: "Clínica que canvia de programari",
        text: "Vols migrar sense perdre historials ni la confiança de l'equip.",
      },
      {
        title: "Projecte nou",
        text: "Obres consulta i vols començar amb una base ordenada des del primer dia.",
      },
    ],
  },
  faq: {
    index: "09 / Preguntes",
    title: "El que solen preguntar-nos",
    intro: "Respostes directes. Si falta alguna cosa, escriu-nos des del formulari.",
    items: [
      {
        q: "Quant costa Dentistes?",
        a: "El Paquet Base Essencial costa 18,50 $ USD/mes per clínica. Inclou usuaris i pacients il·limitats, agenda, odontograma, historial, facturació i recordatoris. No hi ha cost d'alta ni permanència. El pagament anual equival a 10 mesos (185 $ USD/any).",
      },
      {
        q: "La prova de 30 dies és realment gratuïta?",
        a: "Sí. Els primers 30 dies són gratuïts (0 $ avui). Per activar-los es configura la targeta a Stripe Checkout, sense cap càrrec fins al dia 31, i pots cancel·lar en qualsevol moment.",
      },
      {
        q: "Puc migrar les dades de la meva clínica actual?",
        a: "Sí. La migració de pacients, historials i cites està assistida per l'equip de Dentistes. Revisem l'origen de les dades, acordem el format i validem els registres abans de posar la clínica en marxa.",
      },
      {
        q: "On s'allotgen les dades dels pacients?",
        a: "A la Unió Europea. L'arquitectura multi-tenant aïlla les dades de cada clínica per fila amb RLS, aplica control d'accés per rols i xifra el trànsit amb TLS. Els accessos queden registrats per poder auditar-los.",
      },
      {
        q: "Cal instal·lar algun programa?",
        a: "No. Dentistes funciona al navegador, també en tauletes i mòbils. No cal instal·lar res ni mantenir servidors locals.",
      },
      {
        q: "Què passa si vull cancel·lar?",
        a: "No hi ha permanència. Pots cancel·lar la subscripció i exportar les dades de la clínica. El servei deixa d'estar actiu al final del període ja pagat.",
      },
      {
        q: "L'agent de WhatsApp i la signatura digital estan inclosos?",
        a: "Són add-ons del Paquet Base Essencial. L'agent de WhatsApp costa 20 $ USD/mes i la signatura digital, 10 $ USD/mes. El Pack Complet agrupa el paquet base i tots dos add-ons per 39 $ USD/mes.",
      },
      {
        q: "Heu treballat amb clíniques reals?",
        a: "Estem obrint el programa pilot amb clíniques independents del Garraf i el Penedès. El pilot inclou acompanyament en la migració, formació de l'equip i un canal directe amb el producte per resoldre incidències.",
      },
    ],
  },
  contact: {
    index: "10 / Parlem",
    title: "Comença amb una prova real",
    intro:
      "Crea la clínica i prova el paquet base durant 30 dies. Si prefereixes una demo de 15 minuts, deixa'ns les teves dades i et truquem.",
    name: "El teu nom",
    clinic: "Clínica",
    email: "Email",
    phone: "Telèfon (opcional)",
    submitTrial: "Començar prova de 30 dies",
    submitDemo: "Vull una demo de 15 min",
    submitting: "Enviant sol·licitud...",
    demoSuccess: "Sol·licitud rebuda. Et contactarem aviat per agendar la demo de 15 minuts.",
    demoError: "No s'ha pogut enviar la sol·licitud. Torna-ho a provar o comença la prova directa.",
    privacy: "En enviar acceptes la nostra",
    note: "0 $ avui amb Stripe. Sense permanència. Migració assistida.",
  },
  footer: {
    tagline: "Programari de gestió dental per a clíniques independents.",
    product: "Producte",
    resources: "Recursos",
    legal: "Legal",
    pricing: "Preus",
    security: "Seguretat",
    blog: "Blog",
    privacy: "Privacitat",
    terms: "Termes",
    cookies: "Cookies",
    trial: "Prova 30 dies",
    rights: "© 2026 Dentistes. Tots els drets reservats.",
    madeIn: "Fet al Garraf, per a clíniques de veritat.",
  },
  legal: {
    privacy: {
      title: "Privacitat i protecció de dades",
      updated: "Darrera actualització: 12 de novembre de 2026",
      intro:
        "Aquesta política explica com tractem les dades personals que ens facilites a través de la web pública de Dentistes.",
      sections: [
        {
          title: "Responsable del tractament",
          text: "Dentistes és un producte de 2mes4. Per a qualsevol consulta relacionada amb privacitat pots escriure'ns a través del formulari de contacte d'aquesta web.",
        },
        {
          title: "Dades que tractem",
          text: "Tractem les dades que introdueixes al formulari de contacte o al registre: nom, nom de la clínica, email i telèfon. Si contrates el servei, tractem també les dades necessàries per a la relació comercial i les dades de salut que la clínica introdueix a la plataforma com a responsable del tractament.",
        },
        {
          title: "Finalitat i base jurídica",
          text: "Utilitzem les teves dades per respondre a la teva sol·licitud, gestionar la prova i prestar el servei contractat. La base jurídica és el teu consentiment, l'execució d'un contracte o el nostre interès legítim a respondre consultes comercials.",
        },
        {
          title: "Conservació",
          text: "Conservem les dades de contacte mentre existeixi una relació comercial o durant el temps necessari per atendre responsabilitats legals. Les dades de salut es conserven segons la normativa aplicable i les instruccions de la clínica responsable.",
        },
        {
          title: "Drets",
          text: "Pots sol·licitar accés, rectificació, supressió, oposició, limitació i portabilitat de les teves dades. També pots presentar una reclamació davant l'Agència Espanyola de Protecció de Dades.",
        },
        {
          title: "Seguretat",
          text: "Apliquem mesures tècniques i organitzatives per protegir les dades: control d'accés per rols, aïllament per clínica, xifrat en trànsit i còpies de seguretat.",
        },
      ],
    },
    terms: {
      title: "Condicions del servei",
      updated: "Darrera actualització: 12 de novembre de 2026",
      intro:
        "Aquestes condicions regulen l'ús de la web pública i de la prova del servei Dentistes. Les condicions completes de la subscripció es faciliten abans de contractar.",
      sections: [
        {
          title: "Objecte",
          text: "Dentistes és una plataforma de gestió per a clíniques dentals. La web pública permet informar-se sobre el producte, sol·licitar una demo i començar una prova.",
        },
        {
          title: "Prova i subscripció",
          text: "La prova dura 30 dies i s'activa mitjançant Stripe Checkout sense cap càrrec durant el període de prova. Si no cancel·les abans del dia 31, s'inicia la subscripció mensual o anual triada.",
        },
        {
          title: "Preus i pagaments",
          text: "Els preus publicats són de referència i no inclouen impostos, excepte que s'indiqui el contrari. El preu aplicable és el que apareix a la proposta o al procés de contractació.",
        },
        {
          title: "Cancel·lació",
          text: "No hi ha permanència. Pots cancel·lar en qualsevol moment i exportar les teves dades. El servei es manté actiu fins al final del període ja pagat.",
        },
        {
          title: "Ús acceptable",
          text: "No està permès utilitzar la plataforma per a activitats il·lícites, introduir codi maliciós, intentar accedir a dades d'una altra clínica o revendre el servei sense autorització.",
        },
        {
          title: "Responsabilitat",
          text: "La clínica és responsable de la veracitat i legalitat de les dades que introdueix. Dentistes presta el servei amb la diligència deguda i no substitueix el criteri clínic dels professionals.",
        },
      ],
    },
    cookies: {
      title: "Cookies",
      updated: "Darrera actualització: 12 de novembre de 2026",
      intro:
        "La web pública de Dentistes utilitza únicament cookies i emmagatzematge tècnic necessaris per al seu funcionament. No utilitzem cookies publicitàries ni de perfilat.",
      sections: [
        {
          title: "Què són les cookies",
          text: "Les cookies són petits fitxers que un lloc web guarda al teu dispositiu. També es poden utilitzar tecnologies similars, com l'emmagatzematge local.",
        },
        {
          title: "Cookies que utilitzem",
          text: "Utilitzem emmagatzematge tècnic per recordar preferències bàsiques, com l'idioma o l'estat d'un formulari. No instal·lem cookies de publicitat, xarxes socials o analítica de tercers en aquesta web.",
        },
        {
          title: "Com desactivar-les",
          text: "Pots esborrar o bloquejar les cookies des de la configuració del teu navegador. Si bloques l'emmagatzematge tècnic, algunes funcions de la web poden no funcionar correctament.",
        },
        {
          title: "Canvis",
          text: "Si incorporem cookies analítiques o de màrqueting, actualitzarem aquesta pàgina i sol·licitarem el consentiment quan calgui.",
        },
      ],
    },
  },
  blog: {
    indexTitle: "Guies per gestionar millor la teva clínica dental",
    indexIntro:
      "Contingut pràctic sobre preus, migració, agenda i operacions. Sense fum i sense demos de 40 minuts.",
    featured: "Destacat",
    all: "Tots els articles",
    read: "Llegir article",
    minRead: "min de lectura",
    published: "Publicat",
    updated: "Actualitzat",
    author: "Autor",
    related: "També et pot interessar",
    back: "Tornar al blog",
    ctaTitle: "Vols veure-ho a la teva clínica?",
    ctaText: "Prova el paquet base durant 30 dies (0 $ avui amb Stripe).",
    ctaLabel: "Començar prova",
    category: "Categoria",
  },
  notFound: {
    title: "Aquesta pàgina no existeix",
    text: "Potser l'enllaç és incorrecte o la pàgina s'ha mogut. Torna a l'inici o prova el blog.",
    cta: "Tornar a l'inici",
  },
  common: {
    skip: "Salta al contingut",
    trialBadge: "30 dies de prova",
    noCard: "0 $ avui amb Stripe",
    setup: "0 $ d'alta",
    migration: "Migració assistida",
    vat: "IVA no inclòs",
    month: "/mes",
    year: "/any",
    free: "Gratuït",
    optional: "Opcional",
    included: "Inclòs",
    consult: "Consulta'ns",
    from: "Des de",
  },
};
