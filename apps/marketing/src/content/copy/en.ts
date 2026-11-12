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
    eyebrow: "Dental practice management for independent clinics",
    h1a: "Your clinic grows.",
    h1b: "Your fee stays the same.",
    intro:
      "Multi-chair scheduling, odontogram, clinical records and billing in one platform. One flat fee per clinic, your whole team included and less admin work.",
    ctaPrimary: "Start your 30-day trial",
    ctaSecondary: "See how it works",
    trust: ["$0 today via Stripe", "$0 setup", "Assisted migration", "EU data"],
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
    index: "01 / The problem",
    title: "Software should not punish your clinic's growth",
    intro:
      "When every new team member costs another licence, the team grows but the margin does not. When the system forces you to jump between modules, reception loses time and so does the dentist.",
    points: [
      {
        title: "You pay per person",
        text: "The price rises with every hire, so you end up deciding who gets access and who does not.",
      },
      {
        title: "Modules add up",
        text: "WhatsApp, signatures, reminders or reports are billed separately. The final invoice looks nothing like the first quote.",
      },
      {
        title: "Data is hard to move",
        text: "If changing providers feels risky, it is not because the move is easy. It is because the provider makes it hard.",
      },
    ],
    footnote: "Our proposal is simple: one flat fee per clinic and a product your team uses every day.",
  },
  product: {
    index: "02 / Product",
    title: "The whole clinical flow, on one screen",
    intro: "No pop-ups, no exporting to Excel and no hunting for the clinical record in another tab.",
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
    title: "The difference shows up on the invoice",
    intro:
      "Illustrative example with 4 people and a market rate of $75 USD per user. Every provider's prices vary; the logic does not.",
    traditional: {
      label: "Per-user software",
      lines: [
        { label: "4 users × $75", value: "$300/mo" },
        { label: "WhatsApp", value: "+$20/mo" },
        { label: "Digital signature", value: "+$10/mo" },
      ],
      totalLabel: "Indicative total",
      total: "$330/mo",
    },
    dentistes: {
      label: "Dentistes",
      lines: [
        { label: "Flat fee per clinic", value: "$18.50/mo" },
        { label: "WhatsApp", value: "+$20/mo" },
        { label: "Digital signature", value: "+$10/mo" },
      ],
      totalLabel: "Total with the same add-ons",
      total: "$48.50/mo",
    },
    saving: "$281.50/mo difference",
    note: "Illustrative calculation, not a third-party offer. Each provider's prices may vary by module and volume.",
  },
  whatsapp: {
    index: "04 / WhatsApp",
    title: "The conversation that avoids a phone call",
    intro:
      "An agent handles confirmations and rescheduling. If a clinical question comes up, it hands over to reception with the full context.",
    bullets: ["Confirmations and reminders", "Rescheduling in natural language", "Handover to a person", "Consent and traceability"],
    phone: {
      title: "Dentistes · Reception",
      status: "Agent active",
      messages: [
        { from: "clinic", text: "Hi Anna. We'll see you tomorrow at 10:30 in room 2. Can you confirm?", time: "17:42" },
        { from: "patient", text: "Yes, confirmed.", time: "17:43" },
        { from: "clinic", text: "Perfect. If you need to change it, just reply to this message.", time: "17:43" },
        { from: "patient", text: "Thursday afternoon would be better.", time: "17:45" },
        { from: "clinic", text: "I can offer Thursday at 17:00 or Friday at 9:30.", time: "17:45" },
      ],
      note: "If the conversation gets complex, reception receives the context and takes over.",
    },
    addon: "Add-on: $20 USD/mo",
    cta: "See pricing and add-ons",
  },
  security: {
    index: "05 / Security",
    title: "Health data, handled with the care the sector demands",
    intro: "Dentistes is designed for clinics that work with medical records and personal data every day.",
    points: [
      {
        title: "Isolation per clinic",
        text: "Each clinic's data is separated by row and runs with its own security context.",
      },
      {
        title: "Role-based access",
        text: "Reception, dentists, hygienists and admin only see what they need.",
      },
      {
        title: "EU data",
        text: "Hosted in the European Union with TLS-encrypted traffic.",
      },
      {
        title: "Traceability",
        text: "Access and change logs so you can audit what happened.",
      },
      {
        title: "Backups",
        text: "Daily backups and a documented recovery plan.",
      },
      {
        title: "No lock-in",
        text: "You can export your data and leave. The door is always open.",
      },
    ],
    diagram: { clinic: "Clinic", api: "API", db: "PostgreSQL + RLS", label: "Tenant isolation" },
    note: "Security is not a web page. It is an architecture. We can walk you through ours on a call.",
  },
  pricing: {
    index: "06 / Pricing",
    title: "One fee. Your whole clinic.",
    intro:
      "The Essential Base Package includes what an independent clinic needs to work. No setup fee and no lock-in.",
    monthly: "Monthly",
    annual: "Annual",
    annualNote: "2 months free",
    perMonth: "/mo",
    perYear: "/yr",
    billed: "Billed annually",
    globalLabel: "Global flat rate · USD",
    baseName: "Essential Base Package",
    baseDescription: "Scheduling, odontogram, records, billing and reminders for the whole clinic.",
    included: "Included",
    features: [
      "Real-time multi-chair scheduling",
      "Interactive 32-tooth odontogram",
      "Clinical records with medical alerts",
      "Quotes and invoices with QR",
      "Automated appointment reminders",
      "Unlimited users and patients",
      "Assisted data migration",
      "Support in Spanish and Catalan",
      "Updates included",
      "EU-hosted data",
    ],
    addonsTitle: "Optional add-ons",
    addonsNote: "You only pay for what you activate. Start with the base package and add more later.",
    addons: {
      whatsapp: {
        name: "WhatsApp agent",
        description: "Confirmations, reminders and rescheduling, with handover to reception when needed.",
      },
      signature: {
        name: "Digital signature",
        description: "Informed consent signed from a phone, with traceability and a timestamp.",
      },
      pack: {
        name: "Complete Pack",
        description: "Essential Base + WhatsApp + digital signature at a bundled price.",
      },
    },
    packNote: "Save compared with buying the add-ons separately.",
    cta: "Start your 30-day trial",
    footnote: "Prices exclude taxes. The 30-day trial is activated via Stripe with $0 charged today. The annual plan equals 10 monthly payments.",
  },
  comparison: {
    index: "07 / Comparison",
    title: "What changes with Dentistes",
    intro:
      "A generic comparison with the usual market model. No brand names and no promises we cannot keep.",
    columns: ["Dentistes", "Typical model"],
    rows: [
      { label: "Pricing model", dentistes: "Per clinic", other: "Per user or module" },
      { label: "Users", dentistes: "Unlimited", other: "Often paid separately" },
      { label: "Patients", dentistes: "Unlimited", other: "Limit or module" },
      { label: "Setup and migration", dentistes: "$0 + assisted", other: "Variable" },
      { label: "Commitment", dentistes: "No lock-in", other: "Usually 12–24 months" },
      { label: "WhatsApp AI", dentistes: "Optional add-on", other: "Module or external service" },
      { label: "Data", dentistes: "EU + RLS isolation", other: "Variable" },
    ],
    note: "Generic comparison based on our November 2026 market analysis. Every provider has its own terms.",
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
        q: "Where is patient data hosted?",
        a: "In the European Union. The multi-tenant architecture isolates each clinic's data by row with RLS, applies role-based access control and encrypts traffic with TLS. Access is logged for auditing.",
      },
      {
        q: "Do I need to install any software?",
        a: "No. Dentistes runs in the browser, including tablets and phones. There is nothing to install and no local server to maintain.",
      },
      {
        q: "What happens if I cancel?",
        a: "There is no lock-in. You can cancel the subscription and export your clinic data. The service stops at the end of the period you have already paid for.",
      },
      {
        q: "Are the WhatsApp agent and digital signature included?",
        a: "They are add-ons to the Essential Base Package. The WhatsApp agent costs $20 USD/month and digital signature is $10 USD/month. The Complete Pack bundles the base package and both add-ons for $39 USD/month.",
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
