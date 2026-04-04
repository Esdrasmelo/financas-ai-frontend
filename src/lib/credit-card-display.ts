/** Bandeiras suportadas (alinhado ao backend) */
export const CARD_NETWORK_VALUES = ["visa", "mastercard", "elo", "amex", "hipercard", "other"] as const;
export type CardNetworkValue = (typeof CARD_NETWORK_VALUES)[number];

export const CARD_NETWORK_LABELS: Record<CardNetworkValue, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  elo: "Elo",
  amex: "American Express",
  hipercard: "Hipercard",
  other: "Outra",
};

/** Cores sugeridas para o “plástico” (#RRGGBB) */
export const CARD_THEME_PRESETS: { hex: string; label: string }[] = [
  { hex: "#1e3a5f", label: "Azul marinho" },
  { hex: "#312e81", label: "Roxo" },
  { hex: "#0f766e", label: "Verde petróleo" },
  { hex: "#991b1b", label: "Vinho" },
  { hex: "#1c1917", label: "Preto" },
  { hex: "#b45309", label: "Dourado" },
  { hex: "#1f4b46", label: "Verde app" },
];

export const DEFAULT_CARD_FACE_COLOR = "#1e293b";

export function shadeHex(hex: string, factor: number): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return DEFAULT_CARD_FACE_COLOR;
  const n = parseInt(clean, 16);
  if (!Number.isFinite(n)) return DEFAULT_CARD_FACE_COLOR;
  const r = Math.round(((n >> 16) & 255) * factor);
  const g = Math.round(((n >> 8) & 255) * factor);
  const b = Math.round((n & 255) * factor);
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

/** Valor aceito pelo `<Select>` de bandeira a partir do que veio da API */
export function brandToSelectValue(brand: string | null): string {
  if (!brand) return "none";
  const lower = brand.toLowerCase();
  if ((CARD_NETWORK_VALUES as readonly string[]).includes(lower)) return lower;
  return "other";
}

export function cardFaceGradient(themeColor: string | null | undefined): string {
  const base = themeColor && /^#[0-9A-Fa-f]{6}$/.test(themeColor) ? themeColor : DEFAULT_CARD_FACE_COLOR;
  const mid = shadeHex(base, 0.72);
  const dark = shadeHex(base, 0.38);
  return `linear-gradient(135deg, ${base} 0%, ${mid} 48%, ${dark} 100%)`;
}
