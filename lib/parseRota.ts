import * as XLSX from 'xlsx';

export interface StaffMember {
  name: string;
  cadre: string;
  shifts: string[];
}

export interface RotaData {
  title: string;
  month: string;
  year: number;
  daysInMonth: number;
  dayNames: string[];
  staff: StaffMember[];
}

const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function getDayName(year: number, month: number, day: number): string {
  return DAY_NAMES[new Date(year, month - 1, day).getDay()];
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function isValidShift(val: string): boolean {
  return ['N','S','E','DO','NO','PH','DOO','DON','D0'].includes(val.toUpperCase());
}

function normaliseShift(val: string): string {
  const v = val.trim().toUpperCase();
  if (v === 'D0') return 'DO'; // zero vs letter O typo
  if (v === 'DOO') return 'DOO';
  return v;
}

export function parseRota(wb: XLSX.WorkBook): RotaData {
  const sheet = wb.Sheets['Sheet1'];
  if (!sheet) throw new Error('Sheet1 not found. Make sure this is the MTRH ED rota file.');

  const raw: (string | number | null)[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  // Find title row (contains "DUTY ROTA")
  let titleRow = '';
  for (let i = 0; i < 15; i++) {
    const rowStr = (raw[i] || []).join(' ');
    if (rowStr.includes('ROTA')) { titleRow = rowStr.replace(/\s+/g, ' ').trim(); break; }
  }

  // Detect month/year from title
  const months = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
  let detectedMonth = 4; // default April
  let detectedYear = new Date().getFullYear();
  for (let m = 0; m < months.length; m++) {
    if (titleRow.toUpperCase().includes(months[m])) { detectedMonth = m + 1; break; }
  }
  const yearMatch = titleRow.match(/20\d\d/);
  if (yearMatch) detectedYear = parseInt(yearMatch[0]);

  const daysInMonth = getDaysInMonth(detectedYear, detectedMonth);
  const dayNames = Array.from({ length: daysInMonth }, (_, i) => getDayName(detectedYear, detectedMonth, i + 1));

  // Find staff rows: look for header row with day numbers 1..N
  let staffStartRow = -1;
  let dayColStart = -1;

  for (let r = 10; r < 20; r++) {
    const row = raw[r] || [];
    // Look for a cell containing "Name" or a run of numbers 1,2,3...
    let foundDays = false;
    for (let c = 0; c < row.length; c++) {
      if (String(row[c]).trim() === '1') {
        // Check next few cells are 2,3,4
        if (String(row[c+1]).trim() === '2' && String(row[c+2]).trim() === '3') {
          dayColStart = c;
          staffStartRow = r + 1;
          foundDays = true;
          break;
        }
      }
    }
    if (foundDays) break;
  }

  if (staffStartRow === -1) throw new Error('Could not find the staff roster in this file. Check the format matches previous rotas.');

  const staff: StaffMember[] = [];

  for (let r = staffStartRow; r < raw.length; r++) {
    const row = raw[r] || [];
    // Name is typically col 1 (index 1)
    const name = String(row[1] || '').trim();
    const cadre = String(row[2] || '').trim();

    if (!name || name === 'null' || /^\d+$/.test(name) || name.toLowerCase() === 'name') continue;
    if (name.toUpperCase().includes('KEY') || name.toUpperCase().includes('COMPILED') || name.toUpperCase().includes('CHECKED')) break;

    const shifts: string[] = [];
    for (let d = 0; d < daysInMonth; d++) {
      const raw_val = String(row[dayColStart + d] || '').trim();
      if (raw_val === 'null' || raw_val === '') {
        shifts.push('');
      } else {
        shifts.push(normaliseShift(raw_val));
      }
    }

    // Only include if at least some shifts look valid
    const validCount = shifts.filter(s => isValidShift(s) || s === '').length;
    if (validCount < daysInMonth * 0.3) continue;

    staff.push({ name, cadre, shifts });
  }

  if (staff.length === 0) throw new Error('No staff found. The file format may have changed.');

  const monthName = new Date(detectedYear, detectedMonth - 1, 1).toLocaleString('default', { month: 'long' });

  return {
    title: titleRow || `ED Nurses Duty Rota`,
    month: monthName,
    year: detectedYear,
    daysInMonth,
    dayNames,
    staff,
  };
}
