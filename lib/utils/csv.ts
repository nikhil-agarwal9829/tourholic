/**
 * CSV Generation utility with Formula Injection (CSV Injection) defense
 * Prevents execution of malicious formulas (=, +, -, @) in spreadsheet viewers
 */

export function sanitizeCsvField(val: unknown): string {
  if (val === null || val === undefined) {
    return "";
  }

  let str = String(val);

  // CSV Formula Injection mitigation:
  // If the cell begins with =, +, -, @, \t, or \r, prefix with a single quote
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // If the value contains double quotes, commas, or newlines, quote the field and escape internal quotes
  if (/[",\n\r]/.test(str)) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export function generateCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const headerLine = headers.map(sanitizeCsvField).join(",");
  const dataLines = rows.map((row) => row.map(sanitizeCsvField).join(","));
  return [headerLine, ...dataLines].join("\r\n");
}
