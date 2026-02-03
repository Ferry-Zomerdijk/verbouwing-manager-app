import { UITexts } from './types';

/**
 * English translations
 */
export const en: UITexts = {
  actions: {
    save: "Save",
    saving: "Saving...",
    cancel: "Cancel",
    delete: "Delete",
    deleting: "Deleting...",
    edit: "Edit",
    create: "Create",
    creating: "Creating...",
    add: "Add",
    adding: "Adding...",
    close: "Close",
    confirm: "Confirm",
    back: "Back",
    next: "Next",
    previous: "Previous",
    search: "Search",
    filter: "Filter",
    export: "Export",
    import: "Import",
    upload: "Upload",
    uploading: "Uploading...",
    download: "Download",
    refresh: "Refresh",
    loading: "Loading...",
    processing: "Processing...",
  },

  tasks: {
    title: "Tasks",
    singular: "Task",
    buttons: {
      new: "New task",
      create: "Create task",
    },
    dialogs: {
      createTitle: "New task",
      editTitle: "Edit task",
    },
    status: {
      todo: "To do",
      inProgress: "In progress",
      done: "Done",
    },
    priority: {
      low: "Low",
      medium: "Medium",
      high: "High",
    },
    labels: {
      title: "Title",
      description: "Description",
      status: "Status",
      priority: "Priority",
      responsible: "Assignee",
      startDate: "Start date",
      deadline: "Deadline",
      partOfHouse: "Part of house",
      type: "Task type",
      images: "Photos",
      updates: "Updates",
    },
    placeholders: {
      title: "Task title",
      description: "Task description...",
      responsible: "Type a name...",
      partOfHouse: "Type or select...",
      selectType: "Select type...",
      selectDate: "Select date",
    },
    messages: {
      created: "Task successfully created!",
      updated: "Task updated",
      deleted: "Task deleted",
      noTasks: "No tasks",
      unsavedChanges: "You have unsaved changes",
      deadlineBeforeStart: "Deadline cannot be before start date",
    },
  },

  projects: {
    title: "Projects",
    singular: "Project",
    buttons: {
      new: "New project",
      create: "Create project",
    },
    dialogs: {
      createTitle: "New renovation project",
      editTitle: "Edit project",
    },
    labels: {
      name: "Project name",
      description: "Description",
      type: "Project type",
      status: "Status",
      startDate: "Start date",
      endDate: "End date",
      budget: "Budget",
      progress: "Progress",
    },
    status: {
      planned: "Planned",
      inProgress: "In progress",
      completed: "Completed",
    },
    messages: {
      created: "Project successfully created!",
      updated: "Project updated",
      deleted: "Project deleted",
      noProjects: "No projects yet",
    },
  },

  costs: {
    title: "Costs",
    singular: "Cost item",
    overview: "Cost overview",
    buttons: {
      new: "New cost item",
    },
    dialogs: {
      createTitle: "New cost item",
      createDescription: "Add a new cost item by entering data manually or uploading an invoice.",
      editTitle: "Edit cost",
      payersTitle: "Manage payers",
      categoriesTitle: "Manage categories",
      categoriesDescription: "Configure categories for your costs. Categories help you group expenses by type.",
    },
    labels: {
      amount: "Amount",
      category: "Category",
      description: "Description",
      date: "Date",
      supplier: "Supplier",
      paidBy: "Paid by",
      status: "Status",
      partOfHouse: "Part of house",
      invoice: "Invoice",
    },
    status: {
      estimate: "Estimate",
      quote: "Quote",
      invoice: "Invoice",
    },
    category: {
      material: "Material",
      labor: "Labor",
      permits: "Permits",
      other: "Other",
      diy: "DIY work",
      decoration: "Decoration",
      furniture: "Furniture",
    },
    messages: {
      created: "Cost item added!",
      updated: "Cost item updated",
      deleted: "Cost item deleted",
      noCosts: "No costs registered yet",
    },
  },

  contractors: {
    title: "Contractors",
    singular: "Contractor",
    buttons: {
      new: "New contractor",
    },
    dialogs: {
      createTitle: "New contractor",
      editTitle: "Edit contractor",
    },
    labels: {
      name: "Name",
      firstName: "First name",
      lastName: "Last name",
      company: "Company",
      role: "Role",
      email: "Email",
      phone: "Phone",
      address: "Address",
      website: "Website",
      notes: "Notes",
      active: "Active",
    },
    messages: {
      created: "Contractor added!",
      updated: "Contractor updated!",
      deleted: "Contractor deleted",
      noContractors: "No contractors added yet",
    },
  },

  contacts: {
    title: "Contacts",
    singular: "Contact",
    buttons: {
      new: "New contact",
      newCategory: "New category",
    },
    dialogs: {
      createTitle: "New contact",
      editTitle: "Edit contact",
      categoryCreateTitle: "New category",
      categoryEditTitle: "Edit category",
      categoriesManagerTitle: "Manage categories",
      categoriesManagerDescription: "Configure categories for your contacts. Categories help you group contacts by specialty.",
    },
    messages: {
      noContacts: "No contacts in this category yet",
      categoriesSaved: "Categories saved",
      minOneCategory: "Add at least one category",
    },
  },

  documents: {
    title: "Documents",
    singular: "Document",
    buttons: {
      upload: "Upload document",
    },
    types: {
      quote: "Quote",
      permit: "Permit",
      manual: "Manual",
      warranty: "Warranty",
      contract: "Contract",
      floorplan: "Floor plan",
      other: "Other",
    },
    messages: {
      uploaded: "Document uploaded!",
      deleted: "Document deleted",
      noDocuments: "No documents yet",
    },
  },

  photos: {
    title: "Photos",
    singular: "Photo",
    buttons: {
      upload: "Upload photo",
    },
    phases: {
      before: "Before",
      during: "During",
      after: "After",
    },
    messages: {
      uploaded: "Photo uploaded!",
      deleted: "Photo deleted",
      noPhotos: "No photos yet",
    },
  },

  users: {
    title: "Users",
    singular: "User",
    platformUsers: "Platform users",
    projectUsers: "Project users",
    buttons: {
      new: "New user",
      invite: "Invite new user",
    },
    dialogs: {
      createTitle: "Add new user",
      editTitle: "Edit platform user",
      projectUsersTitle: "Manage project users",
    },
    roles: {
      owner: "Owner",
      partner: "Partner",
      contractor: "Contractor",
      advisor: "Advisor",
      admin: "Admin",
    },
    messages: {
      created: "User successfully created",
      invited: "Invitation sent!",
      deleted: "User deleted",
    },
  },

  subscription: {
    title: "Subscription",
    dialogs: {
      manageTitle: "Manage subscription",
    },
    tiers: {
      free: "Free",
      basis: "Basic",
      pro: "Pro",
    },
    status: {
      active: "Active",
      trialing: "Trial",
      canceled: "Canceled",
      expired: "Expired",
    },
  },

  attendance: {
    title: "Attendance",
    todayPresent: "Present today",
    status: {
      present: "Present",
      absent: "Absent",
      sick: "Sick",
      vacation: "Vacation",
    },
    messages: {
      noAttendance: "No attendance registered today",
    },
  },

  ai: {
    costOverview: "AI cost overview",
    scanning: "AI analysis in progress...",
    messages: {
      scanComplete: "AI analysis completed",
      scanFailed: "AI analysis failed",
    },
  },

  navigation: {
    dashboard: "Dashboard",
    overview: "Overview",
    tasks: "Tasks",
    costs: "Costs",
    documents: "Documents",
    photos: "Photos",
    contractors: "Contractors",
    contacts: "Contacts",
    attendance: "Attendance",
    settings: "Settings",
    users: "Users",
    logout: "Log out",
  },

  onboarding: {
    welcome: "Welcome to The Renovation App!",
    steps: {
      projectsTitle: "Create projects",
      projectsDescription: "Start by creating your first renovation project. Add details like budget, planning, and description.",
      projectsTip: "Click 'New project' to get started",
    },
  },

  marketing: {
    projectDetails: "Project details",
    taskManagement: "Task management",
    costOverview: "Cost overview",
  },

  errors: {
    generic: "An error occurred",
    required: "This field is required",
    invalidEmail: "Invalid email address",
    networkError: "Network error, please try again",
    unauthorized: "You don't have access to this feature",
    notFound: "Not found",
  },

  confirmations: {
    deleteTitle: "Confirm deletion",
    deleteDescription: "This cannot be undone.",
    unsavedTitle: "Unsaved changes",
    unsavedDescription: "You have made changes that haven't been saved yet. Are you sure you want to close? Your changes will be lost.",
    closeWithoutSaving: "Close without saving",
    backToEditing: "Back to editing",
  },

  language: {
    label: "Language",
    dutch: "Nederlands",
    english: "English",
  },
};
