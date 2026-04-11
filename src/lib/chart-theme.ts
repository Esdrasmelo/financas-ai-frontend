const DEFAULT_SERIES = [
  "#1F4B46",
  "#2D625B",
  "#4C7B74",
  "#6A958F",
  "#8CB1AA",
  "#B7D1CB",
];

export function getChartSeriesColors(): string[] {
  if (typeof document === "undefined") return DEFAULT_SERIES;
  const primary = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim();
  if (!primary || !/^#[0-9A-Fa-f]{6}$/.test(primary)) return DEFAULT_SERIES;
  return chartSeriesColorsFromTheme(primary, 6);
}

export function getChartPrimaryColor(): string {
  if (typeof document === "undefined") return DEFAULT_SERIES[0];
  const primary = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim();
  if (!primary || !/^#[0-9A-Fa-f]{6}$/.test(primary)) return DEFAULT_SERIES[0];
  return primary;
}

/** @deprecated Use getChartSeriesColors() instead */
export const CHART_SERIES_COLORS = DEFAULT_SERIES;

export const CHART_NEUTRAL_COLORS = ["#374151", "#4B5563", "#6B7280", "#9CA3AF"] as const;

const THEME_HEX = /^#[0-9A-Fa-f]{6}$/;

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = THEME_HEX.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[0].slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: h * 360, s, l };
}

function hslToHex(h: number, s: number, l: number): string {
  const hn = ((h % 360) + 360) % 360 / 360;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (t: number) => {
    let x = t;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  const r = Math.round(hue2rgb(hn + 1 / 3) * 255);
  const g = Math.round(hue2rgb(hn) * 255);
  const b = Math.round(hue2rgb(hn - 1 / 3) * 255);
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Barras: meio-termo entre “neon” e lavado — boa parte da saturação do cartão, com teto suave.
 */
const PRIMARY_S_CAP = 0.52;
const PRIMARY_S_BLEND = 0.72;
const PRIMARY_L_MIN = 0.28;
const PRIMARY_L_MAX = 0.44;

/**
 * Donut: fatias distinguíveis e alinhadas à cor do cartão; tons claros perdem pouca saturação.
 */
const SERIES_S_CAP = 0.58;
const SERIES_S_BLEND = 0.7;
const SERIES_LIGHT_SAT_FADE = 0.2;
const SERIES_LIGHT_SAT_FLOOR = 0.58;

/** Cor principal de gráficos (ex.: barras): tom derivado do cartão, suavizado, ou fallback da paleta. */
export function chartPrimaryFromTheme(themeColor: string | null | undefined): string {
  const t = themeColor?.trim();
  if (!t || !THEME_HEX.test(t)) return CHART_SERIES_COLORS[0];
  const rgb = hexToRgb(t);
  if (!rgb) return CHART_SERIES_COLORS[0];
  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const sMuted = Math.min(PRIMARY_S_CAP, s * PRIMARY_S_BLEND + 0.04);
  const lMuted = Math.min(PRIMARY_L_MAX, Math.max(PRIMARY_L_MIN, l * 0.94 + 0.02));
  return hslToHex(h, sMuted, lMuted);
}

/**
 * Variações da mesma matiz para fatias do donut — legíveis em fundo claro, sem cores “estouradas”.
 * Sem `themeColor` válido, reutiliza {@link CHART_SERIES_COLORS}.
 */
export function chartSeriesColorsFromTheme(themeColor: string | null | undefined, count: number): string[] {
  if (count <= 0) return [];
  const t = themeColor?.trim();
  if (!t || !THEME_HEX.test(t)) {
    return Array.from({ length: count }, (_, i) => CHART_SERIES_COLORS[i % CHART_SERIES_COLORS.length]);
  }
  const rgb = hexToRgb(t);
  if (!rgb) {
    return Array.from({ length: count }, (_, i) => CHART_SERIES_COLORS[i % CHART_SERIES_COLORS.length]);
  }
  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const sBase = Math.min(SERIES_S_CAP, Math.max(0.14, s * SERIES_S_BLEND + 0.04));
  if (count === 1) {
    const lClamped = Math.min(0.5, Math.max(0.26, l * 0.92 + 0.03));
    const sOne = Math.min(SERIES_S_CAP, sBase);
    return [hslToHex(h, sOne, lClamped)];
  }
  const L_MIN = 0.24;
  const L_MAX = 0.53;
  const lCenter = Math.min(L_MAX, Math.max(L_MIN, l * 0.96 + 0.02));
  const half = 0.155;
  const lStart = Math.max(L_MIN, lCenter - half);
  const lEnd = Math.min(L_MAX, Math.max(lStart + 0.1, lCenter + half));
  return Array.from({ length: count }, (_, i) => {
    const tNorm = i / (count - 1);
    const li = lStart + (lEnd - lStart) * tNorm;
    const satFade = 1 - tNorm * SERIES_LIGHT_SAT_FADE;
    const si = Math.min(SERIES_S_CAP, sBase * Math.max(SERIES_LIGHT_SAT_FLOOR, satFade));
    return hslToHex(h, si, li);
  });
}
