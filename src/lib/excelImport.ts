import * as XLSX from 'xlsx';

export interface ExcelTaskRow {
  begindatum?: string;
  einddatum?: string;
  deel_van_huis?: string;
  activiteit: string;
  wie?: string;
  status?: string;
  opmerking?: string;
}

export interface ParsedTask {
  begindatum: string | null;
  deadline: string | null;
  deel_van_huis: string | null;
  titel: string;
  verantwoordelijke: string | null;
  status: 'Te doen' | 'Bezig' | 'Gereed';
  beschrijving: string | null;
  prioriteit: 'Middel';
  project_id: string;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ParseResult {
  validTasks: ParsedTask[];
  errors: ValidationError[];
  warnings: ValidationError[];
  totalRows: number;
}

// Map Excel status waarden naar database enum
const mapStatus = (status: string | undefined): 'Te doen' | 'Bezig' | 'Gereed' => {
  if (!status) return 'Te doen';
  
  const normalized = status.toLowerCase().trim();
  
  // Te doen variations
  if (['te doen', 'todo', 'open', 'nieuw', 'to do'].includes(normalized)) {
    return 'Te doen';
  }
  
  // Bezig variations
  if (['bezig', 'in progress', 'actief', 'lopend', 'wip', 'progress'].includes(normalized)) {
    return 'Bezig';
  }
  
  // Gereed variations
  if (['gereed', 'done', 'klaar', 'afgerond', 'voltooid', 'finished'].includes(normalized)) {
    return 'Gereed';
  }
  
  // Default
  return 'Te doen';
};

// Parse Excel datum (kan serial number of string zijn)
const parseExcelDate = (value: any): string | null => {
  if (!value) return null;
  
  // Excel serial date nummer
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }
  }
  
  // String datum
  if (typeof value === 'string') {
    // Probeer verschillende formaten
    const formats = [
      /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/, // dd-mm-yyyy of dd/mm/yyyy
      /^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/, // yyyy-mm-dd of yyyy/mm/dd
    ];
    
    for (const format of formats) {
      const match = value.match(format);
      if (match) {
        if (match[0].startsWith('20') || match[0].startsWith('19')) {
          // yyyy-mm-dd formaat
          const [, year, month, day] = match;
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        } else {
          // dd-mm-yyyy formaat
          const [, day, month, year] = match;
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
    }
  }
  
  return null;
};

// Valideer een enkele taak
const validateTask = (task: ExcelTaskRow, rowIndex: number, projectId: string): {
  parsed: ParsedTask | null;
  errors: ValidationError[];
  warnings: ValidationError[];
} => {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  
  // Verplicht: Activiteit
  if (!task.activiteit || task.activiteit.trim() === '') {
    errors.push({
      row: rowIndex,
      field: 'Activiteit',
      message: 'Activiteit is verplicht',
      severity: 'error'
    });
    return { parsed: null, errors, warnings };
  }
  
  // Parse datums
  const begindatum = parseExcelDate(task.begindatum);
  const deadline = parseExcelDate(task.einddatum);
  
  // Valideer datum logica
  if (begindatum && deadline) {
    if (new Date(begindatum) > new Date(deadline)) {
      warnings.push({
        row: rowIndex,
        field: 'Datums',
        message: 'Begindatum is later dan einddatum',
        severity: 'warning'
      });
    }
  }
  
  // Valideer datum in toekomst
  const twoYearsFromNow = new Date();
  twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);
  
  if (begindatum && new Date(begindatum) > twoYearsFromNow) {
    warnings.push({
      row: rowIndex,
      field: 'Begindatum',
      message: 'Begindatum is meer dan 2 jaar in de toekomst',
      severity: 'warning'
    });
  }
  
  if (deadline && new Date(deadline) > twoYearsFromNow) {
    warnings.push({
      row: rowIndex,
      field: 'Einddatum',
      message: 'Einddatum is meer dan 1 jaar in de toekomst',
      severity: 'warning'
    });
  }
  
  // Valideer veld lengtes
  const titel = task.activiteit.trim().substring(0, 255);
  if (task.activiteit.trim().length > 255) {
    warnings.push({
      row: rowIndex,
      field: 'Activiteit',
      message: 'Activiteit is ingekort tot 255 karakters',
      severity: 'warning'
    });
  }
  
  const deel_van_huis = task.deel_van_huis?.trim().substring(0, 100) || null;
  if (task.deel_van_huis && task.deel_van_huis.trim().length > 100) {
    warnings.push({
      row: rowIndex,
      field: 'Deel van huis',
      message: 'Deel van huis is ingekort tot 100 karakters',
      severity: 'warning'
    });
  }
  
  const verantwoordelijke = task.wie?.trim().substring(0, 100) || null;
  if (task.wie && task.wie.trim().length > 100) {
    warnings.push({
      row: rowIndex,
      field: 'Wie',
      message: 'Wie is ingekort tot 100 karakters',
      severity: 'warning'
    });
  }
  
  const beschrijving = task.opmerking?.trim().substring(0, 5000) || null;
  if (task.opmerking && task.opmerking.trim().length > 5000) {
    warnings.push({
      row: rowIndex,
      field: 'Opmerking',
      message: 'Opmerking is ingekort tot 5000 karakters',
      severity: 'warning'
    });
  }
  
  // Map status
  const status = mapStatus(task.status);
  if (task.status && mapStatus(task.status) === 'Te doen' && task.status.trim() !== '') {
    const normalizedInput = task.status.toLowerCase().trim();
    if (!['te doen', 'todo', 'open', 'nieuw', 'to do'].includes(normalizedInput)) {
      warnings.push({
        row: rowIndex,
        field: 'Status',
        message: `Status '${task.status}' niet herkend, gezet op 'Te doen'`,
        severity: 'warning'
      });
    }
  }
  
  const parsed: ParsedTask = {
    begindatum,
    deadline,
    deel_van_huis,
    titel,
    verantwoordelijke,
    status,
    beschrijving,
    prioriteit: 'Middel',
    project_id: projectId
  };
  
  return { parsed, errors, warnings };
};

// Parse Excel bestand
export const parseExcelFile = async (
  file: File,
  projectId: string
): Promise<ParseResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        
        // Lees eerste sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Converteer naar JSON met header row
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, {
          raw: false,
          defval: ''
        });
        
        if (jsonData.length === 0) {
          reject(new Error('Excel bestand is leeg'));
          return;
        }
        
        const validTasks: ParsedTask[] = [];
        const allErrors: ValidationError[] = [];
        const allWarnings: ValidationError[] = [];
        
        // Normalize kolomnamen (hoofdletterongevoelig, spaties en lowercase)
        const normalizeColumnName = (name: string) => 
          name.toLowerCase().trim().replace(/\s+/g, '_');
        
        jsonData.forEach((row, index) => {
          // Skip lege rijen
          const hasData = Object.values(row).some(val => val && String(val).trim() !== '');
          if (!hasData) return;
          
          // Map Excel kolommen naar verwachte veldnamen
          const normalizedRow: any = {};
          Object.keys(row).forEach(key => {
            const normalizedKey = normalizeColumnName(key);
            normalizedRow[normalizedKey] = row[key];
          });
          
          const excelRow: ExcelTaskRow = {
            begindatum: normalizedRow.begindatum,
            einddatum: normalizedRow.einddatum,
            deel_van_huis: normalizedRow.deel_van_huis,
            activiteit: normalizedRow.activiteit,
            wie: normalizedRow.wie,
            status: normalizedRow.status,
            opmerking: normalizedRow.opmerking || normalizedRow.opmerkingen
          };
          
          const { parsed, errors, warnings } = validateTask(excelRow, index + 2, projectId); // +2 voor header + 0-index
          
          if (parsed) {
            validTasks.push(parsed);
          }
          
          allErrors.push(...errors);
          allWarnings.push(...warnings);
        });
        
        resolve({
          validTasks,
          errors: allErrors,
          warnings: allWarnings,
          totalRows: jsonData.length
        });
        
      } catch (error) {
        reject(new Error('Kon Excel bestand niet lezen. Controleer of het een geldig Excel bestand is.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Fout bij het lezen van bestand'));
    };
    
    reader.readAsBinaryString(file);
  });
};

// Genereer Excel template voor download
export const generateExcelTemplate = () => {
  const templateData = [
    {
      'Begindatum': '01-01-2025',
      'Einddatum': '15-01-2025',
      'Deel van huis': 'Keuken',
      'Activiteit': 'Tegels plaatsen',
      'Wie': 'Jan de Wit',
      'Status': 'Te doen',
      'Opmerking': 'Materiaal al besteld'
    },
    {
      'Begindatum': '16-01-2025',
      'Einddatum': '20-01-2025',
      'Deel van huis': 'Badkamer',
      'Activiteit': 'Sanitair installeren',
      'Wie': 'ABC Loodgieters',
      'Status': 'Bezig',
      'Opmerking': ''
    },
    {
      'Begindatum': '21-01-2025',
      'Einddatum': '25-01-2025',
      'Deel van huis': 'Woonkamer',
      'Activiteit': 'Vloer leggen',
      'Wie': 'Vloerenbedrijf X',
      'Status': 'Gereed',
      'Opmerking': 'Perfect afgewerkt'
    }
  ];
  
  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Taken');
  
  // Kolom breedtes
  worksheet['!cols'] = [
    { wch: 12 }, // Begindatum
    { wch: 12 }, // Einddatum
    { wch: 15 }, // Deel van huis
    { wch: 25 }, // Activiteit
    { wch: 20 }, // Wie
    { wch: 10 }, // Status
    { wch: 30 }  // Opmerking
  ];
  
  // Download bestand
  XLSX.writeFile(workbook, 'taken_template.xlsx');
};
