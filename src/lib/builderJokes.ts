// Bouwvakker wijsheden en grappen

export const builderWisdom = [
  "Meten is weten, maar gissen is missen... dus we doen het gewoon nog een keer.",
  "Geen koffie, geen klussen. ☕",
  "Het staat scheef? Nee joh, de wereld staat scheef.",
  "Twee keer meten, één keer zagen. Of andersom, we zien wel.",
  "Dit is geen probleem, dit is een 'design feature'.",
  "Morgen komt het goed. Of overmorgen. Maximaal volgende week.",
  "Wie heeft de waterpas weer meegenomen?!",
  "Als de opdrachtgever het niet ziet, is het niet scheef.",
  "Foutje? Noem het 'handgemaakt karakter'.",
  "Het budget is op, maar de creativiteit niet!",
  "Even pauze, de hersenen moeten ook rusten.",
  "Koffie is de brandstof van de bouw.",
  "Die schroef zat er al, ik heb 'm alleen... verplaatst.",
  "Het klopt niet? Dan klopt de tekening niet.",
  "Rust roest, maar koffie smeert!",
];

export const weatherExcuses = [
  "Kon niet werken door onverwachte zonnestralen ☀️",
  "Te veel wind voor precisiewerk 💨",
  "Het zag eruit alsof het ging regenen 🌧️",
  "De lucht was te vochtig voor het materiaal 💧",
  "Te warm om veilig te werken 🥵",
  "Te koud, de spieren moeten eerst opwarmen 🥶",
  "De zon scheen in m'n ogen",
  "De schaduw viel verkeerd",
  "M'n gereedschap moest acclimatiseren",
  "De weersvoorspelling was onduidelijk",
  "Er hing een onheilspellende wolk",
  "De barometer stond op 'twijfelachtig'",
];

export const emptyStateMessages = {
  tasks: {
    allDone: "Alle taken gedaan! Tijd voor een welverdiende koffiepauze. ☕",
    noTasks: "Nog geen taken? Dan is het tijd voor... koffie! ☕",
  },
  costs: {
    noCosts: "Nog geen kosten! Dit project loopt verdacht goed... 🤔",
    zeroBudget: "€0 uitgegeven? Is dit een droomproject?",
  },
  projects: {
    noProjects: "Nog geen projecten? Tijd om die gereedschapskist af te stoffen!",
  },
};

export const completionMessages = [
  "Klaar! Nu alleen nog die 47 'kleine dingetjes' die de opdrachtgever vergeten was te noemen... 😅",
  "100%! Tijd om te vieren met een extra koffiepauze! 🎉☕",
  "Alles af! Maar... wacht, was er niet nog iets? Nee hoor, FEEST! 🎊",
  "Missie volbracht! De bouwvakker-goden zijn trots op je! 🏗️✨",
  "Perfect! Nu snel weg voordat ze meer werk bedenken! 🏃‍♂️",
];

export const getRandomWisdom = () =>
  builderWisdom[Math.floor(Math.random() * builderWisdom.length)];

export const getRandomExcuse = () =>
  weatherExcuses[Math.floor(Math.random() * weatherExcuses.length)];

export const getRandomCompletionMessage = () =>
  completionMessages[Math.floor(Math.random() * completionMessages.length)];
