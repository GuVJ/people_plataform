// Dicionário PT -> EN modular. Cada domínio tem seu próprio arquivo para permitir
// edição paralela sem conflito. A chave é o texto em português (língua-fonte); o valor
// é a tradução em inglês. Usado por tx() quando lang === 'en'.
import common from './common.js';
import home from './home.js';
import wtr from './wtr.js';
import dash2 from './dash2.js';
import hse from './hse.js';
import labor from './labor.js';
import org from './org.js';
import ai from './ai.js';
import ops from './ops.js';
import ui from './ui.js';
import data from './data.js';
import data2 from './data2.js';
import epi from './epi.js';
import budgetcost from './budgetcost.js';
import overtimetypes from './overtimetypes.js';
import themesui from './themesui.js';
import production from './production.js';
import reportsextra from './reportsextra.js';

export const DICT = {
  ...common,
  ...home,
  ...wtr,
  ...dash2,
  ...hse,
  ...labor,
  ...org,
  ...ai,
  ...ops,
  ...ui,
  ...data,
  ...data2,
  ...epi,
  ...budgetcost,
  ...overtimetypes,
  ...themesui,
  ...production,
  ...reportsextra,
};
