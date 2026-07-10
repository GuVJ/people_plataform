import { useState } from 'react';
import { exportSheet } from '../../utils/exportExcel.js';

export default function ExportButton({ filename, sheetName, rows, label = 'Exportar' }) {
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (busy || !rows?.length) return;
    setBusy(true);
    try {
      await exportSheet(filename, sheetName, rows);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" className="btn btn-sm export-btn" onClick={handleClick} disabled={busy}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {busy ? 'Exportando…' : label}
    </button>
  );
}
