import { formatByType } from '../ui/formatValue.js';
import { formatNumber } from '../../utils/format.js';
import { useLang } from '../../i18n/LanguageContext.jsx';
import './ExecutiveSummaryTable.css';

const ARROW = { up: '↑', down: '↓', flat: '=' };

function deltaLabel({ delta, isPP }, lang) {
  const mag = Math.abs(delta);
  const pp = lang === 'en' ? 'pp' : 'p.p.';
  return isPP ? `${formatNumber(mag, 1)} ${pp}` : `${formatNumber(mag, 1)}%`;
}

function VariationChip({ item, compact = false, lang }) {
  const tone = item.direction === 'flat' ? 'flat' : item.good ? 'good' : 'bad';
  return (
    <span className={`exec-variation exec-${tone}${compact ? ' exec-variation-sm' : ''}`}>
      <span className="exec-arrow">{ARROW[item.direction]}</span>
      {item.direction !== 'flat' && deltaLabel(item, lang)}
    </span>
  );
}

function MetaBar({ target, format, lang, t }) {
  const scale = Math.max(target.value, target.value * (target.ratio || 1), 1) * 1.15;
  const fillPct = Math.min(100, (target.value * target.ratio / scale) * 100);
  const markerPct = Math.min(100, (target.value / scale) * 100);
  const tone = target.ok ? 'ok' : 'over';

  return (
    <div className="exec-meta">
      <div className="exec-meta-track">
        <div className={`exec-meta-fill ${tone}`} style={{ width: `${fillPct}%` }} />
        <div className="exec-meta-marker" style={{ left: `${markerPct}%` }} title={`${t('exec.target')}: ${formatByType(target.value, format, lang)}`} />
      </div>
      <div className="exec-meta-foot">
        <span className={`exec-meta-status ${tone}`}>{target.ok ? t('exec.withinTarget') : t('exec.offTarget')}</span>
        <span className="exec-meta-value">{t('exec.targetShort')} {formatByType(target.value, format, lang)}{target.monthly ? t('exec.perMonth') : ''}</span>
      </div>
    </div>
  );
}

export default function ExecutiveSummaryTable({ rows }) {
  const { lang, t, tIndicator } = useLang();
  return (
    <div className="exec-table-wrap">
      <table className="exec-table">
        <thead>
          <tr>
            <th>{t('exec.indicator')}</th>
            <th className="num">{t('exec.prevMonth')}</th>
            <th className="num">{t('exec.currMonth')}</th>
            <th className="num">{t('exec.variation')}</th>
            <th className="num">{t('exec.ytd')}</th>
            <th>{t('exec.target')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <td className="exec-label">{tIndicator(row.key, row.label)}</td>
              <td className="num exec-prev">{row.previous !== null ? formatByType(row.previous, row.format, lang) : '—'}</td>
              <td className="num exec-current">{formatByType(row.current, row.format, lang)}</td>
              <td className="num"><VariationChip item={row} lang={lang} /></td>
              <td className="num">
                {row.ytd ? (
                  <div className="exec-ytd">
                    <span className="exec-ytd-value">{formatByType(row.ytd.current, row.ytd.format, lang)}</span>
                    <span className="exec-ytd-yoy">
                      <VariationChip item={row.ytd} compact lang={lang} /> <span className="exec-ytd-caption">{t('exec.vsPrevYear')}</span>
                    </span>
                  </div>
                ) : (
                  <span className="exec-no-meta">—</span>
                )}
              </td>
              <td className="exec-meta-cell">
                {row.target ? <MetaBar target={row.target} format={row.format} lang={lang} t={t} /> : <span className="exec-no-meta">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
