export function sum(arr, fn = (x) => x) {
  return arr.reduce((acc, item) => acc + fn(item), 0);
}

export function average(arr, fn = (x) => x) {
  if (!arr.length) return 0;
  return sum(arr, fn) / arr.length;
}

export function groupBy(arr, keyFn) {
  const map = new Map();
  for (const item of arr) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}

export function pctChange(current, previous) {
  if (!previous) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// Simple linear regression, returns {slope, intercept, predict(x)}
export function linearRegression(points) {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y ?? 0, predict: () => points[0]?.y ?? 0 };
  const sumX = sum(points, (p) => p.x);
  const sumY = sum(points, (p) => p.y);
  const sumXY = sum(points, (p) => p.x * p.y);
  const sumXX = sum(points, (p) => p.x * p.x);
  const denom = n * sumXX - sumX * sumX;
  const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept, predict: (x) => slope * x + intercept };
}

export function movingAverage(values, window = 3) {
  return values.map((_, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    return average(slice);
  });
}

export function quantile(arr, q) {
  const sorted = [...arr].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}
