// Leitura do idioma atual fora de componentes React (arquivos de dados/engines).
// Componentes devem usar useLang(); estes helpers servem para funções puras que
// compõem texto (insights, rótulos dinâmicos). Como as páginas assinam o
// LanguageContext (via useLang) e re-renderizam ao trocar de idioma, estas funções
// são reavaliadas com o idioma novo.
import { DICT } from './dict/index.js';

export function getLang() {
  if (typeof window === 'undefined') return 'pt';
  return window.localStorage.getItem('pac-lang') || 'pt';
}

// Tradução por texto-fonte fora de componentes (mesma lógica de tx()).
export function txt(pt) {
  if (typeof pt !== 'string') return pt;
  if (getLang() !== 'en') return pt;
  return DICT[pt] ?? pt;
}

// Escolhe entre dois valores conforme o idioma (para frases compostas).
export function pick(ptValue, enValue) {
  return getLang() === 'en' ? enValue : ptValue;
}
