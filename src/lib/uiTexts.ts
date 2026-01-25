/**
 * Centrale UI teksten voor consistente spelling en vertalingen
 * 
 * Gebruik: import { UI } from '@/lib/uiTexts';
 * 
 * Nederlandse spellingregels:
 * - Alleen hoofdletter aan het begin van een zin
 * - Samenstellingen aan elkaar: "kostenoverzicht", "accountinstellingen"
 * - Eigennamen wel met hoofdletter: "De Renovatie App"
 */

export const UI = {
  // ============================================
  // ALGEMENE ACTIES
  // ============================================
  actions: {
    save: "Opslaan",
    saving: "Opslaan...",
    cancel: "Annuleren",
    delete: "Verwijderen",
    deleting: "Verwijderen...",
    edit: "Bewerken",
    create: "Aanmaken",
    creating: "Aanmaken...",
    add: "Toevoegen",
    adding: "Toevoegen...",
    close: "Sluiten",
    confirm: "Bevestigen",
    back: "Terug",
    next: "Volgende",
    previous: "Vorige",
    search: "Zoeken",
    filter: "Filteren",
    export: "Exporteren",
    import: "Importeren",
    upload: "Uploaden",
    uploading: "Uploaden...",
    download: "Downloaden",
    refresh: "Vernieuwen",
    loading: "Laden...",
    processing: "Bezig...",
  },

  // ============================================
  // TAKEN
  // ============================================
  tasks: {
    title: "Taken",
    singular: "Taak",
    
    buttons: {
      new: "Nieuwe taak",
      create: "Taak aanmaken",
    },
    
    dialogs: {
      createTitle: "Nieuwe taak",
      editTitle: "Taak bewerken",
    },
    
    status: {
      todo: "Te doen",
      inProgress: "Bezig",
      done: "Gereed",
    },
    
    priority: {
      low: "Laag",
      medium: "Middel",
      high: "Hoog",
    },
    
    labels: {
      title: "Titel",
      description: "Beschrijving",
      status: "Status",
      priority: "Prioriteit",
      responsible: "Verantwoordelijke",
      startDate: "Begindatum",
      deadline: "Deadline",
      partOfHouse: "Deel van huis",
      type: "Type taak",
      images: "Foto's",
      updates: "Updates",
    },
    
    placeholders: {
      title: "Taak titel",
      description: "Taak beschrijving...",
      responsible: "Typ een naam...",
      partOfHouse: "Typ of selecteer...",
      selectType: "Selecteer type...",
      selectDate: "Selecteer datum",
    },
    
    messages: {
      created: "Taak succesvol aangemaakt!",
      updated: "Taak bijgewerkt",
      deleted: "Taak verwijderd",
      noTasks: "Geen taken",
      unsavedChanges: "Je hebt niet-opgeslagen wijzigingen",
      deadlineBeforeStart: "Deadline kan niet voor begindatum liggen",
    },
  },

  // ============================================
  // PROJECTEN
  // ============================================
  projects: {
    title: "Projecten",
    singular: "Project",
    
    buttons: {
      new: "Nieuw project",
      create: "Project aanmaken",
    },
    
    dialogs: {
      createTitle: "Nieuw renovatieproject",
      editTitle: "Project bewerken",
    },
    
    labels: {
      name: "Projectnaam",
      description: "Beschrijving",
      type: "Type project",
      status: "Status",
      startDate: "Startdatum",
      endDate: "Einddatum",
      budget: "Budget",
      progress: "Voortgang",
    },
    
    status: {
      planned: "Gepland",
      inProgress: "Lopend",
      completed: "Afgerond",
    },
    
    messages: {
      created: "Project succesvol aangemaakt!",
      updated: "Project bijgewerkt",
      deleted: "Project verwijderd",
      noProjects: "Nog geen projecten",
    },
  },

  // ============================================
  // KOSTEN
  // ============================================
  costs: {
    title: "Kosten",
    singular: "Kostenpost",
    overview: "Kostenoverzicht",
    
    buttons: {
      new: "Nieuwe kostenpost",
    },
    
    dialogs: {
      createTitle: "Nieuwe kostenpost",
      createDescription: "Voeg een nieuwe kostenpost toe door handmatig gegevens in te voeren of een factuur te uploaden.",
      editTitle: "Kosten bewerken",
      payersTitle: "Betalers beheren",
    },
    
    labels: {
      amount: "Bedrag",
      category: "Categorie",
      description: "Beschrijving",
      date: "Datum",
      supplier: "Leverancier",
      paidBy: "Betaald door",
      status: "Status",
      partOfHouse: "Deel van huis",
      invoice: "Factuur",
    },
    
    status: {
      estimate: "Schatting",
      quote: "Offerte",
      invoice: "Factuur",
    },
    
    category: {
      material: "Materiaal",
      labor: "Arbeid",
      permits: "Vergunningen",
      other: "Overig",
      diy: "Kluswerkzaamheden",
      decoration: "Decoratie",
      furniture: "Meubels",
    },
    
    messages: {
      created: "Kostenpost toegevoegd!",
      updated: "Kostenpost bijgewerkt",
      deleted: "Kostenpost verwijderd",
      noCosts: "Nog geen kosten geregistreerd",
    },
  },

  // ============================================
  // AANNEMERS / CONTACTEN
  // ============================================
  contractors: {
    title: "Aannemers",
    singular: "Aannemer",
    
    buttons: {
      new: "Nieuwe aannemer",
    },
    
    dialogs: {
      createTitle: "Nieuwe aannemer",
      editTitle: "Aannemer bewerken",
    },
    
    labels: {
      name: "Naam",
      firstName: "Voornaam",
      lastName: "Achternaam",
      company: "Bedrijf",
      role: "Rol",
      email: "E-mail",
      phone: "Telefoon",
      address: "Adres",
      website: "Website",
      notes: "Notities",
      active: "Actief",
    },
    
    messages: {
      created: "Aannemer toegevoegd!",
      updated: "Aannemer bijgewerkt!",
      deleted: "Aannemer verwijderd",
      noContractors: "Nog geen aannemers toegevoegd",
    },
  },

  contacts: {
    title: "Contacten",
    singular: "Contact",
    
    buttons: {
      new: "Nieuw contact",
      newCategory: "Nieuwe rubriek",
    },
    
    dialogs: {
      createTitle: "Nieuw contact",
      editTitle: "Contact bewerken",
      categoryCreateTitle: "Nieuwe rubriek",
      categoryEditTitle: "Rubriek bewerken",
    },
    
    messages: {
      noContacts: "Nog geen contacten in deze rubriek",
    },
  },

  // ============================================
  // DOCUMENTEN
  // ============================================
  documents: {
    title: "Documenten",
    singular: "Document",
    
    buttons: {
      upload: "Document uploaden",
    },
    
    types: {
      quote: "Offerte",
      permit: "Vergunning",
      manual: "Handleiding",
      warranty: "Garantie",
      contract: "Contract",
      floorplan: "Plattegrond",
      other: "Overig",
    },
    
    messages: {
      uploaded: "Document geüpload!",
      deleted: "Document verwijderd",
      noDocuments: "Nog geen documenten",
    },
  },

  // ============================================
  // FOTO'S
  // ============================================
  photos: {
    title: "Foto's",
    singular: "Foto",
    
    buttons: {
      upload: "Foto uploaden",
    },
    
    phases: {
      before: "Voor",
      during: "Tijdens",
      after: "Na",
    },
    
    messages: {
      uploaded: "Foto geüpload!",
      deleted: "Foto verwijderd",
      noPhotos: "Nog geen foto's",
    },
  },

  // ============================================
  // GEBRUIKERS
  // ============================================
  users: {
    title: "Gebruikers",
    singular: "Gebruiker",
    platformUsers: "Platformgebruikers",
    projectUsers: "Projectgebruikers",
    
    buttons: {
      new: "Nieuwe gebruiker",
      invite: "Nieuwe gebruiker uitnodigen",
    },
    
    dialogs: {
      createTitle: "Nieuwe gebruiker toevoegen",
      editTitle: "Platformgebruiker bewerken",
      projectUsersTitle: "Projectgebruikers beheren",
    },
    
    roles: {
      owner: "Eigenaar",
      partner: "Partner",
      contractor: "Aannemer",
      advisor: "Adviseur",
      admin: "Admin",
    },
    
    messages: {
      created: "Gebruiker succesvol aangemaakt",
      invited: "Uitnodiging verstuurd!",
      deleted: "Gebruiker verwijderd",
    },
  },

  // ============================================
  // ABONNEMENTEN
  // ============================================
  subscription: {
    title: "Abonnement",
    
    dialogs: {
      manageTitle: "Abonnement beheren",
    },
    
    tiers: {
      free: "Gratis",
      basis: "Basis",
      pro: "Pro",
    },
    
    status: {
      active: "Actief",
      trialing: "Proefperiode",
      canceled: "Opgezegd",
      expired: "Verlopen",
    },
  },

  // ============================================
  // AANWEZIGHEID
  // ============================================
  attendance: {
    title: "Aanwezigheid",
    todayPresent: "Vandaag aanwezig",
    
    status: {
      present: "Aanwezig",
      absent: "Afwezig",
      sick: "Ziek",
      vacation: "Vakantie",
    },
    
    messages: {
      noAttendance: "Vandaag geen aanwezigheid geregistreerd",
    },
  },

  // ============================================
  // AI FEATURES
  // ============================================
  ai: {
    costOverview: "AI-kostenoverzicht",
    scanning: "AI analyse bezig...",
    
    messages: {
      scanComplete: "AI analyse voltooid",
      scanFailed: "AI analyse mislukt",
    },
  },

  // ============================================
  // NAVIGATIE & TABS
  // ============================================
  navigation: {
    dashboard: "Dashboard",
    overview: "Overzicht",
    tasks: "Taken",
    costs: "Kosten",
    documents: "Documenten",
    photos: "Foto's",
    contractors: "Aannemers",
    contacts: "Contacten",
    attendance: "Aanwezigheid",
    settings: "Instellingen",
    users: "Gebruikers",
    logout: "Uitloggen",
  },

  // ============================================
  // ONBOARDING
  // ============================================
  onboarding: {
    welcome: "Welkom bij De Renovatie App!",
    steps: {
      projectsTitle: "Projecten aanmaken",
      projectsDescription: "Begin met het aanmaken van je eerste renovatieproject. Voeg details toe zoals budget, planning en beschrijving.",
      projectsTip: "Klik op 'Nieuw project' om te starten",
    },
  },

  // ============================================
  // APP STORE / MARKETING
  // ============================================
  marketing: {
    projectDetails: "Projectdetails",
    taskManagement: "Takenbeheer",
    costOverview: "Kostenoverzicht",
  },

  // ============================================
  // ERRORS & VALIDATIE
  // ============================================
  errors: {
    generic: "Er is een fout opgetreden",
    required: "Dit veld is verplicht",
    invalidEmail: "Ongeldig e-mailadres",
    networkError: "Netwerkfout, probeer het opnieuw",
    unauthorized: "Je hebt geen toegang tot deze functie",
    notFound: "Niet gevonden",
  },

  // ============================================
  // BEVESTIGINGEN
  // ============================================
  confirmations: {
    deleteTitle: "Verwijderen bevestigen",
    deleteDescription: "Dit kan niet ongedaan worden gemaakt.",
    unsavedTitle: "Niet-opgeslagen wijzigingen",
    unsavedDescription: "Je hebt wijzigingen gemaakt die nog niet zijn opgeslagen. Weet je zeker dat je wilt sluiten? Je wijzigingen gaan verloren.",
    closeWithoutSaving: "Sluiten zonder opslaan",
    backToEditing: "Terug naar bewerken",
  },
} as const;

// Type helper voor autocomplete
export type UITexts = typeof UI;
