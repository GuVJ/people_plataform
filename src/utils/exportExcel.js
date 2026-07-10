// Client-side .xlsx generation via SheetJS — dynamically imported so it never bloats the initial bundle.
export async function exportSheet(filename, sheetName, rows) {
  const XLSX = await import('xlsx');
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export async function exportWorkbook(filename, sheets) {
  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();
  for (const { name, rows } of sheets) {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, name.slice(0, 31));
  }
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
