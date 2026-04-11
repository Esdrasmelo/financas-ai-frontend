"use client";

import { useEffect, useState } from "react";
import {
  Shield,
  CheckCircle2,
  XCircle,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  MapPin,
  Wifi,
  Clock,
  Sun,
  Moon,
  Check,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getApiBase, authFetch } from "@/lib/api";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

type LoginEntry = {
  id: string;
  success: boolean;
  ip: string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  countryCode: string | null;
  isp: string | null;
  timezone: string | null;
  createdAt: string;
};

function DeviceIcon({ device }: { device: string | null }) {
  if (device === "Mobile") return <Smartphone className="h-4 w-4" />;
  if (device === "Tablet") return <Tablet className="h-4 w-4" />;
  return <Monitor className="h-4 w-4" />;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function locationString(entry: LoginEntry): string {
  const parts = [entry.city, entry.region, entry.country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Local desconhecido";
}

export default function AccountPage() {
  const [history, setHistory] = useState<LoginEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const base = getApiBase();
    authFetch(`${base}/auth/login-history?limit=50`)
      .then(async (res) => {
        if (res.ok) setHistory((await res.json()) as LoginEntry[]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const theme = useTheme();

  const presets = [
    { label: "Verde", primary: "#1f4b46", accent: "#dceae7" },
    { label: "Azul", primary: "#1e3a5f", accent: "#dbeafe" },
    { label: "Roxo", primary: "#4c1d95", accent: "#ede9fe" },
    { label: "Índigo", primary: "#312e81", accent: "#e0e7ff" },
    { label: "Rosa", primary: "#831843", accent: "#fce7f3" },
    { label: "Laranja", primary: "#7c2d12", accent: "#ffedd5" },
    { label: "Grafite", primary: "#1f2937", accent: "#e5e7eb" },
    { label: "Ciano", primary: "#164e63", accent: "#cffafe" },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Minha conta"
        subtitle="Aparência, segurança e histórico de acessos"
      />

      <SectionCard title="Aparência" description="Personalize as cores e o modo do sistema">
        <div className="space-y-6">
          {/* Mode */}
          <div>
            <p className="mb-3 text-sm font-medium">Modo</p>
            <div className="flex gap-3">
              <button
                onClick={() => theme.setTheme("light", theme.primary, theme.accent)}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium transition-all",
                  theme.mode === "light"
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border text-muted-foreground hover:border-border-strong",
                )}
              >
                <Sun className="h-4 w-4" />
                Claro
                {theme.mode === "light" && <Check className="h-3.5 w-3.5 text-primary" />}
              </button>
              <button
                onClick={() => theme.setTheme("dark", theme.primary, theme.accent)}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium transition-all",
                  theme.mode === "dark"
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border text-muted-foreground hover:border-border-strong",
                )}
              >
                <Moon className="h-4 w-4" />
                Escuro
                {theme.mode === "dark" && <Check className="h-3.5 w-3.5 text-primary" />}
              </button>
            </div>
          </div>

          {/* Color presets */}
          <div>
            <p className="mb-3 text-sm font-medium">Cor primária</p>
            <div className="flex flex-wrap gap-2.5">
              {presets.map((p) => (
                <button
                  key={p.label}
                  onClick={() => theme.setTheme(theme.mode, p.primary, p.accent)}
                  className={cn(
                    "group flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm transition-all",
                    theme.primary === p.primary
                      ? "border-primary bg-primary/5 font-medium text-foreground"
                      : "border-border text-muted-foreground hover:border-border-strong",
                  )}
                >
                  <span
                    className="block h-4 w-4 rounded-full ring-1 ring-black/10"
                    style={{ backgroundColor: p.primary }}
                  />
                  {p.label}
                  {theme.primary === p.primary && <Check className="h-3.5 w-3.5 text-primary" />}
                </button>
              ))}
            </div>
          </div>

          {/* Custom color */}
          <div>
            <p className="mb-3 text-sm font-medium">Cor personalizada</p>
            <div className="flex items-center gap-3">
              <label className="relative cursor-pointer">
                <input
                  type="color"
                  value={theme.primary}
                  onChange={(e) => theme.setTheme(theme.mode, e.target.value, theme.accent)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <span
                  className="block h-10 w-10 rounded-xl ring-1 ring-black/10 transition-shadow hover:ring-2"
                  style={{ backgroundColor: theme.primary }}
                />
              </label>
              <span className="text-sm text-muted-foreground">{theme.primary}</span>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Histórico de logins"
        description={`Últimos ${history.length} acessos registrados`}
        contentClassName="pt-0"
      >
        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Carregando...</div>
        ) : history.length === 0 ? (
          <EmptyState
            icon={Shield}
            title="Nenhum registro"
            description="O histórico de logins aparecerá aqui após o próximo acesso."
          />
        ) : (
          <div className="divide-y divide-border">
            {history.map((entry) => (
              <div key={entry.id} className="flex items-start gap-4 px-1 py-4 first:pt-2">
                <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  entry.success
                    ? "bg-emerald-500/10 text-emerald-600"
                    : "bg-destructive/10 text-destructive"
                }`}>
                  {entry.success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                </div>

                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={entry.success ? "secondary" : "destructive"} className="text-xs">
                      {entry.success ? "Sucesso" : "Falhou"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      <Clock className="mr-1 inline h-3 w-3" />
                      {formatDate(entry.createdAt)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <DeviceIcon device={entry.device} />
                      {[entry.browser, entry.os, entry.device].filter(Boolean).join(" · ")}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {locationString(entry)}
                    </span>
                    {entry.ip && (
                      <span className="inline-flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {entry.ip}
                      </span>
                    )}
                    {entry.isp && (
                      <span className="inline-flex items-center gap-1">
                        <Wifi className="h-3 w-3" />
                        {entry.isp}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
