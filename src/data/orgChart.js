import { AREAS } from './constants.js';
import { average } from '../utils/stats.js';

// The generated dataset only carries a 2-level reporting structure (manager -> direct reports;
// managers themselves have no managerId). This builds that into a browsable tree grouped by area.
export function buildOrgTree(activeNow) {
  const byArea = new Map();
  for (const area of AREAS) byArea.set(area.name, { name: area.name, managers: [], unassigned: [] });

  const managersById = new Map();
  for (const e of activeNow) {
    if (e.isLeadership) {
      const bucket = byArea.get(e.area);
      const managerNode = { ...e, reports: [] };
      managersById.set(e.id, managerNode);
      bucket?.managers.push(managerNode);
    }
  }

  for (const e of activeNow) {
    if (e.isLeadership) continue;
    const bucket = byArea.get(e.area);
    const manager = e.managerId ? managersById.get(e.managerId) : null;
    if (manager) {
      manager.reports.push(e);
    } else {
      bucket?.unassigned.push(e);
    }
  }

  const areas = AREAS.map((a) => {
    const bucket = byArea.get(a.name);
    const headcount = bucket.managers.length + bucket.managers.reduce((s, m) => s + m.reports.length, 0) + bucket.unassigned.length;
    bucket.managers.sort((a2, b2) => b2.reports.length - a2.reports.length);
    return { ...bucket, headcount };
  }).sort((a, b) => b.headcount - a.headcount);

  const allManagers = areas.flatMap((a) => a.managers);
  const spanOfControl = {
    avg: average(allManagers, (m) => m.reports.length),
    max: Math.max(...allManagers.map((m) => m.reports.length), 0),
    managerCount: allManagers.length,
  };

  return {
    company: { headcount: activeNow.length, areaCount: areas.length },
    areas,
    spanOfControl,
  };
}
