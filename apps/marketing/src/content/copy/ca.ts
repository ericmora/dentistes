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
    eyebrow: "De dentista a dentista · Gestió clínica sense complicacions",
    h1a: "Més temps al silló.",
    h1b: "Zero sorpreses a la factura.",
    intro:
      "El programari dental més fàcil, segur i econòmic per a la teva clínica. Agenda de tots els gabinets, odontograma, historial i facturació en una sola pantalla. Tot el teu equip dins per 18,50 $ USD/mes.",
    ctaPrimary: "Comença la prova de 30 dies",
    ctaSecondary: "Veure com funciona",
    trust: ["30 dies gratis (0 $ avui)", "0 $ d'alta", "Passem les teves dades gratis", "Historials segurs a la UE"],
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
    index: "01 / El dia a dia",
    title: "La teva clínica no hauria de pagar una fortuna ni perdre temps entre pacient i pacient",
    intro:
      "Si algun cop has sentit que treballes per pagar el programari o que perds mitja hora al dia barallant-te amb finestres i clics inacabables, això està fet per a tu.",
    points: [
      {
        title: "Perds temps valuós entre visites",
        text: "Programes lents amb mil menús amagats. Has d'apuntar el diagnòstic en un lloc, picar el pressupost en un altre i avisar recepció a crits.",
      },
      {
        title: "Et cobren com si fossis una franquícia",
        text: "Quan entra un higienista o obres un segon gabinet, et cobren una altra llicència. Acabes pagant 300 $ o més al mes per fer el bàsic.",
      },
      {
        title: "Por a perdre historials o quedar-te atrapat",
        text: "Si falla l'ordinador de recepció o entra un virus, tremoles. I si vols canviar de programari, et posen mil traves per emportar-te els teus pacients.",
      },
    ],
    footnote: "La solució és senzilla: un programa ràpid que qualsevol doctor o recepcionista entén en 5 minuts, per 18,50 $ USD al mes tot inclòs.",
  },
  product: {
    index: "02 / La teva jornada en una pantalla",
    title: "Tot el flux clínic, sense canviar de finestra",
    intro: "Pensat per al ritme real d'una clínica dental: obres la fitxa i ho tens tot al davant per atendre el pacient i passar a la següent visita.",
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
    title: "La diferència es veu a la teva butxaca a final de mes",
    intro:
      "Exemple real d'una clínica de 4 persones (2 doctors, 1 higienista i recepció). Amb altres programes pagues per cada lloc; amb Dentistes pagues una tarifa plana única per clínica.",
    traditional: {
      label: "Programari tradicional per usuari",
      lines: [
        { label: "4 llocs × 75 $ (doctors, higienista i recepció)", value: "300 $/mes" },
        { label: "Nou doctor que entra a la clínica", value: "+75 $/mes" },
        { label: "Instal·lació i còpies locals", value: "A part" },
      ],
      totalLabel: "El que pagues cada mes",
      total: "300 $/mes",
    },
    dentistes: {
      label: "Dentistes · Tot inclòs",
      lines: [
        { label: "Tarifa plana única per a tota la clínica", value: "18,50 $/mes" },
        { label: "Doctors, higienistes, recepció i gabinets", value: "Il·limitats (0 $)" },
        { label: "Còpies diàries, VeriFactu QR i migració", value: "Inclòs (0 $)" },
      ],
      totalLabel: "Total real al mes",
      total: "18,50 $/mes",
    },
    saving: "Estalvies 281,50 $/mes",
    note: "Preu únic global de 18,50 $ USD/mes per clínica. Sense quotes ocultes, sense mòduls obligatoris ni penalitzacions quan creix el teu equip.",
  },
  whatsapp: {
    index: "04 / Temps que recuperes",
    title: "Menys administració, més temps per atendre pacients",
    intro:
      "Cada minut entre visites compta. Dentistes està dissenyat perquè acabis la consulta amb l'odontograma, l'historial i el pressupost fets, sense emportar-te feina a casa.",
    bullets: [
      "De l'odontograma al pressupost en 1 clic",
      "Alertes mèdiques en vermell abans d'asseure el pacient",
      "Llista d'espera que cobreix cancel·lacions en segons",
      "Agenda sincronitzada entre gabinet i recepció",
    ],
    phone: {
      title: "Dentistes · Recepció",
      status: "Forat cobert en 2 min",
      messages: [
        { from: "clinic", text: "Hola, Anna. S'ha alliberat un forat demà a les 10:30 al gabinet 2. Et va bé venir?", time: "17:42" },
        { from: "patient", text: "Sí! Em va perfecte.", time: "17:43" },
        { from: "clinic", text: "Anotada. T'esperem demà a les 10:30.", time: "17:43" },
        { from: "patient", text: "Gràcies, fins demà.", time: "17:45" },
      ],
      note: "La llista d'espera prioritza automàticament per urgència clínica i disponibilitat perquè no perdis ni una hora de silló.",
    },
    addon: "Més de 5 hores estalviades cada setmana per clínica",
    cta: "Veure tarifa única de 18,50 $",
  },
  security: {
    index: "05 / Seguretat i tranquil·litat",
    title: "Dorm tranquil: els teus historials mèdics estan fora de perill d'avaries, virus i inspeccions",
    intro:
      "Treballes amb dades de salut cada dia. Hem dissenyat Dentistes per protegir la teva clínica sense que hagis de ser informàtic ni contractar manteniment extern.",
    points: [
      {
        title: "A salv de virus i ordinadors espatllats",
        text: "Si falla el PC de recepció o entra un ransomware, no perds ni un historial. Tot es guarda amb còpies diàries automàtiques fora de la clínica.",
      },
      {
        title: "Cada lloc veu només el que necessita",
        text: "Recepció dóna cites i cobra sense accedir a notes mèdiques privades; el dentista i l'higienista treballen a la fitxa clínica completa.",
      },
      {
        title: "Compliment RGPD i dades a Europa",
        text: "Tots els expedients clínics s'allotgen dins la Unió Europea complint la normativa sanitària per evitar sancions.",
      },
      {
        title: "Factures preparades per a VeriFactu i TicketBAI",
        text: "Pressupostos i factures amb codi QR i registre inalterable per complir amb Hisenda sense programes a part.",
      },
      {
        title: "Saps qui ha tocat què i quan",
        text: "Si algú modifica una cita o registra un cobrament, queda constància perquè a la clínica no hi hagi malentesos ni desquadraments.",
      },
      {
        title: "Els teus pacients són teus, sense segrestos",
        text: "No hi ha permanència. Si algun dia vols canviar de programa, exportes tots els historials i dades sense traves ni lletra petita.",
      },
    ],
    diagram: {
      clinic: "A la teva clínica",
      clinicSub: "PC, Mac o tablet · Sense instal·lar",
      api: "Accés per lloc",
      apiSub: "Doctor, higienista i recepció",
      db: "Caixa forta a la UE",
      dbSub: "Còpies diàries automàtiques",
      label: "Protecció real per a la teva clínica",
      badges: ["Còpies diàries", "Compliment RGPD", "Accés per lloc", "Exportació lliure", "VeriFactu / QR"],
    },
    note: "No necessites servidors en un armari ni pagar a un informàtic cada mes. De la seguretat ens encarreguem nosaltres perquè tu només atenguis pacients.",
  },
  pricing: {
    index: "06 / Preus",
    title: "Un sol preu. Tot el teu equip inclòs.",
    intro:
      "18,50 $ USD al mes per clínica. Sense cost d'alta, sense permanència i sense cobrar per usuari ni per gabinet.",
    monthly: "Mensual",
    annual: "Anual",
    annualNote: "2 mesos gratis",
    perMonth: "/mes",
    perYear: "/any",
    billed: "Facturat anualment",
    globalLabel: "Tarifa plana global · USD",
    baseName: "Paquet Base Essencial",
    baseDescription: "Tot el que necessita la teva clínica per treballar des del primer dia: agenda, odontograma, historial, llista d'espera i facturació.",
    included: "Inclòs",
    features: [
      "Agenda multigabinet en temps real",
      "Odontograma interactiu de 32 peces",
      "Historial clínic amb alertes mèdiques",
      "Pressupostos i factures amb QR (VeriFactu)",
      "Llista d'espera per cobrir forats",
      "Usuaris, doctors i pacients il·limitats",
      "Migració de dades assistida (0 $)",
      "Suport en català i castellà",
      "Còpies de seguretat diàries automàtiques",
      "Dades allotjades a la UE (RGPD)",
    ],
    addonsTitle: "Tot inclòs des del primer dia",
    addonsNote: "No creiem en els mòduls amagats ni a cobrar-te un extra per cada persona que treballa amb tu.",
    addons: {
      whatsapp: {
        name: "Equip i gabinets il·limitats",
        description: "Afegeix tots els doctors, higienistes i recepció sense pagar ni un dòlar més al mes.",
      },
      signature: {
        name: "Passem les teves dades gratis",
        description: "Ens encarreguem de migrar els teus pacients i historials des del teu programa actual sense cost.",
      },
      pack: {
        name: "30 dies de prova sense risc",
        description: "Fes-lo servir amb pacients reals durant un mes sencer. 0 $ avui amb Stripe i cancel·la quan vulguis.",
      },
    },
    packNote: "Sense permanència. La teva informació és teva i l'exportes en 1 clic.",
    cta: "Comença la prova de 30 dies",
    footnote: "Preu únic global en USD (impostos no inclosos). Prova de 30 dies sense càrrec avui amb Stripe. El pla anual equival a 10 mesos (185 $ USD/any).",
  },
  comparison: {
    index: "07 / Comparativa",
    title: "Què canvia amb Dentistes",
    intro:
      "Una comparació directa amb els programes dentals de tota la vida.",
    columns: ["Dentistes", "Programari tradicional"],
    rows: [
      { label: "Preu", dentistes: "18,50 $ per clínica", other: "Per usuari o per gabinet" },
      { label: "Doctors i higienistes", dentistes: "Il·limitats", other: "De pagament per cada alta" },
      { label: "Pacients", dentistes: "Il·limitats", other: "Límits per tram" },
      { label: "Alta i migració", dentistes: "0 $ + assistida", other: "Cost elevat d'instal·lació" },
      { label: "Permanència", dentistes: "Sense permanència", other: "12–24 mesos habituals" },
      { label: "Facturació amb QR", dentistes: "Inclosa", other: "Mòdul a part" },
      { label: "Seguretat i còpies", dentistes: "Còpies diàries a la UE (RGPD)", other: "Risc en servidor local" },
    ],
    note: "Comparació basada en l'estàndard habitual de llicències per lloc del mercat dental.",
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
        q: "On es guarden les dades dels meus pacients?",
        a: "En servidors dins la Unió Europea complint la normativa RGPD. Cada clínica té el seu espai totalment aïllat, cada persona entra amb el seu permís segons el lloc i fem còpies de seguretat automàtiques cada dia.",
      },
      {
        q: "Cal instal·lar algun programa?",
        a: "No. Dentistes funciona a qualsevol ordinador, Mac o tauleta des del navegador. No cal instal·lar res ni tenir un servidor a la clínica.",
      },
      {
        q: "Què passa si vull cancel·lar?",
        a: "No hi ha permanència. Pots cancel·lar en qualsevol moment i exportar tots els historials i pacients de la teva clínica sense penalitzacions.",
      },
      {
        q: "He de pagar mòduls extra per facturació o per més doctors?",
        a: "No. Tot el programari essencial està inclòs a la tarifa plana de 18,50 $ USD/mes per clínica: usuaris il·limitats, gabinets il·limitats, agenda, odontograma, historial clínic, llista d'espera i facturació amb QR.",
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
