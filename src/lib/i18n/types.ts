/**
 * Type definitions for i18n support
 */

export type Language = 'nl' | 'en';

export type UITexts = {
  // ============================================
  // ALGEMENE ACTIES
  // ============================================
  actions: {
    save: string;
    saving: string;
    cancel: string;
    delete: string;
    deleting: string;
    edit: string;
    create: string;
    creating: string;
    add: string;
    adding: string;
    close: string;
    confirm: string;
    back: string;
    next: string;
    previous: string;
    search: string;
    filter: string;
    export: string;
    import: string;
    upload: string;
    uploading: string;
    download: string;
    refresh: string;
    loading: string;
    processing: string;
  };

  // ============================================
  // TAKEN
  // ============================================
  tasks: {
    title: string;
    singular: string;
    buttons: {
      new: string;
      create: string;
    };
    dialogs: {
      createTitle: string;
      editTitle: string;
    };
    status: {
      todo: string;
      inProgress: string;
      done: string;
    };
    priority: {
      low: string;
      medium: string;
      high: string;
    };
    labels: {
      title: string;
      description: string;
      status: string;
      priority: string;
      responsible: string;
      startDate: string;
      deadline: string;
      partOfHouse: string;
      type: string;
      images: string;
      updates: string;
    };
    placeholders: {
      title: string;
      description: string;
      responsible: string;
      partOfHouse: string;
      selectType: string;
      selectDate: string;
    };
    messages: {
      created: string;
      updated: string;
      deleted: string;
      noTasks: string;
      unsavedChanges: string;
      deadlineBeforeStart: string;
    };
  };

  // ============================================
  // PROJECTEN
  // ============================================
  projects: {
    title: string;
    singular: string;
    buttons: {
      new: string;
      create: string;
    };
    dialogs: {
      createTitle: string;
      editTitle: string;
    };
    labels: {
      name: string;
      description: string;
      type: string;
      status: string;
      startDate: string;
      endDate: string;
      budget: string;
      progress: string;
    };
    status: {
      planned: string;
      inProgress: string;
      completed: string;
    };
    messages: {
      created: string;
      updated: string;
      deleted: string;
      noProjects: string;
    };
  };

  // ============================================
  // KOSTEN
  // ============================================
  costs: {
    title: string;
    singular: string;
    overview: string;
    buttons: {
      new: string;
    };
    dialogs: {
      createTitle: string;
      createDescription: string;
      editTitle: string;
      payersTitle: string;
      categoriesTitle: string;
      categoriesDescription: string;
    };
    labels: {
      amount: string;
      category: string;
      description: string;
      date: string;
      supplier: string;
      paidBy: string;
      status: string;
      partOfHouse: string;
      invoice: string;
    };
    status: {
      estimate: string;
      quote: string;
      invoice: string;
    };
    category: {
      material: string;
      labor: string;
      permits: string;
      other: string;
      diy: string;
      decoration: string;
      furniture: string;
    };
    messages: {
      created: string;
      updated: string;
      deleted: string;
      noCosts: string;
    };
  };

  // ============================================
  // AANNEMERS / CONTACTEN
  // ============================================
  contractors: {
    title: string;
    singular: string;
    buttons: {
      new: string;
    };
    dialogs: {
      createTitle: string;
      editTitle: string;
    };
    labels: {
      name: string;
      firstName: string;
      lastName: string;
      company: string;
      role: string;
      email: string;
      phone: string;
      address: string;
      website: string;
      notes: string;
      active: string;
    };
    messages: {
      created: string;
      updated: string;
      deleted: string;
      noContractors: string;
    };
  };

  contacts: {
    title: string;
    singular: string;
    buttons: {
      new: string;
      newCategory: string;
    };
    dialogs: {
      createTitle: string;
      editTitle: string;
      categoryCreateTitle: string;
      categoryEditTitle: string;
      categoriesManagerTitle: string;
      categoriesManagerDescription: string;
    };
    messages: {
      noContacts: string;
      categoriesSaved: string;
      minOneCategory: string;
    };
  };

  // ============================================
  // DOCUMENTEN
  // ============================================
  documents: {
    title: string;
    singular: string;
    buttons: {
      upload: string;
    };
    types: {
      quote: string;
      permit: string;
      manual: string;
      warranty: string;
      contract: string;
      floorplan: string;
      other: string;
    };
    messages: {
      uploaded: string;
      deleted: string;
      noDocuments: string;
    };
  };

  // ============================================
  // FOTO'S
  // ============================================
  photos: {
    title: string;
    singular: string;
    buttons: {
      upload: string;
    };
    phases: {
      before: string;
      during: string;
      after: string;
    };
    messages: {
      uploaded: string;
      deleted: string;
      noPhotos: string;
    };
  };

  // ============================================
  // GEBRUIKERS
  // ============================================
  users: {
    title: string;
    singular: string;
    platformUsers: string;
    projectUsers: string;
    buttons: {
      new: string;
      invite: string;
    };
    dialogs: {
      createTitle: string;
      editTitle: string;
      projectUsersTitle: string;
    };
    roles: {
      owner: string;
      partner: string;
      contractor: string;
      advisor: string;
      admin: string;
    };
    messages: {
      created: string;
      invited: string;
      deleted: string;
    };
  };

  // ============================================
  // ABONNEMENTEN
  // ============================================
  subscription: {
    title: string;
    dialogs: {
      manageTitle: string;
    };
    tiers: {
      free: string;
      basis: string;
      pro: string;
    };
    status: {
      active: string;
      trialing: string;
      canceled: string;
      expired: string;
    };
  };

  // ============================================
  // AANWEZIGHEID
  // ============================================
  attendance: {
    title: string;
    todayPresent: string;
    status: {
      present: string;
      absent: string;
      sick: string;
      vacation: string;
    };
    messages: {
      noAttendance: string;
    };
  };

  // ============================================
  // AI FEATURES
  // ============================================
  ai: {
    costOverview: string;
    scanning: string;
    messages: {
      scanComplete: string;
      scanFailed: string;
    };
  };

  // ============================================
  // NAVIGATIE & TABS
  // ============================================
  navigation: {
    dashboard: string;
    overview: string;
    tasks: string;
    costs: string;
    documents: string;
    photos: string;
    contractors: string;
    contacts: string;
    attendance: string;
    settings: string;
    users: string;
    logout: string;
  };

  // ============================================
  // ONBOARDING
  // ============================================
  onboarding: {
    welcome: string;
    steps: {
      projectsTitle: string;
      projectsDescription: string;
      projectsTip: string;
    };
  };

  // ============================================
  // APP STORE / MARKETING
  // ============================================
  marketing: {
    projectDetails: string;
    taskManagement: string;
    costOverview: string;
  };

  // ============================================
  // ERRORS & VALIDATIE
  // ============================================
  errors: {
    generic: string;
    required: string;
    invalidEmail: string;
    networkError: string;
    unauthorized: string;
    notFound: string;
  };

  // ============================================
  // BEVESTIGINGEN
  // ============================================
  confirmations: {
    deleteTitle: string;
    deleteDescription: string;
    unsavedTitle: string;
    unsavedDescription: string;
    closeWithoutSaving: string;
    backToEditing: string;
  };

  // ============================================
  // TAAL
  // ============================================
  language: {
    label: string;
    dutch: string;
    english: string;
  };

  // ============================================
  // BEHEER
  // ============================================
  management: {
    title: string;
    maintenance: {
      title: string;
      singular: string;
      buttons: {
        new: string;
      };
      dialogs: {
        createTitle: string;
        editTitle: string;
      };
      labels: {
        title: string;
        description: string;
        partOfHouse: string;
        frequency: string;
        contactName: string;
        contactPhone: string;
        attachment: string;
        uploadFile: string;
        chooseFromDocuments: string;
        removeAttachment: string;
        linkedDocument: string;
        periodFrom: string;
        periodTo: string;
        lastMaintenance: string;
        nextMaintenance: string;
      };
      placeholders: {
        title: string;
        description: string;
        partOfHouse: string;
        frequency: string;
        contactName: string;
        contactPhone: string;
      };
      frequencies: {
        weekly: string;
        biweekly: string;
        monthly: string;
        quarterly: string;
        biannual: string;
        yearly: string;
        onFailure: string;
        asNeeded: string;
        custom: string;
        every: string;
        days: string;
        weeks: string;
        months: string;
        years: string;
      };
      status: {
        todo: string;
        inProgress: string;
        done: string;
        onHold: string;
        label: string;
      };
      timeline: {
        groupView: string;
        timelineView: string;
        overdue: string;
        thisWeek: string;
        active: string;
        planned: string;
        noPeriod: string;
        noTasks: string;
      };
      messages: {
        created: string;
        updated: string;
        deleted: string;
        noInstructions: string;
      };
    };
    keys: {
      title: string;
    };
    houseParts: {
      title: string;
      description: string;
      placeholder: string;
      messages: {
        saved: string;
        duplicate: string;
        minOne: string;
        inUse: string;
      };
      entities: {
        tasks: string;
        costs: string;
        photos: string;
        maintenance: string;
        keys: string;
      };
      detail: {
        title: string;
        noItems: string;
        linkedItems: string;
      };
    };
  };
};
