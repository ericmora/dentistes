export type LegalPageCopy = {
  title: string;
  updated: string;
  intro: string;
  sections: { title: string; text: string }[];
};

export type Copy = {
  meta: {
    home: { title: string; description: string };
    blog: { title: string; description: string };
    notFound: { title: string; description: string };
  };
  nav: {
    product: string;
    how: string;
    pricing: string;
    security: string;
    blog: string;
    login: string;
    trial: string;
    menu: string;
    close: string;
    language: string;
  };
  hero: {
    eyebrow: string;
    h1a: string;
    h1b: string;
    intro: string;
    ctaPrimary: string;
    ctaSecondary: string;
    trust: string[];
    panel: {
      title: string;
      subtitle: string;
      live: string;
      cabinets: [string, string, string];
      appointments: {
        time: string;
        name: string;
        treatment: string;
        cabinet: string;
        status: string;
        tone: "confirmed" | "chair" | "pending";
      }[];
      free: string;
      whatsapp: string;
      footer: string;
    };
  };
  proof: {
    items: { value: string; label: string }[];
    note: string;
  };
  problem: {
    index: string;
    title: string;
    intro: string;
    points: { title: string; text: string }[];
    footnote: string;
  };
  product: {
    index: string;
    title: string;
    intro: string;
    modules: { id: string; title: string; text: string; bullets: string[] }[];
  };
  odontogram: {
    title: string;
    hint: string;
    states: { healthy: string; caries: string; restored: string; planned: string; missing: string };
    selected: string;
    reset: string;
    tooth: string;
  };
  receipt: {
    index: string;
    title: string;
    intro: string;
    traditional: {
      label: string;
      lines: { label: string; value: string }[];
      totalLabel: string;
      total: string;
    };
    dentistes: {
      label: string;
      lines: { label: string; value: string }[];
      totalLabel: string;
      total: string;
    };
    saving: string;
    note: string;
  };
  whatsapp: {
    index: string;
    title: string;
    intro: string;
    bullets: string[];
    phone: {
      title: string;
      status: string;
      messages: { from: "clinic" | "patient"; text: string; time: string }[];
      note: string;
    };
    addon: string;
    cta: string;
  };
  security: {
    index: string;
    title: string;
    intro: string;
    points: { title: string; text: string }[];
    diagram: { clinic: string; api: string; db: string; label: string };
    note: string;
  };
  pricing: {
    index: string;
    title: string;
    intro: string;
    monthly: string;
    annual: string;
    annualNote: string;
    perMonth: string;
    perYear: string;
    billed: string;
    globalLabel: string;
    baseName: string;
    baseDescription: string;
    included: string;
    features: string[];
    addonsTitle: string;
    addonsNote: string;
    addons: {
      whatsapp: { name: string; description: string };
      signature: { name: string; description: string };
      pack: { name: string; description: string };
    };
    packNote: string;
    cta: string;
    footnote: string;
  };
  comparison: {
    index: string;
    title: string;
    intro: string;
    columns: [string, string];
    rows: { label: string; dentistes: string; other: string }[];
    note: string;
  };
  audience: {
    index: string;
    title: string;
    intro: string;
    items: { title: string; text: string }[];
  };
  faq: {
    index: string;
    title: string;
    intro: string;
    items: { q: string; a: string }[];
  };
  contact: {
    index: string;
    title: string;
    intro: string;
    name: string;
    clinic: string;
    email: string;
    phone: string;
    submitTrial: string;
    submitDemo: string;
    submitting: string;
    demoSuccess: string;
    demoError: string;
    privacy: string;
    note: string;
  };
  footer: {
    tagline: string;
    product: string;
    resources: string;
    legal: string;
    pricing: string;
    security: string;
    blog: string;
    privacy: string;
    terms: string;
    cookies: string;
    trial: string;
    rights: string;
    madeIn: string;
  };
  legal: {
    privacy: LegalPageCopy;
    terms: LegalPageCopy;
    cookies: LegalPageCopy;
  };
  blog: {
    indexTitle: string;
    indexIntro: string;
    featured: string;
    all: string;
    read: string;
    minRead: string;
    published: string;
    updated: string;
    author: string;
    related: string;
    back: string;
    ctaTitle: string;
    ctaText: string;
    ctaLabel: string;
    category: string;
  };
  notFound: {
    title: string;
    text: string;
    cta: string;
  };
  common: {
    skip: string;
    trialBadge: string;
    noCard: string;
    setup: string;
    migration: string;
    vat: string;
    month: string;
    year: string;
    free: string;
    optional: string;
    included: string;
    consult: string;
    from: string;
  };
};
