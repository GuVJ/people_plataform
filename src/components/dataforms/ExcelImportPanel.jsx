import { useState, useRef } from 'react';
import { useLang } from '../../i18n/LanguageContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import { downloadEmployeeTemplate, parseEmployeeFile } from '../../data/employeeTemplate.js';
import Table from '../ui/Table.jsx';

export default function ExcelImportPanel() {
  const { tx } = useLang();
  const { bulkImportEmployees } = useData();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setResult(null);
    try {
      const rows = await parseEmployeeFile(file);
      const { added, rowErrors } = bulkImportEmployees(rows);
      setResult({ added, rowErrors, total: rows.length });
    } catch (err) {
      setResult({ added: [], rowErrors: [{ row: '-', errors: [`${tx('Não foi possível ler o arquivo')}: ${err.message}`] }], total: 0 });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="import-panel">
      <div className="import-panel-actions">
        <button type="button" className="btn" onClick={() => downloadEmployeeTemplate()}>
          {tx('Baixar template de cadastro (.xlsx)')}
        </button>
        <button type="button" className="btn btn-primary" onClick={() => fileRef.current?.click()} disabled={busy}>
          {busy ? tx('Importando…') : tx('Importar funcionários via Excel')}
        </button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" hidden onChange={handleFile} />
      </div>
      <p className="text-secondary" style={{ fontSize: 12, marginTop: 10 }}>
        {tx('Baixe o template, preencha uma linha por funcionário na aba "Funcionários" (a aba "Instruções" lista os valores aceitos em cada coluna) e importe o arquivo de volta.')}
      </p>

      {result && (
        <div className="import-result">
          <div className="import-result-summary">
            <span className="badge badge-success">{result.added.length} {tx('importado(s)')}</span>
            {result.rowErrors.length > 0 && <span className="badge badge-danger">{result.rowErrors.length} {tx('com erro')}</span>}
          </div>
          {result.rowErrors.length > 0 && (
            <Table
              columns={[
                { key: 'row', label: tx('Linha') },
                { key: 'errors', label: tx('Erros'), render: (r) => r.errors.join(' ') },
              ]}
              rows={result.rowErrors}
              rowKey={(r) => r.row}
            />
          )}
        </div>
      )}
    </div>
  );
}
