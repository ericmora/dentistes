import type { Copy } from "./types";

export const en: Copy = {
  meta: {
    home: {
      title: "Dentistes — Dental practice management for independent clinics",
      description:
        "Multi-chair scheduling, odontogram, clinical records and billing in one platform. $18.50 USD/month per clinic, unlimited users and patients. 30-day trial, $0 today via Stripe.",
    },
    blog: {
      title: "Blog for independent dental clinics | Dentistes",
      description:
        "Practical guides on management, pricing, migration and operations for independent dental clinics. Useful content to make better decisions, without the fluff.",
    },
    notFound: {
      title: "Page not found | Dentistes",
      description: "The page you are looking for does not exist or has moved.",
    },
  },
  nav: {
    product: "Product",
    how: "How it works",
    pricing: "Pricing",
    security: "Security",
    blog: "Blog",
    login: "Log in",
    trial: "Start 30-day trial",
    menu: "Open menu",
    close: "Close menu",
    language: "Language",
  },
  hero: {
    eyebrow: "From dentist to dentist · Simple clinic management",
    h1a: "More chair time.",
    h1b: "Zero billing surprises.",
    intro:
      "The easiest, safest, and most affordable dental software for your practice. Multi-chair schedule, odontogram, patient history, and billing on one screen. Your whole team for $18.50 USD/month.",
    ctaPrimary: "Start your 30-day trial",
    ctaSecondary: "See how it works",
    trust: ["30 days free ($0 today)", "$0 setup", "Free data migration", "Records safe in the EU"],
    panel: {
      title: "Schedule / Tuesday",
      subtitle: "3 rooms · 12 appointments",
      live: "Live",
      cabinets: ["Room 1", "Room 2", "Room 3"],
      appointments: [
        {
          time: "09:00",
          name: "Anna P.",
          treatment: "Hygiene",
          cabinet: "Room 1",
          status: "Confirmed",
          tone: "confirmed",
        },
        {
          time: "09:30",
          name: "Marc R.",
          treatment: "Root canal",
          cabinet: "Room 2",
          status: "In chair",
          tone: "chair",
        },
        {
          time: "10:15",
          name: "Laia M.",
          treatment: "Check-up",
          cabinet: "Room 1",
          status: "Confirmed",
          tone: "confirmed",
        },
        {
          time: "10:30",
          name: "Jordi S.",
          treatment: "First visit",
          cabinet: "Room 3",
          status: "Pending",
          tone: "pending",
        },
        {
          time: "11:00",
          name: "Nuria B.",
          treatment: "Filling",
          cabinet: "Room 2",
          status: "Confirmed",
          tone: "confirmed",
        },
      ],
      free: "3 open slots",
      whatsapp: "WhatsApp confirmed",
      footer: "Drag an appointment. The slot updates across all three rooms.",
    },
  },
  proof: {
    items: [
      { value: "$18.50", label: "USD per clinic per month" },
      { value: "∞", label: "users and patients" },
      { value: "30", label: "day trial" },
      { value: "$0", label: "setup fee" },
    ],
    note: "Global flat fee in USD. Taxes not included.",
  },
  problem: {
    index: "01 / Daily practice",
    title: "Your practice shouldn't overpay or waste time between patients",
    intro:
      "If you ever felt like you work just to pay software licenses, or lose half an hour a day clicking through endless menus, this was built for you.",
    points: [
      {
        title: "You lose precious time between visits",
        text: "Slow software with hidden menus. You write diagnoses in one place, estimates in another, and shout across the hallway to reception.",
      },
      {
        title: "They charge you like a corporate chain",
        text: "As soon as you hire a hygienist or open another room, they bill another user seat. You end up paying $300+/month for the basics.",
      },
      {
        title: "Fear of losing patient files or getting locked in",
        text: "If the front-desk computer breaks or gets hit by a virus, you panic. And if you want to switch, they make it hard to take your patient records.",
      },
    ],
    footnote: "The solution is simple: fast software any doctor or receptionist learns in 5 minutes, for $18.50 USD/month all-inclusive.",
  },
  product: {
    index: "02 / Your day on one screen",
    title: "The whole clinical flow, without switching windows",
    intro: "Built for the real pace of a dental clinic: open the chart and see everything you need to treat the patient and move smoothly to the next visit.",
    modules: [
      {
        id: "agenda",
        title: "Multi-chair scheduling",
        text: "See every room at once, move an appointment without overlaps and confirm by WhatsApp from the same screen.",
        bullets: ["Room and practitioner view", "Validated rescheduling", "Reminders and confirmations"],
      },
      {
        id: "odontograma",
        title: "Interactive odontogram",
        text: "32 teeth, five surfaces per tooth and clear states. From diagnosis to quote without typing it twice.",
        bullets: ["States by surface", "Adult and child", "Connected quote"],
      },
      {
        id: "historial",
        title: "Records with alerts",
        text: "Evolutions, diagnoses and medical alerts in a record that reception and dentists can read according to their role.",
        bullets: ["Visible alerts", "Role-based permissions", "Access log"],
      },
      {
        id: "facturacion",
        title: "Billing with QR",
        text: "Verifiable quotes and invoices, partial payments and per-session collection. No manual tax calculations.",
        bullets: ["PDF with QR", "Partial payments", "Collection status"],
      },
      {
        id: "espera",
        title: "Dynamic waiting list",
        text: "When an appointment is cancelled, the system tells you who to call based on urgency, availability and fit.",
        bullets: ["Clinical priority", "Real availability", "Slot coverage"],
      },
    ],
  },
  odontogram: {
    title: "Interactive odontogram",
    hint: "Tap a tooth surface to change its state. That is how a diagnosis is documented in seconds.",
    states: {
      healthy: "Healthy",
      caries: "Caries",
      restored: "Restored",
      planned: "Planned",
      missing: "Missing",
    },
    selected: "Selected",
    reset: "Reset",
    tooth: "Tooth",
  },
  receipt: {
    index: "03 / The clear bill",
    title: "The difference shows up in your bank account at the end of the month",
    intro:
      "Real example of a 4-person clinic (2 doctors, 1 hygienist, and front desk). Other software charges per user seat; Dentistes charges one flat rate for the whole clinic.",
    traditional: {
      label: "Traditional per-user software",
      lines: [
        { label: "4 seats × $75 (doctors, hygienist, front desk)", value: "$300/mo" },
        { label: "New doctor joining the clinic", value: "+$75/mo" },
        { label: "Setup & local backup maintenance", value: "Extra" },
      ],
      totalLabel: "What you pay every month",
      total: "$300/mo",
    },
    dentistes: {
      label: "Dentistes · All-inclusive",
      lines: [
        { label: "Single flat fee for the entire clinic", value: "$18.50/mo" },
        { label: "Doctors, hygienists, front desk & rooms", value: "Unlimited ($0)" },
        { label: "Daily backups, QR invoicing & migration", value: "Included ($0)" },
      ],
      totalLabel: "Real monthly total",
      total: "$18.50/mo",
    },
    saving: "You save $281.50/mo",
    note: "One flat global price of $18.50 USD/month per clinic. No hidden fees, no mandatory add-ons, and no penalties when your team grows.",
  },
  whatsapp: {
    index: "04 / Time saved",
    title: "Less admin work, more time with your patients",
    intro:
      "Every minute between appointments counts. Dentistes is built so you finish each visit with the odontogram, notes, and estimate done—no taking paperwork home.",
    bullets: [
      "From odontogram to estimate in 1 click",
      "Red medical alerts before seating the patient",
      "Waiting list fills cancellations in seconds",
      "Schedule synced between chairside and reception",
    ],
    phone: {
      title: "Dentistes · Front desk",
      status: "Slot filled in 2 min",
      messages: [
        { from: "clinic", text: "Hi Anna. A slot just opened tomorrow at 10:30 in room 2. Would you like to come in?", time: "17:42" },
        { from: "patient", text: "Yes, that works great!", time: "17:43" },
        { from: "clinic", text: "Booked. See you tomorrow at 10:30.", time: "17:43" },
        { from: "patient", text: "Thanks, see you then.", time: "17:45" },
      ],
      note: "The waiting list automatically ranks patients by clinical urgency and availability so you never lose chair time.",
    },
    addon: "Over 5 hours saved per week per clinic",
    cta: "See the $18.50 flat rate",
  },
  security: {
    index: "05 / Security & peace of mind",
    title: "Sleep easy: your patient records are safe from crashes, viruses, and audits",
    intro: "You handle sensitive health records every day. We built Dentistes to protect your practice without needing an IT person on payroll.",
    points: [
      {
        title: "Safe from viruses and broken computers",
        text: "If the front-desk PC fails or gets hit by ransomware, you lose nothing. Daily automatic backups keep everything safe outside the clinic.",
      },
      {
        title: "Each role sees only what they need",
        text: "Reception schedules visits and handles billing without seeing private clinical notes; doctors and hygienists see the full medical chart.",
      },
      {
        title: "GDPR compliant & hosted in Europe",
        text: "All patient records stay in European Union servers under strict healthcare privacy standards so you stay worry-free.",
      },
      {
        title: "VeriFactu & QR-ready invoicing",
        text: "Quotes and invoices include tamper-proof records and QR codes out of the box—no third-party compliance tools required.",
      },
      {
        title: "Full change trail when questions arise",
        text: "If someone edits an appointment or records a payment, you can see who did it and when—no guesswork or missing receipts.",
      },
      {
        title: "Your patients are yours, no lock-in",
        text: "No long-term contracts. Export all your patient records and history anytime you want without penalties.",
      },
    ],
    diagram: {
      clinic: "In your clinic",
      clinicSub: "PC, Mac or tablet · No install",
      api: "Role-based access",
      apiSub: "Doctor, hygienist & front desk",
      db: "EU Safety Vault",
      dbSub: "Daily automatic backups",
      label: "Real protection for your practice",
      badges: ["Daily backups", "GDPR compliant", "Role permissions", "Free export", "QR invoicing"],
    },
    note: "No closet servers or monthly IT maintenance bills. We handle the technical security so you can focus 100% on dentistry.",
  },
  pricing: {
    index: "06 / Pricing",
    title: "One price. Your whole team included.",
    intro:
      "$18.50 USD per month per clinic. Zero setup fees, no lock-in contracts, and never pay extra per doctor or treatment room.",
    monthly: "Monthly",
    annual: "Annual",
    annualNote: "2 months free",
    perMonth: "/mo",
    perYear: "/yr",
    billed: "Billed annually",
    globalLabel: "Global flat rate · USD",
    baseName: "Essential Base Package",
    baseDescription: "Everything your practice needs from day one: scheduling, odontogram, clinical records, waiting list, and invoicing.",
    included: "Included",
    features: [
      "Real-time multi-chair scheduling",
      "Interactive 32-tooth odontogram",
      "Clinical records with medical alerts",
      "Quotes and invoices with QR",
      "Dynamic waiting list to fill gaps",
      "Unlimited users, doctors and patients",
      "Free assisted data migration ($0)",
      "Support in English, Spanish and Catalan",
      "Automatic daily backups",
      "EU-hosted data (GDPR)",
    ],
    addonsTitle: "Everything included from day one",
    addonsNote: "We don't believe in hidden modules or charging extra for every new person on your team.",
    addons: {
      whatsapp: {
        name: "Unlimited team & rooms",
        description: "Add all your dentists, hygienists, and receptionists without paying a single extra dollar.",
      },
      signature: {
        name: "Free data migration",
        description: "We move your patient files and appointments from your old software at zero cost.",
      },
      pack: {
        name: "30-day risk-free trial",
        description: "Test it with real patients for a full month. $0 today via Stripe and cancel anytime.",
      },
    },
    packNote: "No lock-in. Export your clinic data anytime in one click.",
    cta: "Start your 30-day trial",
    footnote: "Global flat rate in USD (taxes excluded). 30-day trial with $0 charged today via Stripe. Annual plan equals 10 months ($185 USD/yr).",
  },
  comparison: {
    index: "07 / Comparison",
    title: "What changes with Dentistes",
    intro:
      "A direct comparison against traditional dental software.",
    columns: ["Dentistes", "Traditional software"],
    rows: [
      { label: "Pricing model", dentistes: "$18.50 per clinic", other: "Per user or per room" },
      { label: "Doctors & hygienists", dentistes: "Unlimited", other: "Paid per seat" },
      { label: "Patients", dentistes: "Unlimited", other: "Tiered limits" },
      { label: "Setup & migration", dentistes: "$0 + assisted", other: "High setup fees" },
      { label: "Commitment", dentistes: "No lock-in", other: "12–24 month contracts" },
      { label: "QR invoicing", dentistes: "Included", other: "Paid add-on" },
      { label: "Security & backups", dentistes: "Daily EU backups (GDPR)", other: "Local server risk" },
    ],
    note: "Comparison based on standard per-seat licensing in the dental software market.",
  },
  audience: {
    index: "08 / Who it is for",
    title: "Built for clinics that want to grow without paying more for it",
    intro:
      "If your clinic has 2 to 10 people and you want to stop paying per user, you are in the right place.",
    items: [
      {
        title: "Independent clinic",
        text: "You make the decisions, not an investment group. You need a system that does not require an IT department.",
      },
      {
        title: "A small team that is growing",
        text: "Every hire should add margin, not subtract it.",
      },
      {
        title: "A clinic switching software",
        text: "You want to migrate without losing records or your team's trust.",
      },
      {
        title: "A new practice",
        text: "You are opening and want to start with an organised foundation from day one.",
      },
    ],
  },
  faq: {
    index: "09 / Questions",
    title: "What clinics usually ask us",
    intro: "Straight answers. If something is missing, use the contact form.",
    items: [
      {
        q: "How much does Dentistes cost?",
        a: "The Essential Base Package costs $18.50 USD/month per clinic. It includes unlimited users and patients, scheduling, odontogram, records, billing and reminders. There is no setup fee and no lock-in. Annual billing equals 10 months ($185 USD/year).",
      },
      {
        q: "Is the 30-day trial really free?",
        a: "Yes. The first 30 days are free ($0 today). To activate them you enter a payment method in Stripe Checkout, with no charge until day 31, and you can cancel at any time.",
      },
      {
        q: "Can I migrate data from my current clinic software?",
        a: "Yes. Patient, record and appointment migration is assisted by the Dentistes team. We review the source data, agree on the format and validate the records before your clinic goes live.",
      },
      {
        q: "Where is my patient data stored?",
        a: "On European Union servers under strict GDPR healthcare privacy rules. Each clinic has its own private workspace, staff access is controlled by role, and automatic daily backups keep everything safe.",
      },
      {
        q: "Do I need to install any software?",
        a: "No. Dentistes runs in your web browser on any PC, Mac, or tablet. There is nothing to install and no local server to maintain in your clinic.",
      },
      {
        q: "What happens if I cancel?",
        a: "There is no lock-in. You can cancel anytime and export all your patient records and clinical history with zero penalties.",
      },
      {
        q: "Do I have to pay extra modules for billing or adding more doctors?",
        a: "No. All essential software is included in the $18.50 USD/month flat rate per clinic: unlimited users, unlimited rooms, schedule, odontogram, clinical history, waiting list, and QR invoicing.",
      },
      {
        q: "Have you worked with real clinics?",
        a: "We are opening the pilot programme with independent clinics in the Garraf and Penedès regions. The pilot includes migration support, team training and a direct line to the product team for incidents.",
      },
    ],
  },
  contact: {
    index: "10 / Let's talk",
    title: "Start with a real trial",
    intro:
      "Create your clinic and try the base package for 30 days. If you prefer a 15-minute demo, leave your details and we will call you.",
    name: "Your name",
    clinic: "Clinic",
    email: "Email",
    phone: "Phone (optional)",
    submitTrial: "Start 30-day trial",
    submitDemo: "Request a 15-min demo",
    submitting: "Sending request...",
    demoSuccess: "Request received. We will contact you shortly to schedule your 15-minute demo.",
    demoError: "Could not send your request. Please try again or start your free trial directly.",
    privacy: "By submitting you accept our",
    note: "$0 today via Stripe. No lock-in. Assisted migration.",
  },
  footer: {
    tagline: "Dental practice management for independent clinics.",
    product: "Product",
    resources: "Resources",
    legal: "Legal",
    pricing: "Pricing",
    security: "Security",
    blog: "Blog",
    privacy: "Privacy",
    terms: "Terms",
    cookies: "Cookies",
    trial: "30-day trial",
    rights: "© 2026 Dentistes. All rights reserved.",
    madeIn: "Made in Garraf, for real clinics.",
  },
  legal: {
    privacy: {
      title: "Privacy and data protection",
      updated: "Last updated: 12 November 2026",
      intro:
        "This policy explains how we process the personal data you provide through the Dentistes public website.",
      sections: [
        {
          title: "Data controller",
          text: "Dentistes is a 2mes4 product. For any privacy-related question, contact us through the form on this website.",
        },
        {
          title: "Data we process",
          text: "We process the data you enter in the contact or signup form: name, clinic name, email and phone. If you subscribe, we also process the data needed for the commercial relationship and the health data the clinic enters into the platform as data controller.",
        },
        {
          title: "Purpose and legal basis",
          text: "We use your data to respond to your request, manage the trial and provide the contracted service. The legal basis is your consent, the performance of a contract or our legitimate interest in responding to commercial enquiries.",
        },
        {
          title: "Retention",
          text: "We keep contact data while there is a commercial relationship or for as long as needed to meet legal obligations. Health data is retained according to applicable law and the instructions of the responsible clinic.",
        },
        {
          title: "Your rights",
          text: "You can request access, rectification, erasure, objection, restriction and portability of your data. You can also file a complaint with the Spanish Data Protection Agency.",
        },
        {
          title: "Security",
          text: "We apply technical and organisational measures to protect data: role-based access control, isolation per clinic, encryption in transit and backups.",
        },
      ],
    },
    terms: {
      title: "Terms of service",
      updated: "Last updated: 12 November 2026",
      intro:
        "These terms govern the use of the public website and the Dentistes trial. The full subscription terms are provided before you sign up.",
      sections: [
        {
          title: "Purpose",
          text: "Dentistes is a management platform for dental clinics. The public website lets you learn about the product, request a demo and start a trial.",
        },
        {
          title: "Trial and subscription",
          text: "The trial lasts 30 days and is activated via Stripe Checkout with no charge during the trial period. If you do not cancel before day 31, the chosen monthly or annual subscription starts.",
        },
        {
          title: "Prices and payments",
          text: "Published prices are for reference and exclude taxes unless stated otherwise. The applicable price is the one shown in the proposal or at checkout.",
        },
        {
          title: "Cancellation",
          text: "There is no lock-in. You can cancel at any time and export your data. The service remains active until the end of the period you have already paid for.",
        },
        {
          title: "Acceptable use",
          text: "You may not use the platform for unlawful activities, introduce malicious code, attempt to access another clinic's data or resell the service without authorisation.",
        },
        {
          title: "Liability",
          text: "The clinic is responsible for the accuracy and legality of the data it enters. Dentistes provides the service with due diligence and does not replace the clinical judgement of professionals.",
        },
      ],
    },
    cookies: {
      title: "Cookies",
      updated: "Last updated: 12 November 2026",
      intro:
        "The Dentistes public website only uses technical cookies and storage required for it to work. We do not use advertising or profiling cookies.",
      sections: [
        {
          title: "What cookies are",
          text: "Cookies are small files a website stores on your device. Similar technologies, such as local storage, may also be used.",
        },
        {
          title: "Cookies we use",
          text: "We use technical storage to remember basic preferences, such as language or form state. We do not install advertising, social media or third-party analytics cookies on this website.",
        },
        {
          title: "How to disable them",
          text: "You can delete or block cookies in your browser settings. If you block technical storage, some website features may not work correctly.",
        },
        {
          title: "Changes",
          text: "If we add analytics or marketing cookies, we will update this page and ask for consent where required.",
        },
      ],
    },
  },
  blog: {
    indexTitle: "Guides to run your dental clinic better",
    indexIntro: "Practical content on pricing, migration, scheduling and operations. No fluff and no 40-minute demos.",
    featured: "Featured",
    all: "All articles",
    read: "Read article",
    minRead: "min read",
    published: "Published",
    updated: "Updated",
    author: "Author",
    related: "You may also like",
    back: "Back to blog",
    ctaTitle: "Want to see it in your clinic?",
    ctaText: "Try the base package for 30 days ($0 today via Stripe).",
    ctaLabel: "Start trial",
    category: "Category",
  },
  notFound: {
    title: "This page does not exist",
    text: "The link may be wrong or the page may have moved. Go back home or try the blog.",
    cta: "Back to home",
  },
  common: {
    skip: "Skip to content",
    trialBadge: "30-day trial",
    noCard: "$0 today via Stripe",
    setup: "$0 setup",
    migration: "Assisted migration",
    vat: "VAT not included",
    month: "/mo",
    year: "/yr",
    free: "Free",
    optional: "Optional",
    included: "Included",
    consult: "Contact us",
    from: "From",
  },
};
