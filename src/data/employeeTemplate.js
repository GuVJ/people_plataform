import { AREAS, ROLE_LEVELS, UNITS, GENDERS, RACES, BENEFITS } from './constants.js';

const AREA_NAMES = AREAS.map((a) => a.name);
const ROLE_NAMES = ROLE_LEVELS.map((r) => r.level);
const GENDER_NAMES = GENDERS.map((g) => g.value);
const RACE_NAMES = RACES.map((r) => r.value);

// Column order is the single source of truth for both the downloaded template and the import parser.
export const TEMPLATE_COLUMNS = [
  { header: 'Nome', field: 'nome' },
  { header: 'Gênero', field: 'genero' },
  { header: 'Raça/Etnia', field: 'raca' },
  { header: 'Data de Nascimento', field: 'dataNascimento' },
  { header: 'PCD (Sim/Não)', field: 'pcd' },
  { header: 'Tipo de PCD', field: 'pcdTipo' },
  { header: 'Área', field: 'area' },
  { header: 'Cargo', field: 'cargo' },
  { header: 'Unidade', field: 'unidade' },
  { header: 'Gestor', field: 'gestorNome' },
  { header: 'Salário', field: 'salario' },
  { header: 'Data de Admissão', field: 'dataAdmissao' },
  { header: 'Benefícios', field: 'beneficios' },
];

const EXAMPLE_ROWS = [
  {
    'Nome': 'Maria Fernanda Silva', 'Gênero': 'Feminino', 'Raça/Etnia': 'Parda', 'Data de Nascimento': '1995-04-12',
    'PCD (Sim/Não)': 'Não', 'Tipo de PCD': '', 'Área': 'Comercial', 'Cargo': 'Analista Pleno', 'Unidade': 'São Paulo - SP',
    'Gestor': 'Ricardo Souza Melo', 'Salário': 6500, 'Data de Admissão': '2026-07-01', 'Benefícios': 'Vale Refeição; Vale Transporte; Plano de Saúde',
  },
  {
    'Nome': 'Pedro Henrique Costa', 'Gênero': 'Masculino', 'Raça/Etnia': 'Branca', 'Data de Nascimento': '1990-11-03',
    'PCD (Sim/Não)': 'Não', 'Tipo de PCD': '', 'Área': 'Tecnologia', 'Cargo': 'Analista Sênior', 'Unidade': 'Remoto',
    'Gestor': '', 'Salário': 11200, 'Data de Admissão': '2026-07-05', 'Benefícios': 'Vale Refeição; Plano de Saúde; Gympass',
  },
];

const INSTRUCTIONS = [
  { Campo: 'Nome', 'Valores aceitos': 'Texto livre (obrigatório)' },
  { Campo: 'Gênero', 'Valores aceitos': GENDER_NAMES.join(' | ') },
  { Campo: 'Raça/Etnia', 'Valores aceitos': RACE_NAMES.join(' | ') },
  { Campo: 'Data de Nascimento', 'Valores aceitos': 'AAAA-MM-DD (ex: 1995-04-12)' },
  { Campo: 'PCD (Sim/Não)', 'Valores aceitos': 'Sim | Não' },
  { Campo: 'Tipo de PCD', 'Valores aceitos': 'Texto livre — preencher apenas se PCD = Sim' },
  { Campo: 'Área', 'Valores aceitos': AREA_NAMES.join(' | ') },
  { Campo: 'Cargo', 'Valores aceitos': ROLE_NAMES.join(' | ') },
  { Campo: 'Unidade', 'Valores aceitos': UNITS.join(' | ') },
  { Campo: 'Gestor', 'Valores aceitos': 'Nome completo de um gestor já cadastrado no sistema (opcional)' },
  { Campo: 'Salário', 'Valores aceitos': 'Número maior que zero (ex: 6500)' },
  { Campo: 'Data de Admissão', 'Valores aceitos': 'AAAA-MM-DD (obrigatório)' },
  { Campo: 'Benefícios', 'Valores aceitos': `Lista separada por ";" — opções: ${BENEFITS.join(' | ')}` },
];

export async function downloadEmployeeTemplate() {
  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();

  const headers = TEMPLATE_COLUMNS.map((c) => c.header);
  const sheet = XLSX.utils.json_to_sheet(EXAMPLE_ROWS, { header: headers });
  sheet['!cols'] = headers.map((h) => ({ wch: Math.max(16, h.length + 4) }));
  XLSX.utils.book_append_sheet(workbook, sheet, 'Funcionários');

  const instructionsSheet = XLSX.utils.json_to_sheet(INSTRUCTIONS);
  instructionsSheet['!cols'] = [{ wch: 22 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instruções');

  XLSX.writeFile(workbook, 'template_cadastro_funcionarios.xlsx');
}

export async function parseEmployeeFile(file) {
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames.includes('Funcionários') ? 'Funcionários' : workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  return rawRows.map((raw) => {
    const mapped = {};
    for (const col of TEMPLATE_COLUMNS) {
      mapped[col.field] = raw[col.header];
    }
    return mapped;
  });
}
