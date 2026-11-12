import type { Post } from "./types";

export const cost: Post = {
  id: "cost",
  slug: {
    es: "cuanto-cuesta-software-dental-2026",
    en: "how-much-does-dental-software-cost-2026",
    ca: "quant-costa-programari-dental-2026",
  },
  title: {
    es: "Cuánto cuesta un software dental en 2026",
    en: "How much does dental software cost in 2026",
    ca: "Quant costa un programari dental el 2026",
  },
  seoTitle: {
    es: "Cuánto cuesta un software dental en 2026: guía de precios",
    en: "How much does dental software cost in 2026: pricing guide",
    ca: "Quant costa un programari dental el 2026: guia de preus",
  },
  description: {
    es: "Modelos de precio, costes ocultos y un ejemplo realista para una clínica de tres personas. Compara software dental sin mirar solo la cuota inicial.",
    en: "Pricing models, hidden costs and a realistic example for a three-person clinic. Compare dental software without looking only at the first price.",
    ca: "Models de preu, costos ocults i un exemple realista per a una clínica de tres persones. Compara programaris dentals sense mirar només la quota inicial.",
  },
  excerpt: {
    es: "La cuota inicial no es el precio. Estos son los cinco costes que suelen aparecer después.",
    en: "The first price is not the price. These are the five costs that usually appear later.",
    ca: "La quota inicial no és el preu. Aquests són els cinc costos que solen aparèixer després.",
  },
  date: "2026-11-12",
  updated: "2026-11-12",
  category: { es: "Prezos", en: "Pricing", ca: "Preus" },
  readingTime: { es: "7 min", en: "7 min", ca: "7 min" },
  cover: "/images/blog/cost.webp",
  coverAlt: {
    es: "Factura de software dental con costes por usuario y add-ons",
    en: "Dental software bill with per-user costs and add-ons",
    ca: "Factura de programari dental amb costos per usuari i add-ons",
  },
  author: { es: "Equipo Dentistes", en: "Dentistes team", ca: "Equip Dentistes" },
  blocks: {
    es: [
      {
        type: "p",
        text: "La pregunta no es cuánto cuesta un software dental. La pregunta es cuánto cuesta el software que tu clínica necesita de verdad, con el equipo que tiene hoy y el que tendrá dentro de dos años.",
      },
      {
        type: "p",
        text: "En el mercado conviven tres modelos: pago por usuario, pago por módulos y cuota plana por clínica. Cada uno tiene una lógica distinta. Comparar solo la primera cifra es la forma más rápida de equivocarse.",
      },
      { type: "h2", text: "Los tres modelos de precio", id: "modelos" },
      {
        type: "table",
        head: ["Modelo", "Cómo se calcula", "Cuándo suele crecer la factura"],
        rows: [
          ["Por usuario", "Una cuota por cada persona con acceso", "Cada nueva incorporación"],
          ["Por módulos", "Una base + WhatsApp, firma, informes o recordatorios", "Cada función que activas"],
          ["Cuota plana", "Un precio por clínica, con usuarios y pacientes incluidos", "Solo si cambias de plan"],
        ],
      },
      {
        type: "p",
        text: "El modelo por usuario puede ser razonable para un profesional autónomo. Para una clínica con recepción, dos dentistas y un higienista, la multiplicación empieza a pesar. El modelo por módulos tiene el mismo problema: la factura final depende de cuántas piezas necesitas.",
      },
      { type: "h2", text: "Los costes que no salen en la página de precios", id: "costes-ocultos" },
      {
        type: "ul",
        items: [
          "Alta e implantación: algunos proveedores cobran la puesta en marcha o la formación inicial.",
          "Migración de datos: pasar historiales y citas puede facturarse por horas o por volumen.",
          "Usuarios adicionales: la cuota sube cuando entra un auxiliar o un administrador.",
          "Módulos: WhatsApp, firma digital, recordatorios o informes se venden por separado.",
          "Permanencia: un contrato de 12 o 24 meses limita tu capacidad de cambiar si el producto no encaja.",
          "Soporte prioritario: a veces el teléfono o la respuesta rápida son un extra.",
        ],
      },
      {
        type: "p",
        text: "No todos estos costes son malos. Lo importante es conocerlos antes de firmar y sumarlos al precio que comparas. Un software de 49 €/mes con alta de 300 € y migración de 500 € no cuesta 49 €/mes el primer año.",
      },
      { type: "h2", text: "Ejemplo con tres personas", id: "ejemplo" },
      {
        type: "p",
        text: "Imagina una clínica con recepción, dos dentistas y un higienista a tiempo parcial. Cuatro personas acceden al sistema. Comparamos un modelo por usuario de 75 $ USD/mes con una cuota plana de 18,50 $ USD/mes, añadiendo WhatsApp y firma digital en ambos casos.",
      },
      {
        type: "table",
        head: ["Concepto", "Por usuario", "Cuota plana"],
        rows: [
          ["4 usuarios × 75 $", "300 $/mes", "—"],
          ["Cuota por clínica", "—", "18,50 $/mes"],
          ["WhatsApp", "20 $/mes", "20 $/mes"],
          ["Firma digital", "10 $/mes", "10 $/mes"],
          ["Total mensual", "330 $/mes", "48,50 $/mes"],
        ],
      },
      {
        type: "p",
        text: "La diferencia es de 281,50 $/mes, o 3.378 $ al año. Es un ejemplo ilustrativo: cada proveedor tiene sus precios y sus condiciones. Pero la lógica se mantiene: cuando el precio depende de las personas, el crecimiento del equipo se convierte en un coste.",
      },
      { type: "h2", text: "Cinco preguntas antes de comparar", id: "preguntas" },
      {
        type: "ol",
        items: [
          "¿Cuántas personas van a acceder al sistema en los próximos 24 meses?",
          "¿Qué funciones necesitas el primer día y cuáles puedes activar después?",
          "¿El alta, la migración y la formación están incluidas?",
          "¿Hay permanencia? ¿Qué pasa si cancelas antes?",
          "¿Puedes exportar todos tus datos si decides cambiar?",
        ],
      },
      {
        type: "p",
        text: "Si haces estas preguntas a cada proveedor, la comparación deja de ser una carrera de cuotas y se convierte en una decisión de producto. Y ahí es donde una clínica independiente puede elegir con criterio.",
      },
      {
        type: "callout",
        text: "En Dentistes el Paquet Base Essencial cuesta 18,50 $ USD/mes por clínica, con usuarios y pacientes ilimitados, sin alta y sin permanencia. La prueba dura 30 días (0 $ hoy al activar con Stripe).",
      },
      {
        type: "cta",
        title: "Calcula lo que pagarías con tu equipo",
        text: "Mira el precio plano y compáralo con tu factura actual. Sin llamadas comerciales y sin compromiso.",
        href: "/#pricing",
        label: "Ver precios",
      },
    ],
    en: [
      {
        type: "p",
        text: "The question is not how much dental software costs. The question is how much the software your clinic actually needs costs, with the team you have today and the team you will have in two years.",
      },
      {
        type: "p",
        text: "The market has three models: per user, per module and a flat fee per clinic. Each one follows a different logic. Comparing only the first number is the fastest way to get it wrong.",
      },
      { type: "h2", text: "The three pricing models", id: "models" },
      {
        type: "table",
        head: ["Model", "How it is calculated", "When the bill usually grows"],
        rows: [
          ["Per user", "A fee for every person with access", "Every new hire"],
          ["Per module", "A base + WhatsApp, signature, reports or reminders", "Every feature you enable"],
          ["Flat fee", "One price per clinic, users and patients included", "Only if you change plan"],
        ],
      },
      {
        type: "p",
        text: "The per-user model can make sense for a solo professional. For a clinic with reception, two dentists and a hygienist, the multiplication starts to hurt. The per-module model has the same issue: the final bill depends on how many pieces you need.",
      },
      { type: "h2", text: "The costs that are not on the pricing page", id: "hidden-costs" },
      {
        type: "ul",
        items: [
          "Setup and implementation: some providers charge for onboarding or initial training.",
          "Data migration: moving records and appointments may be billed by hour or by volume.",
          "Additional users: the fee rises when an assistant or administrator joins.",
          "Modules: WhatsApp, digital signature, reminders or reports are sold separately.",
          "Commitment: a 12- or 24-month contract limits your ability to leave if the product does not fit.",
          "Priority support: phone access or fast responses are sometimes an extra.",
        ],
      },
      {
        type: "p",
        text: "Not all of these costs are bad. What matters is knowing them before you sign and adding them to the price you compare. Software at €49/month with a €300 setup and €500 migration does not cost €49/month in year one.",
      },
      { type: "h2", text: "Example with three people", id: "example" },
      {
        type: "p",
        text: "Imagine a clinic with reception, two dentists and a part-time hygienist. Four people access the system. We compare a per-user model at $75 USD/month with a flat fee of $18.50 USD/month, adding WhatsApp and digital signature in both cases.",
      },
      {
        type: "table",
        head: ["Item", "Per user", "Flat fee"],
        rows: [
          ["4 users × $75", "$300/month", "—"],
          ["Fee per clinic", "—", "$18.50/month"],
          ["WhatsApp", "$20/month", "$20/month"],
          ["Digital signature", "$10/month", "$10/month"],
          ["Monthly total", "$330/month", "$48.50/month"],
        ],
      },
      {
        type: "p",
        text: "The difference is $281.50/month, or $3,378 a year. This is an illustrative example: every provider has its own prices and terms. But the logic holds: when the price depends on people, team growth becomes a cost.",
      },
      { type: "h2", text: "Five questions before comparing", id: "questions" },
      {
        type: "ol",
        items: [
          "How many people will access the system over the next 24 months?",
          "Which features do you need on day one and which can wait?",
          "Are setup, migration and training included?",
          "Is there a minimum term? What happens if you cancel early?",
          "Can you export all your data if you decide to change?",
        ],
      },
      {
        type: "p",
        text: "If you ask every provider these questions, the comparison stops being a race between fees and becomes a product decision. That is where an independent clinic can choose with judgement.",
      },
      {
        type: "callout",
        text: "At Dentistes the Essential Base Package costs $18.50 USD/month per clinic, with unlimited users and patients, no setup fee and no commitment. The trial lasts 30 days ($0 today when activating via Stripe).",
      },
      {
        type: "cta",
        title: "Calculate what you would pay with your team",
        text: "See the flat price and compare it with your current bill. No sales calls and no commitment.",
        href: "/#pricing",
        label: "See pricing",
      },
    ],
    ca: [
      {
        type: "p",
        text: "La pregunta no és quant costa un programari dental. La pregunta és quant costa el programari que la teva clínica necessita de veritat, amb l'equip que té avui i el que tindrà d'aquí a dos anys.",
      },
      {
        type: "p",
        text: "Al mercat conviuen tres models: pagament per usuari, pagament per mòduls i quota plana per clínica. Cada un té una lògica diferent. Comparar només la primera xifra és la manera més ràpida d'equivocar-se.",
      },
      { type: "h2", text: "Els tres models de preu", id: "models" },
      {
        type: "table",
        head: ["Model", "Com es calcula", "Quan sol créixer la factura"],
        rows: [
          ["Per usuari", "Una quota per cada persona amb accés", "Cada nova incorporació"],
          ["Per mòduls", "Una base + WhatsApp, signatura, informes o recordatoris", "Cada funció que actives"],
          ["Quota plana", "Un preu per clínica, amb usuaris i pacients inclosos", "Només si canvies de pla"],
        ],
      },
      {
        type: "p",
        text: "El model per usuari pot ser raonable per a un professional autònom. Per a una clínica amb recepció, dos dentistes i un higienista, la multiplicació comença a pesar. El model per mòduls té el mateix problema: la factura final depèn de quantes peces necessites.",
      },
      { type: "h2", text: "Els costos que no surten a la pàgina de preus", id: "costos-ocults" },
      {
        type: "ul",
        items: [
          "Alta i implantació: alguns proveïdors cobren la posada en marxa o la formació inicial.",
          "Migració de dades: passar historials i cites pot facturar-se per hores o per volum.",
          "Usuaris addicionals: la quota puja quan entra un auxiliar o un administrador.",
          "Mòduls: WhatsApp, signatura digital, recordatoris o informes es venen per separat.",
          "Permanència: un contracte de 12 o 24 mesos limita la capacitat de canviar si el producte no encaixa.",
          "Suport prioritari: de vegades el telèfon o la resposta ràpida són un extra.",
        ],
      },
      {
        type: "p",
        text: "No tots aquests costos són dolents. L'important és conèixer-los abans de signar i sumar-los al preu que compares. Un programari de 49 €/mes amb alta de 300 € i migració de 500 € no costa 49 €/mes el primer any.",
      },
      { type: "h2", text: "Exemple amb tres persones", id: "exemple" },
      {
        type: "p",
        text: "Imagina una clínica amb recepció, dos dentistes i un higienista a temps parcial. Quatre persones accedeixen al sistema. Comparem un model per usuari de 75 $ USD/mes amb una quota plana de 18,50 $ USD/mes, afegint WhatsApp i signatura digital en tots dos casos.",
      },
      {
        type: "table",
        head: ["Concepte", "Per usuari", "Quota plana"],
        rows: [
          ["4 usuaris × 75 $", "300 $/mes", "—"],
          ["Quota per clínica", "—", "18,50 $/mes"],
          ["WhatsApp", "20 $/mes", "20 $/mes"],
          ["Signatura digital", "10 $/mes", "10 $/mes"],
          ["Total mensual", "330 $/mes", "48,50 $/mes"],
        ],
      },
      {
        type: "p",
        text: "La diferència és de 281,50 $/mes, o 3.378 $ l'any. És un exemple il·lustratiu: cada proveïdor té els seus preus i les seves condicions. Però la lògica es manté: quan el preu depèn de les persones, el creixement de l'equip es converteix en un cost.",
      },
      { type: "h2", text: "Cinc preguntes abans de comparar", id: "preguntes" },
      {
        type: "ol",
        items: [
          "Quantes persones accediran al sistema en els pròxims 24 mesos?",
          "Quines funcions necessites el primer dia i quines pots activar després?",
          "L'alta, la migració i la formació estan incloses?",
          "Hi ha permanència? Què passa si cancel·les abans?",
          "Pots exportar totes les teves dades si decideixes canviar?",
        ],
      },
      {
        type: "p",
        text: "Si fas aquestes preguntes a cada proveïdor, la comparació deixa de ser una cursa de quotes i es converteix en una decisió de producte. I aquí és on una clínica independent pot triar amb criteri.",
      },
      {
        type: "callout",
        text: "A Dentistes el Paquet Base Essencial costa 18,50 $ USD/mes per clínica, amb usuaris i pacients il·limitats, sense alta i sense permanència. La prova dura 30 dies (0 $ avui en activar amb Stripe).",
      },
      {
        type: "cta",
        title: "Calcula el que pagaries amb el teu equip",
        text: "Mira el preu pla i compara'l amb la teva factura actual. Sense trucades comercials i sense compromís.",
        href: "/#pricing",
        label: "Veure preus",
      },
    ],
  },
  faq: {
    es: [
      {
        q: "¿Cuánto cuesta un software dental al mes?",
        a: "Los modelos por usuario suelen moverse entre 50 y 100 $ por persona y mes. Los modelos por módulos suman una base más add-ons. Una cuota plana como la de Dentistes cuesta 18,50 $ USD/mes por clínica, con usuarios y pacientes ilimitados.",
      },
      {
        q: "¿La migración de datos suele estar incluida?",
        a: "No siempre. Algunos proveedores la cobran aparte o la limitan a un formato concreto. Pregunta qué incluye, quién valida los datos y cuánto tiempo de acompañamiento tendrás.",
      },
      {
        q: "¿Es más barato un software anual?",
        a: "Muchos proveedores ofrecen dos meses gratis al pagar anual. Solo tiene sentido si estás seguro de que vas a usar el producto durante todo el año y si las condiciones de cancelación son claras.",
      },
    ],
    en: [
      {
        q: "How much does dental software cost per month?",
        a: "Per-user models usually range from $50 to $100 per person per month. Per-module models add a base fee plus add-ons. A flat fee like Dentistes costs $18.50 USD/month per clinic, with unlimited users and patients.",
      },
      {
        q: "Is data migration usually included?",
        a: "Not always. Some providers charge separately or limit it to a specific format. Ask what is included, who validates the data and how much support you will get.",
      },
      {
        q: "Is annual software cheaper?",
        a: "Many providers offer two months free when you pay annually. It only makes sense if you are sure you will use the product all year and the cancellation terms are clear.",
      },
    ],
    ca: [
      {
        q: "Quant costa un programari dental al mes?",
        a: "Els models per usuari solen moure's entre 50 i 100 $ per persona i mes. Els models per mòduls sumen una base més add-ons. Una quota plana com la de Dentistes costa 18,50 $ USD/mes per clínica, amb usuaris i pacients il·limitats.",
      },
      {
        q: "La migració de dades sol estar inclosa?",
        a: "No sempre. Alguns proveïdors la cobren a part o la limiten a un format concret. Pregunta què inclou, qui valida les dades i quant temps d'acompanyament tindràs.",
      },
      {
        q: "És més barat un programari anual?",
        a: "Molts proveïdors ofereixen dos mesos gratis en pagar anual. Només té sentit si estàs segur que faràs servir el producte tot l'any i si les condicions de cancel·lació són clares.",
      },
    ],
  },
  related: ["choose-software", "migration"],
};
