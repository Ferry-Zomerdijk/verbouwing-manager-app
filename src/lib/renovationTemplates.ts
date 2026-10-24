export interface TemplateTask {
  titel: string;
  beschrijving: string | null;
  deel_van_huis: string;
  prioriteit: 'Hoog' | 'Middel' | 'Laag';
  volgorde: number;
  vergunning_gerelateerd?: boolean;
  dagen_offset?: number;
}

export interface PermitInfo {
  naam: string;
  beschrijving: string;
  instantie: string;
  link?: string;
  wanneer_nodig: string;
}

export interface RenovationTemplate {
  id: string;
  naam: string;
  beschrijving: string;
  icon: string;
  geschatte_doorlooptijd: string;
  vergunningen: PermitInfo[];
  taken: TemplateTask[];
  tips: string[];
}

export const renovationTemplates: RenovationTemplate[] = [
  {
    id: 'woning',
    naam: 'Complete woningrenovatie',
    beschrijving: 'Volledige renovatie van een woning: van sloop en installaties tot afwerking.',
    icon: 'Home',
    geschatte_doorlooptijd: '3-9 maanden',
    vergunningen: [
      {
        naam: 'Omgevingsvergunning bouwen',
        beschrijving: 'Nodig bij constructieve wijzigingen of aanpassingen aan de gevel.',
        instantie: 'Gemeente',
        wanneer_nodig: 'Bij dragende muren, gevelwijzigingen of uitbreidingen',
        link: 'https://www.omgevingsloket.nl',
      },
    ],
    taken: [
      { titel: 'Bouwkundige keuring laten uitvoeren', beschrijving: null, deel_van_huis: 'Woning', prioriteit: 'Hoog', volgorde: 1 },
      { titel: 'Budget en planning opstellen', beschrijving: null, deel_van_huis: 'Woning', prioriteit: 'Hoog', volgorde: 2 },
      { titel: 'Offertes aannemers opvragen', beschrijving: null, deel_van_huis: 'Woning', prioriteit: 'Hoog', volgorde: 3 },
      { titel: 'Vergunning controleren en aanvragen', beschrijving: null, deel_van_huis: 'Woning', prioriteit: 'Hoog', volgorde: 4, vergunning_gerelateerd: true },
      { titel: 'Sloopwerk', beschrijving: null, deel_van_huis: 'Woning', prioriteit: 'Middel', volgorde: 5 },
      { titel: 'Elektrische installatie vernieuwen', beschrijving: null, deel_van_huis: 'Elektrische installatie', prioriteit: 'Hoog', volgorde: 6 },
      { titel: 'Waterleiding en afvoer vernieuwen', beschrijving: null, deel_van_huis: 'Waterleiding en sanitair', prioriteit: 'Hoog', volgorde: 7 },
      { titel: 'Isolatie dak, vloer en gevels', beschrijving: null, deel_van_huis: 'Dak', prioriteit: 'Middel', volgorde: 8 },
      { titel: 'Ramen en deuren vervangen', beschrijving: null, deel_van_huis: 'Ramen en deuren', prioriteit: 'Middel', volgorde: 9 },
      { titel: 'Keuken plaatsen', beschrijving: null, deel_van_huis: 'Keuken', prioriteit: 'Middel', volgorde: 10 },
      { titel: 'Badkamer plaatsen', beschrijving: null, deel_van_huis: 'Badkamer', prioriteit: 'Middel', volgorde: 11 },
      { titel: 'Stucwerk en schilderwerk', beschrijving: null, deel_van_huis: 'Woonkamer', prioriteit: 'Laag', volgorde: 12 },
      { titel: 'Vloeren leggen', beschrijving: null, deel_van_huis: 'Woonkamer', prioriteit: 'Laag', volgorde: 13 },
      { titel: 'Oplevering en restpunten', beschrijving: null, deel_van_huis: 'Woning', prioriteit: 'Middel', volgorde: 14 },
    ],
    tips: ['Begin met installaties voordat je afwerkt', 'Houd 10-15% reserve aan in je budget'],
  },
  {
    id: 'badkamer',
    naam: 'Badkamer Renovatie',
    beschrijving: 'Complete checklist voor het renoveren van een badkamer, van ontwerp tot oplevering.',
    icon: 'ShowerHead',
    geschatte_doorlooptijd: '4-8 weken',
    vergunningen: [
      {
        naam: 'Omgevingsvergunning bouwen',
        beschrijving: 'Nodig bij constructieve wijzigingen aan dragende muren of vloeren.',
        instantie: 'Gemeente',
        wanneer_nodig: 'Bij verwijderen of verplaatsen van dragende muren of vloerdelen',
        link: 'https://www.rijksoverheid.nl/onderwerpen/bouwregelgeving'
      },
      {
        naam: 'Rioolmelding',
        beschrijving: 'Melding vereist bij wijziging van de rioolaansluiting.',
        instantie: 'Waterschap',
        wanneer_nodig: 'Bij verplaatsen van toilet of wijzigen van afvoerleidingen'
      }
    ],
    taken: [
      { titel: 'Huidige situatie opmeten en fotograferen', beschrijving: 'Maak gedetailleerde foto\'s en meetgegevens voor referentie', deel_van_huis: 'Badkamer', prioriteit: 'Hoog', volgorde: 1 },
      { titel: 'Wensen en budget bepalen', beschrijving: 'Maak een lijst van must-haves en nice-to-haves', deel_van_huis: 'Badkamer', prioriteit: 'Hoog', volgorde: 2 },
      { titel: 'Ontwerp maken', beschrijving: 'Zelf schetsen of architect/badkamerspecialist inschakelen', deel_van_huis: 'Badkamer', prioriteit: 'Hoog', volgorde: 3 },
      { titel: 'Controleren of vergunning nodig is', beschrijving: 'Check bij gemeente voor constructieve wijzigingen', deel_van_huis: 'Badkamer', prioriteit: 'Hoog', volgorde: 4, vergunning_gerelateerd: true },
      { titel: 'Offertes aanvragen (minimaal 3)', beschrijving: 'Vraag offertes aan bij verschillende aannemers/installateurs', deel_van_huis: 'Badkamer', prioriteit: 'Hoog', volgorde: 5 },
      { titel: 'Aannemer/installateur kiezen', beschrijving: 'Vergelijk offertes, reviews en referenties', deel_van_huis: 'Badkamer', prioriteit: 'Hoog', volgorde: 6 },
      { titel: 'Sanitair en tegels bestellen', beschrijving: 'Let op levertijden van 4-8 weken', deel_van_huis: 'Badkamer', prioriteit: 'Hoog', volgorde: 7, dagen_offset: 7 },
      { titel: 'Alternatieve douchegelegenheid regelen', beschrijving: 'Regel een tijdelijke oplossing tijdens de verbouwing', deel_van_huis: 'Badkamer', prioriteit: 'Middel', volgorde: 8 },
      { titel: 'Oude sanitair demonteren', beschrijving: 'Toilet, wastafel, bad/douche verwijderen', deel_van_huis: 'Badkamer', prioriteit: 'Middel', volgorde: 9, dagen_offset: 14 },
      { titel: 'Oude tegels en afwerking verwijderen', beschrijving: 'Wand- en vloertegels verwijderen', deel_van_huis: 'Badkamer', prioriteit: 'Middel', volgorde: 10 },
      { titel: 'Leidingwerk controleren en aanpassen', beschrijving: 'Water, afvoer en eventueel gasleiding', deel_van_huis: 'Badkamer', prioriteit: 'Hoog', volgorde: 11 },
      { titel: 'Elektra aanleggen/aanpassen', beschrijving: 'Stopcontacten, verlichting, ventilator', deel_van_huis: 'Badkamer', prioriteit: 'Hoog', volgorde: 12 },
      { titel: 'Ventilatie installeren of verbeteren', beschrijving: 'Mechanische ventilatie of raam check', deel_van_huis: 'Badkamer', prioriteit: 'Hoog', volgorde: 13 },
      { titel: 'Vloerverwarming aanleggen (optioneel)', beschrijving: 'Elektrische of watergedragen vloerverwarming', deel_van_huis: 'Badkamer', prioriteit: 'Laag', volgorde: 14 },
      { titel: 'Waterdichte laag aanbrengen', beschrijving: 'Essentieel voor douche- en badzone', deel_van_huis: 'Badkamer', prioriteit: 'Hoog', volgorde: 15 },
      { titel: 'Vloertegels leggen', beschrijving: 'Inclusief uitharden en voegen', deel_van_huis: 'Badkamer', prioriteit: 'Middel', volgorde: 16 },
      { titel: 'Wandtegels zetten', beschrijving: 'Inclusief uitharden en voegen', deel_van_huis: 'Badkamer', prioriteit: 'Middel', volgorde: 17 },
      { titel: 'Plafond afwerken', beschrijving: 'Schilderen of systeemplafond plaatsen', deel_van_huis: 'Badkamer', prioriteit: 'Laag', volgorde: 18 },
      { titel: 'Douche/bad plaatsen', beschrijving: 'Inclusief aansluiten en aftesten', deel_van_huis: 'Badkamer', prioriteit: 'Hoog', volgorde: 19 },
      { titel: 'Toilet plaatsen', beschrijving: 'Inclusief aansluiten en aftesten', deel_van_huis: 'Badkamer', prioriteit: 'Hoog', volgorde: 20 },
      { titel: 'Wastafel en meubel plaatsen', beschrijving: 'Inclusief kraan en sifon', deel_van_huis: 'Badkamer', prioriteit: 'Middel', volgorde: 21 },
      { titel: 'Radiator of handdoekdroger plaatsen', beschrijving: 'Aansluiten op cv of elektrisch', deel_van_huis: 'Badkamer', prioriteit: 'Middel', volgorde: 22 },
      { titel: 'Kitwerk rondom sanitair', beschrijving: 'Waterdicht afwerken van alle naden', deel_van_huis: 'Badkamer', prioriteit: 'Hoog', volgorde: 23 },
      { titel: 'Verlichting en accessoires ophangen', beschrijving: 'Spiegels, haken, plankjes etc.', deel_van_huis: 'Badkamer', prioriteit: 'Laag', volgorde: 24 },
      { titel: 'Eindcontrole en oplevering', beschrijving: 'Alles testen en eventuele gebreken noteren', deel_van_huis: 'Badkamer', prioriteit: 'Hoog', volgorde: 25 }
    ],
    tips: [
      'Plan de verbouwing buiten vakantieperiodes voor betere beschikbaarheid van vakmensen',
      'Houd rekening met 10-15% onvoorziene kosten in je budget',
      'Bestel sanitair en tegels ruim op tijd - levertijd kan 6-8 weken zijn',
      'Maak duidelijke afspraken over wie het afval afvoert',
      'Vraag naar garanties op materialen en arbeid'
    ]
  },
  {
    id: 'keuken',
    naam: 'Keuken Renovatie',
    beschrijving: 'Van keukenontwerp tot werkende keuken, inclusief alle technische aansluitingen.',
    icon: 'ChefHat',
    geschatte_doorlooptijd: '3-6 weken',
    vergunningen: [
      {
        naam: 'Omgevingsvergunning bouwen',
        beschrijving: 'Nodig bij constructieve wijzigingen zoals het verwijderen van dragende muren.',
        instantie: 'Gemeente',
        wanneer_nodig: 'Bij doorbraak naar woonkamer of verwijderen dragende muur'
      },
      {
        naam: 'Gasinstallatie certificering',
        beschrijving: 'Gaswerk moet door erkend installateur worden uitgevoerd.',
        instantie: 'Erkend installateur',
        wanneer_nodig: 'Bij wijziging van gasleiding of plaatsen gasfornuis'
      }
    ],
    taken: [
      { titel: 'Huidige keuken opmeten', beschrijving: 'Exacte maten inclusief ramen, deuren en aansluitpunten', deel_van_huis: 'Keuken', prioriteit: 'Hoog', volgorde: 1 },
      { titel: 'Wensen en kookgewoontes bepalen', beschrijving: 'Hoeveel kook je? Welke apparatuur? Eetbar?', deel_van_huis: 'Keuken', prioriteit: 'Hoog', volgorde: 2 },
      { titel: 'Budget bepalen', beschrijving: 'Inclusief apparatuur en installatie', deel_van_huis: 'Keuken', prioriteit: 'Hoog', volgorde: 3 },
      { titel: 'Keukenontwerp maken', beschrijving: 'Zelf of bij keukenzaak/ontwerper', deel_van_huis: 'Keuken', prioriteit: 'Hoog', volgorde: 4 },
      { titel: 'Apparatuur kiezen', beschrijving: 'Kookplaat, oven, koelkast, vaatwasser etc.', deel_van_huis: 'Keuken', prioriteit: 'Hoog', volgorde: 5 },
      { titel: 'Offertes aanvragen', beschrijving: 'Bij meerdere keukenleveranciers en installateurs', deel_van_huis: 'Keuken', prioriteit: 'Hoog', volgorde: 6 },
      { titel: 'Controleren of vergunning nodig is', beschrijving: 'Bij doorbraak of constructieve wijzigingen', deel_van_huis: 'Keuken', prioriteit: 'Hoog', volgorde: 7, vergunning_gerelateerd: true },
      { titel: 'Keuken en apparatuur bestellen', beschrijving: 'Let op levertijden van 4-12 weken', deel_van_huis: 'Keuken', prioriteit: 'Hoog', volgorde: 8 },
      { titel: 'Tijdelijke kookgelegenheid regelen', beschrijving: 'Campingkooktoestel, magnetron, etc.', deel_van_huis: 'Keuken', prioriteit: 'Middel', volgorde: 9 },
      { titel: 'Oude keuken demonteren', beschrijving: 'Kasten, aanrecht, apparatuur verwijderen', deel_van_huis: 'Keuken', prioriteit: 'Middel', volgorde: 10, dagen_offset: 14 },
      { titel: 'Eventuele doorbraak realiseren', beschrijving: 'Door erkend aannemer met constructieberekening', deel_van_huis: 'Keuken', prioriteit: 'Hoog', volgorde: 11 },
      { titel: 'Elektra aanpassen/uitbreiden', beschrijving: 'Voldoende groepen en stopcontacten', deel_van_huis: 'Keuken', prioriteit: 'Hoog', volgorde: 12 },
      { titel: 'Waterleiding aanpassen', beschrijving: 'Aanvoer en afvoer voor spoelbak', deel_van_huis: 'Keuken', prioriteit: 'Hoog', volgorde: 13 },
      { titel: 'Gasleiding aanpassen (indien nodig)', beschrijving: 'Door erkend installateur', deel_van_huis: 'Keuken', prioriteit: 'Hoog', volgorde: 14 },
      { titel: 'Afzuigkanaal aanleggen', beschrijving: 'Naar buiten of recirculatie', deel_van_huis: 'Keuken', prioriteit: 'Middel', volgorde: 15 },
      { titel: 'Vloer egaliseren (indien nodig)', beschrijving: 'Vlakke ondergrond voor keuken', deel_van_huis: 'Keuken', prioriteit: 'Middel', volgorde: 16 },
      { titel: 'Nieuwe vloer leggen (optioneel)', beschrijving: 'Tegels, pvc of laminaat', deel_van_huis: 'Keuken', prioriteit: 'Laag', volgorde: 17 },
      { titel: 'Keukenkasten plaatsen', beschrijving: 'Onder- en bovenkasten waterpas monteren', deel_van_huis: 'Keuken', prioriteit: 'Hoog', volgorde: 18 },
      { titel: 'Werkblad plaatsen', beschrijving: 'Inclusief uitsparingen voor spoelbak en kookplaat', deel_van_huis: 'Keuken', prioriteit: 'Hoog', volgorde: 19 },
      { titel: 'Spoelbak en kraan monteren', beschrijving: 'Aansluiten op water en afvoer', deel_van_huis: 'Keuken', prioriteit: 'Hoog', volgorde: 20 },
      { titel: 'Apparatuur inbouwen', beschrijving: 'Kookplaat, oven, afzuigkap, vaatwasser', deel_van_huis: 'Keuken', prioriteit: 'Hoog', volgorde: 21 },
      { titel: 'Spatwand plaatsen', beschrijving: 'Tegels, glas of ander materiaal', deel_van_huis: 'Keuken', prioriteit: 'Middel', volgorde: 22 },
      { titel: 'Verlichting installeren', beschrijving: 'Werkblad- en sfeerverlichting', deel_van_huis: 'Keuken', prioriteit: 'Middel', volgorde: 23 },
      { titel: 'Afwerking en kitwerk', beschrijving: 'Naden dichten, plinten plaatsen', deel_van_huis: 'Keuken', prioriteit: 'Middel', volgorde: 24 },
      { titel: 'Eindcontrole en oplevering', beschrijving: 'Alles testen en checken', deel_van_huis: 'Keuken', prioriteit: 'Hoog', volgorde: 25 }
    ],
    tips: [
      'De werkdriehoek (koelkast-spoelbak-kookplaat) bepaalt het werkgemak',
      'Investeer in goede verlichting boven het werkblad',
      'Plan voldoende stopcontacten in, liefst achter apparaten verborgen',
      'Kies tijdloze basiskasten en accentueer met kleur in accessoires',
      'Vraag naar showroomkorting bij keukenzaken'
    ]
  },
  {
    id: 'dakkapel',
    naam: 'Dakkapel Plaatsen',
    beschrijving: 'Alles voor het plaatsen van een dakkapel, van vergunning tot afwerking.',
    icon: 'Home',
    geschatte_doorlooptijd: '1-3 weken',
    vergunningen: [
      {
        naam: 'Omgevingsvergunning bouwen',
        beschrijving: 'Meestal verplicht, tenzij de dakkapel voldoet aan alle vergunningvrije voorwaarden.',
        instantie: 'Gemeente',
        wanneer_nodig: 'Bij dakkapellen groter dan 4m breed of niet aan achterzijde',
        link: 'https://www.rijksoverheid.nl/onderwerpen/bouwregelgeving/vergunningvrij-bouwen'
      },
      {
        naam: 'Welstandstoets',
        beschrijving: 'De dakkapel moet passen bij het straatbeeld.',
        instantie: 'Gemeente/Welstandscommissie',
        wanneer_nodig: 'Altijd bij vergunningaanvraag'
      }
    ],
    taken: [
      { titel: 'Wensen en doel bepalen', beschrijving: 'Meer ruimte? Meer licht? Sta-hoogte?', deel_van_huis: 'Dak', prioriteit: 'Hoog', volgorde: 1 },
      { titel: 'Vergunningscheck doen', beschrijving: 'Via omgevingsloket.nl of gemeente', deel_van_huis: 'Dak', prioriteit: 'Hoog', volgorde: 2, vergunning_gerelateerd: true },
      { titel: 'Maatvoering bepalen', beschrijving: 'Maximale maten binnen vergunningvrij of gewenste maten', deel_van_huis: 'Dak', prioriteit: 'Hoog', volgorde: 3 },
      { titel: 'Type dakkapel kiezen', beschrijving: 'Plat dak, zadeldak, lessenaarsdak', deel_van_huis: 'Dak', prioriteit: 'Hoog', volgorde: 4 },
      { titel: 'Offertes aanvragen', beschrijving: 'Bij meerdere dakkapelbouwers', deel_van_huis: 'Dak', prioriteit: 'Hoog', volgorde: 5 },
      { titel: 'Constructieberekening laten maken', beschrijving: 'Nodig voor vergunning en uitvoering', deel_van_huis: 'Dak', prioriteit: 'Hoog', volgorde: 6 },
      { titel: 'Vergunning aanvragen (indien nodig)', beschrijving: 'Proceduretijd 8 weken', deel_van_huis: 'Dak', prioriteit: 'Hoog', volgorde: 7, vergunning_gerelateerd: true },
      { titel: 'Aannemer definitief kiezen', beschrijving: 'Na vergelijken offertes en vergunning', deel_van_huis: 'Dak', prioriteit: 'Hoog', volgorde: 8 },
      { titel: 'Startdatum plannen', beschrijving: 'Liefst droge periode', deel_van_huis: 'Dak', prioriteit: 'Middel', volgorde: 9 },
      { titel: 'Zolder leegruimen', beschrijving: 'Werkruimte voor monteurs', deel_van_huis: 'Dak', prioriteit: 'Middel', volgorde: 10, dagen_offset: -1 },
      { titel: 'Opening in dak maken', beschrijving: 'Dakbedekking en spanten verwijderen', deel_van_huis: 'Dak', prioriteit: 'Hoog', volgorde: 11 },
      { titel: 'Dakkapel plaatsen', beschrijving: 'Meestal prefab, in 1 dag te plaatsen', deel_van_huis: 'Dak', prioriteit: 'Hoog', volgorde: 12 },
      { titel: 'Waterdicht maken', beschrijving: 'Aansluitingen met dak afwerken', deel_van_huis: 'Dak', prioriteit: 'Hoog', volgorde: 13 },
      { titel: 'Isolatie aanbrengen', beschrijving: 'Wanden, dak en vloer van dakkapel', deel_van_huis: 'Dak', prioriteit: 'Hoog', volgorde: 14 },
      { titel: 'Elektra aanleggen', beschrijving: 'Verlichting en stopcontacten', deel_van_huis: 'Dak', prioriteit: 'Middel', volgorde: 15 },
      { titel: 'Binnenwanden afwerken', beschrijving: 'Gipsplaten, stucwerk of hout', deel_van_huis: 'Dak', prioriteit: 'Middel', volgorde: 16 },
      { titel: 'Ramen en kozijnen controleren', beschrijving: 'Sluitwerk en tochtstrips checken', deel_van_huis: 'Dak', prioriteit: 'Middel', volgorde: 17 },
      { titel: 'Schilderwerk binnen', beschrijving: 'Muren, kozijnen, eventueel behangen', deel_van_huis: 'Dak', prioriteit: 'Laag', volgorde: 18 },
      { titel: 'Vloer afwerken', beschrijving: 'Laminaat, vloerbedekking of planken', deel_van_huis: 'Dak', prioriteit: 'Laag', volgorde: 19 },
      { titel: 'Eindcontrole en oplevering', beschrijving: 'Alles nakijken en gebreken melden', deel_van_huis: 'Dak', prioriteit: 'Hoog', volgorde: 20 }
    ],
    tips: [
      'Een vergunningvrije dakkapel is max 4m breed en aan de achterzijde',
      'Kies voor prefab: sneller, goedkoper en minder risico op lekkage',
      'Plan plaatsing in droge periode (april-september)',
      'Check of je VvE toestemming moet geven',
      'Overweeg direct dakraam of ventilatieroosters mee te nemen'
    ]
  },
  {
    id: 'aanbouw',
    naam: 'Aanbouw / Uitbouw',
    beschrijving: 'Complete checklist voor het realiseren van een aanbouw of uitbouw.',
    icon: 'Building2',
    geschatte_doorlooptijd: '8-16 weken',
    vergunningen: [
      {
        naam: 'Omgevingsvergunning bouwen',
        beschrijving: 'Bijna altijd verplicht voor aanbouwen, tenzij kleine uitbouw aan achterzijde.',
        instantie: 'Gemeente',
        wanneer_nodig: 'Bij aanbouwen groter dan 4m diep of aan voorzijde',
        link: 'https://www.rijksoverheid.nl/onderwerpen/bouwregelgeving'
      },
      {
        naam: 'Constructieberekening',
        beschrijving: 'Verplicht onderdeel van de vergunningaanvraag.',
        instantie: 'Constructeur',
        wanneer_nodig: 'Altijd bij vergunningsplichtige aanbouw'
      },
      {
        naam: 'Welstandstoets',
        beschrijving: 'De aanbouw moet passen bij de woning en de omgeving.',
        instantie: 'Gemeente/Welstandscommissie',
        wanneer_nodig: 'Altijd bij vergunningaanvraag'
      }
    ],
    taken: [
      { titel: 'Wensen en doelen bepalen', beschrijving: 'Meer woonruimte? Grotere keuken? Extra kamer?', deel_van_huis: 'Aanbouw', prioriteit: 'Hoog', volgorde: 1 },
      { titel: 'Haalbaarheid onderzoeken', beschrijving: 'Bestemmingsplan en erfgrenzen checken', deel_van_huis: 'Aanbouw', prioriteit: 'Hoog', volgorde: 2 },
      { titel: 'Budget bepalen', beschrijving: 'Reken €1.500-2.500 per m² voor complete aanbouw', deel_van_huis: 'Aanbouw', prioriteit: 'Hoog', volgorde: 3 },
      { titel: 'Architect of bouwkundig tekenaar inschakelen', beschrijving: 'Voor ontwerp en vergunningtekeningen', deel_van_huis: 'Aanbouw', prioriteit: 'Hoog', volgorde: 4 },
      { titel: 'Vergunningscheck doen', beschrijving: 'Via omgevingsloket of gemeente', deel_van_huis: 'Aanbouw', prioriteit: 'Hoog', volgorde: 5, vergunning_gerelateerd: true },
      { titel: 'Constructeur inschakelen', beschrijving: 'Voor berekeningen fundering en draagconstructie', deel_van_huis: 'Aanbouw', prioriteit: 'Hoog', volgorde: 6 },
      { titel: 'Offertes aanvragen', beschrijving: 'Bij meerdere aannemers', deel_van_huis: 'Aanbouw', prioriteit: 'Hoog', volgorde: 7 },
      { titel: 'Vergunning aanvragen', beschrijving: 'Proceduretijd 8-12 weken', deel_van_huis: 'Aanbouw', prioriteit: 'Hoog', volgorde: 8, vergunning_gerelateerd: true },
      { titel: 'Aannemer kiezen en contract tekenen', beschrijving: 'Inclusief duidelijke afspraken over planning', deel_van_huis: 'Aanbouw', prioriteit: 'Hoog', volgorde: 9 },
      { titel: 'Buren informeren', beschrijving: 'Netjes melden, scheelt veel gedoe later', deel_van_huis: 'Aanbouw', prioriteit: 'Middel', volgorde: 10 },
      { titel: 'Nutsvoorzieningen regelen', beschrijving: 'Water, elektra, gas tijdelijk afsluiten indien nodig', deel_van_huis: 'Aanbouw', prioriteit: 'Hoog', volgorde: 11, dagen_offset: 7 },
      { titel: 'Fundering graven en storten', beschrijving: 'Strook- of poerfundering', deel_van_huis: 'Aanbouw', prioriteit: 'Hoog', volgorde: 12 },
      { titel: 'Riolering aanleggen', beschrijving: 'Afvoeren onder de vloer', deel_van_huis: 'Aanbouw', prioriteit: 'Hoog', volgorde: 13 },
      { titel: 'Vloer storten', beschrijving: 'Betonvloer met isolatie', deel_van_huis: 'Aanbouw', prioriteit: 'Hoog', volgorde: 14 },
      { titel: 'Muren metselen of plaatsen', beschrijving: 'Traditioneel of houtskelet', deel_van_huis: 'Aanbouw', prioriteit: 'Hoog', volgorde: 15 },
      { titel: 'Stalen ligger plaatsen', beschrijving: 'Voor doorbraak naar bestaande woning', deel_van_huis: 'Aanbouw', prioriteit: 'Hoog', volgorde: 16 },
      { titel: 'Dak plaatsen', beschrijving: 'Plat dak of schuin, inclusief isolatie', deel_van_huis: 'Aanbouw', prioriteit: 'Hoog', volgorde: 17 },
      { titel: 'Kozijnen en ramen plaatsen', beschrijving: 'Wind- en waterdicht maken', deel_van_huis: 'Aanbouw', prioriteit: 'Hoog', volgorde: 18 },
      { titel: 'Doorbraak maken naar woning', beschrijving: 'Nadat aanbouw waterdicht is', deel_van_huis: 'Aanbouw', prioriteit: 'Hoog', volgorde: 19 },
      { titel: 'Elektra aanleggen', beschrijving: 'Stopcontacten, schakelaars, verlichting', deel_van_huis: 'Aanbouw', prioriteit: 'Hoog', volgorde: 20 },
      { titel: 'Verwarming installeren', beschrijving: 'Radiatoren of vloerverwarming', deel_van_huis: 'Aanbouw', prioriteit: 'Middel', volgorde: 21 },
      { titel: 'Wanden afwerken', beschrijving: 'Stucen of gipsplaten', deel_van_huis: 'Aanbouw', prioriteit: 'Middel', volgorde: 22 },
      { titel: 'Vloer afwerken', beschrijving: 'Tegels, laminaat of andere vloerafwerking', deel_van_huis: 'Aanbouw', prioriteit: 'Middel', volgorde: 23 },
      { titel: 'Schilderwerk', beschrijving: 'Binnen en eventueel buiten', deel_van_huis: 'Aanbouw', prioriteit: 'Laag', volgorde: 24 },
      { titel: 'Tuin herstellen', beschrijving: 'Bestrating, gras, beplanting', deel_van_huis: 'Aanbouw', prioriteit: 'Laag', volgorde: 25 },
      { titel: 'Eindcontrole en oplevering', beschrijving: 'Alles nakijken, 5% regel toepassen', deel_van_huis: 'Aanbouw', prioriteit: 'Hoog', volgorde: 26 }
    ],
    tips: [
      'Houd 5% van de aanneemsom achter tot alle gebreken verholpen zijn',
      'Maak duidelijke afspraken over meerwerk vooraf',
      'Plan de bouw in het voorjaar/zomer voor beste weersomstandigheden',
      'Overweeg een bouwbegeleider bij grote projecten',
      'Vraag om referenties en bezoek eerdere projecten van de aannemer'
    ]
  },
  {
    id: 'vloer',
    naam: 'Vloer Vervangen',
    beschrijving: 'Stapsgewijs je vloer vervangen, van voorbereiding tot afwerking.',
    icon: 'Square',
    geschatte_doorlooptijd: '3-7 dagen',
    vergunningen: [],
    taken: [
      { titel: 'Type vloer kiezen', beschrijving: 'Tegels, laminaat, PVC, houten vloer, etc.', deel_van_huis: 'Woonkamer', prioriteit: 'Hoog', volgorde: 1 },
      { titel: 'Vloerverwarming overwegen', beschrijving: 'Nu ideaal moment om aan te leggen', deel_van_huis: 'Woonkamer', prioriteit: 'Middel', volgorde: 2 },
      { titel: 'Ondervloer bepalen', beschrijving: 'Afhankelijk van vloertype en ondergrond', deel_van_huis: 'Woonkamer', prioriteit: 'Hoog', volgorde: 3 },
      { titel: 'Materiaal berekenen en bestellen', beschrijving: 'Inclusief 5-10% snijverlies', deel_van_huis: 'Woonkamer', prioriteit: 'Hoog', volgorde: 4 },
      { titel: 'Ruimte leeghalen', beschrijving: 'Meubels en vloerbedekking verwijderen', deel_van_huis: 'Woonkamer', prioriteit: 'Hoog', volgorde: 5 },
      { titel: 'Oude vloer verwijderen', beschrijving: 'Tegels bikken of laminaat opnemen', deel_van_huis: 'Woonkamer', prioriteit: 'Hoog', volgorde: 6 },
      { titel: 'Ondergrond controleren', beschrijving: 'Vlakheid, vocht, scheuren checken', deel_van_huis: 'Woonkamer', prioriteit: 'Hoog', volgorde: 7 },
      { titel: 'Vloer egaliseren (indien nodig)', beschrijving: 'Egaline aanbrengen en laten drogen', deel_van_huis: 'Woonkamer', prioriteit: 'Hoog', volgorde: 8 },
      { titel: 'Vloerverwarming aanleggen (optioneel)', beschrijving: 'Elektrische matten of watergedragen', deel_van_huis: 'Woonkamer', prioriteit: 'Middel', volgorde: 9 },
      { titel: 'Ondervloer leggen', beschrijving: 'Dampremmend folie en ondervloer', deel_van_huis: 'Woonkamer', prioriteit: 'Hoog', volgorde: 10 },
      { titel: 'Nieuwe vloer leggen', beschrijving: 'Vanaf ingang richting raam werken', deel_van_huis: 'Woonkamer', prioriteit: 'Hoog', volgorde: 11 },
      { titel: 'Plinten plaatsen', beschrijving: 'Nieuwe plinten of bestaande herplaatsen', deel_van_huis: 'Woonkamer', prioriteit: 'Middel', volgorde: 12 },
      { titel: 'Overgangsprofielen plaatsen', beschrijving: 'Bij dorpels en overgangen', deel_van_huis: 'Woonkamer', prioriteit: 'Middel', volgorde: 13 },
      { titel: 'Opruimen en schoonmaken', beschrijving: 'Afval afvoeren, stof verwijderen', deel_van_huis: 'Woonkamer', prioriteit: 'Laag', volgorde: 14 },
      { titel: 'Meubels terugplaatsen', beschrijving: 'Met viltjes onder de poten', deel_van_huis: 'Woonkamer', prioriteit: 'Laag', volgorde: 15 }
    ],
    tips: [
      'Laat laminaat/PVC 48 uur acclimatiseren in de ruimte voor plaatsing',
      'Werk altijd met kliktangen voor het laatste randje bij laminaat',
      'Bij vloerverwarming: kies een vloer met lage warmteweerstand',
      'Gebruik altijd de juiste ondervloer voor je vloertype'
    ]
  },
  {
    id: 'zolder',
    naam: 'Zolder Verbouwen',
    beschrijving: 'Van ongebruikte zolder naar volwaardige leefruimte.',
    icon: 'Warehouse',
    geschatte_doorlooptijd: '4-10 weken',
    vergunningen: [
      {
        naam: 'Omgevingsvergunning bouwen',
        beschrijving: 'Nodig bij functieverandering naar verblijfsruimte.',
        instantie: 'Gemeente',
        wanneer_nodig: 'Bij creëren van slaapkamer of andere verblijfsruimte'
      },
      {
        naam: 'Vaste trap vereisten',
        beschrijving: 'Een verblijfsruimte vereist een vaste trap, geen vlizotrap.',
        instantie: 'Bouwbesluit',
        wanneer_nodig: 'Bij gebruiken als slaapkamer of verblijfsruimte'
      }
    ],
    taken: [
      { titel: 'Doel van verbouwing bepalen', beschrijving: 'Slaapkamer, kantoor, speelkamer?', deel_van_huis: 'Zolder', prioriteit: 'Hoog', volgorde: 1 },
      { titel: 'Sta-hoogte meten', beschrijving: 'Minimaal 2.10m voor verblijfsruimte', deel_van_huis: 'Zolder', prioriteit: 'Hoog', volgorde: 2 },
      { titel: 'Vergunningscheck doen', beschrijving: 'Bij functieverandering vaak verplicht', deel_van_huis: 'Zolder', prioriteit: 'Hoog', volgorde: 3, vergunning_gerelateerd: true },
      { titel: 'Draagvermogen vloer laten berekenen', beschrijving: 'Zoldervloer is vaak niet berekend op wonen', deel_van_huis: 'Zolder', prioriteit: 'Hoog', volgorde: 4 },
      { titel: 'Type trap kiezen', beschrijving: 'Rechte trap, kwartslag, vlizotrap upgrade', deel_van_huis: 'Zolder', prioriteit: 'Hoog', volgorde: 5 },
      { titel: 'Dakraam of dakkapel overwegen', beschrijving: 'Voor licht en ventilatie', deel_van_huis: 'Zolder', prioriteit: 'Middel', volgorde: 6 },
      { titel: 'Offertes aanvragen', beschrijving: 'Bij aannemer, timmerman, installateur', deel_van_huis: 'Zolder', prioriteit: 'Hoog', volgorde: 7 },
      { titel: 'Zolder leegruimen', beschrijving: 'Alle spullen naar beneden of opslag', deel_van_huis: 'Zolder', prioriteit: 'Middel', volgorde: 8 },
      { titel: 'Trapgat maken', beschrijving: 'Vloerconstructie aanpassen', deel_van_huis: 'Zolder', prioriteit: 'Hoog', volgorde: 9 },
      { titel: 'Vloer versterken (indien nodig)', beschrijving: 'Extra balken of multiplexplaten', deel_van_huis: 'Zolder', prioriteit: 'Hoog', volgorde: 10 },
      { titel: 'Trap plaatsen', beschrijving: 'Vaste trap met leuning', deel_van_huis: 'Zolder', prioriteit: 'Hoog', volgorde: 11 },
      { titel: 'Dakraam plaatsen (optioneel)', beschrijving: 'Voor extra licht en ventilatie', deel_van_huis: 'Zolder', prioriteit: 'Middel', volgorde: 12 },
      { titel: 'Isolatie aanbrengen', beschrijving: 'Dak- en wandisolatie, cruciaal voor comfort', deel_van_huis: 'Zolder', prioriteit: 'Hoog', volgorde: 13 },
      { titel: 'Elektra aanleggen', beschrijving: 'Groepenkast uitbreiden, stopcontacten, verlichting', deel_van_huis: 'Zolder', prioriteit: 'Hoog', volgorde: 14 },
      { titel: 'Verwarming aanleggen', beschrijving: 'Radiator of elektrische verwarming', deel_van_huis: 'Zolder', prioriteit: 'Middel', volgorde: 15 },
      { titel: 'Wanden timmeren en afwerken', beschrijving: 'Gipsplaten of houten schroten', deel_van_huis: 'Zolder', prioriteit: 'Middel', volgorde: 16 },
      { titel: 'Plafond afwerken', beschrijving: 'Evt. schuine delen betimmeren', deel_van_huis: 'Zolder', prioriteit: 'Middel', volgorde: 17 },
      { titel: 'Vloer leggen', beschrijving: 'Laminaat, vloerbedekking of houten vloer', deel_van_huis: 'Zolder', prioriteit: 'Middel', volgorde: 18 },
      { titel: 'Schilderwerk', beschrijving: 'Muren, kozijnen, evt. balken', deel_van_huis: 'Zolder', prioriteit: 'Laag', volgorde: 19 },
      { titel: 'Inrichting en afwerking', beschrijving: 'Meubels, gordijnen, accessoires', deel_van_huis: 'Zolder', prioriteit: 'Laag', volgorde: 20 }
    ],
    tips: [
      'Goede isolatie is het belangrijkste: voorkomt kou in winter en hitte in zomer',
      'Overweeg een elektrische radiator als cv-leiding moeilijk is',
      'Een vaste trap verhoogt de waarde van je woning',
      'Check brandveiligheid: rookmelder en vluchtmogelijkheid',
      'Maak gebruik van schuine wanden voor inbouwkasten'
    ]
  }
];

export function getTemplateById(id: string): RenovationTemplate | undefined {
  return renovationTemplates.find(t => t.id === id);
}

export function getTemplatesByCategory(): { [key: string]: RenovationTemplate[] } {
  return {
    'Binnenruimtes': renovationTemplates.filter(t => ['badkamer', 'keuken', 'vloer'].includes(t.id)),
    'Uitbreidingen': renovationTemplates.filter(t => ['dakkapel', 'aanbouw', 'zolder'].includes(t.id))
  };
}
