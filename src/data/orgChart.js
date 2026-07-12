import { AREAS } from './constants.js';
import { average } from '../utils/stats.js';

function normalize(text) {
  return String(text ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// The generated dataset only carries a 2-level reporting structure (manager -> direct reports;
// managers themselves have no managerId). This builds that into a browsable tree grouped by
// diretoria, optionally scoped to a Vice-presidência (vp) and/or narrowed by a name query.
export function buildOrgTree(activeNow, { vp = null, nameQuery = '' } = {}) {
  const scoped = vp ? activeNow.filter((e) => e.vp === vp) : activeNow;
  const areasInScope = AREAS.filter((a) => !vp || a.vp === vp);

  const byArea = new Map();
  for (const area of areasInScope) byArea.set(area.name, { name: area.name, vp: area.vp, managers: [], unassigned: [] });

  const managersById = new Map();
  for (const e of scoped) {
    if (e.isLeadership) {
      const node = { ...e, reports: [] };
      managersById.set(e.id, node);
      byArea.get(e.area)?.managers.push(node);
    }
  }
  for (const e of scoped) {
    if (e.isLeadership) continue;
    const manager = e.managerId ? managersById.get(e.managerId) : null;
    if (manager) manager.reports.push(e);
    else byArea.get(e.area)?.unassigned.push(e);
  }

  // KPIs reflect the VP scope, but not the name filter (which only narrows the visible tree).
  const scopedManagers = [...managersById.values()];
  const spanOfControl = {
    avg: average(scopedManagers, (m) => m.reports.length),
    max: Math.max(...scopedManagers.map((m) => m.reports.length), 0),
    managerCount: scopedManagers.length,
  };
  const company = { headcount: scoped.length, areaCount: areasInScope.length };

  const nq = normalize(nameQuery.trim());
  let areas = areasInScope.map((a) => {
    const bucket = byArea.get(a.name);
    let managers = bucket.managers;
    let unassigned = bucket.unassigned;

    if (nq) {
      managers = managers
        .map((m) => {
          const managerMatches = normalize(m.name).includes(nq);
          const reports = managerMatches ? m.reports : m.reports.filter((r) => normalize(r.name).includes(nq));
          return managerMatches || reports.length ? { ...m, reports } : null;
        })
        .filter(Boolean);
      unassigned = unassigned.filter((r) => normalize(r.name).includes(nq));
    }

    const headcount = managers.length + managers.reduce((s, m) => s + m.reports.length, 0) + unassigned.length;
    managers.sort((x, y) => y.reports.length - x.reports.length);
    return { name: a.name, vp: a.vp, managers, unassigned, headcount };
  });

  if (nq) areas = areas.filter((a) => a.headcount > 0);
  areas.sort((a, b) => b.headcount - a.headcount);

  return {
    company,
    areas,
    spanOfControl,
    matchCount: nq ? areas.reduce((s, a) => s + a.headcount, 0) : null,
  };
}
