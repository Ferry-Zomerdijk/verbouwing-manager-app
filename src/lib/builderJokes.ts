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

// Weer-specifieke excuses per weertype
export const weatherSpecificExcuses = {
  sunny: [
    "Te veel zonlicht voor nauwkeurig werk ☀️",
    "De zon scheen in m'n ogen, kon niks zien",
    "Te warm, verf droogt te snel op 🥵",
    "Moest even in de schaduw bijkomen",
    "Zonnesteek voorkomen is beter dan genezen",
    "M'n gereedschap werd te heet om vast te houden",
  ],
  partlyCloudy: [
    "Steeds wisselend licht, lastig werken zo",
    "Die wolken voorspellen niet veel goeds...",
    "Wachten tot de zon weer doorkomt",
    "Te onvoorspelbaar weer vandaag ⛅",
  ],
  foggy: [
    "Kon de werkplek niet vinden in de mist 🌫️",
    "Te mistig om veilig te werken",
    "Zag m'n eigen hand niet voor ogen",
    "De mist vreet het hout aan",
    "Wachten tot de mist optrekt",
  ],
  drizzle: [
    "Motregen is erger dan echte regen 🌧️",
    "Alles wordt klam van de motregen",
    "Elektrisch gereedschap + motregen = nee",
    "De druppels maken alles glad",
  ],
  rainy: [
    "Water en elektriciteit gaan niet samen ⚡🌧️",
    "Het hout wordt nat, kan niet verwerken",
    "M'n gereedschap roest van de regen",
    "Veiligheid gaat voor, te glad buiten",
    "De verf hecht niet bij deze vochtigheid",
    "Regenwater in de bouwput, eerst leegpompen",
  ],
  snowy: [
    "Sneeuw op het dak, te gevaarlijk ❄️",
    "M'n vingers vriezen aan het gereedschap",
    "Mortel bevriest, kan niet metselen",
    "Eerst sneeuwruimen, dan pas werken",
    "De steigers zijn te glad ⛄",
  ],
  stormy: [
    "Bij onweer op het dak? Geen optie! ⚡",
    "Bliksem + metalen gereedschap = slecht idee",
    "Storm waarschuwing, alles vastzetten",
    "Vliegende dakpannen, binnen blijven!",
  ],
};

// Algemene excuses als fallback
export const weatherExcuses = [
  "Kon niet werken door onverwachte weersomstandigheden",
  "De weersvoorspelling was onduidelijk",
  "M'n gereedschap moest acclimatiseren",
  "De barometer stond op 'twijfelachtig'",
  "Het weer is niet te vertrouwen vandaag",
  "Eerst even kijken hoe het weer zich ontwikkelt",
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

// Bepaal weertype op basis van Open-Meteo weather code
const getWeatherType = (code: number | null): keyof typeof weatherSpecificExcuses | null => {
  if (code === null) return null;
  if (code === 0) return "sunny";
  if (code <= 3) return "partlyCloudy";
  if (code <= 48) return "foggy";
  if (code <= 55) return "drizzle";
  if (code <= 67) return "rainy";
  if (code <= 77) return "snowy";
  if (code <= 82) return "rainy";
  return "stormy";
};

export const getRandomWisdom = () =>
  builderWisdom[Math.floor(Math.random() * builderWisdom.length)];

export const getRandomExcuse = (weatherCode?: number | null) => {
  const weatherType = getWeatherType(weatherCode ?? null);
  
  if (weatherType && weatherSpecificExcuses[weatherType]) {
    const excuses = weatherSpecificExcuses[weatherType];
    return excuses[Math.floor(Math.random() * excuses.length)];
  }
  
  return weatherExcuses[Math.floor(Math.random() * weatherExcuses.length)];
};

export const getRandomCompletionMessage = () =>
  completionMessages[Math.floor(Math.random() * completionMessages.length)];
