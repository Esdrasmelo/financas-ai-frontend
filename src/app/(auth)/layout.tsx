"use client";

import * as React from "react";
import Image from "next/image";

const slides = [
  { src: "/screenshot-dashboard.png", label: "Dashboard com KPIs e gráficos" },
  { src: "/screenshot-credit-cards.png", label: "Cartões de crédito e limites" },
  { src: "/screenshot-invoice-detail.png", label: "Faturas detalhadas por categoria" },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [current, setCurrent] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <div className="relative hidden overflow-hidden lg:block">
        {slides.map((slide, i) => (
          <Image
            key={slide.src}
            src={slide.src}
            alt={slide.label}
            fill
            sizes="55vw"
            className={`object-cover object-left-top transition-opacity duration-700 ${
              i === current ? "opacity-100" : "opacity-0"
            }`}
            priority={i === 0}
          />
        ))}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />

        <div className="pointer-events-auto relative z-10 flex h-full flex-col justify-between p-8">
          <div className="flex items-center gap-3 text-white drop-shadow-md">
            <Image src="/logo.png" alt="" width={120} height={120} className="h-12 w-12 rounded-xl bg-white/15 p-1 backdrop-blur-sm" />
            <span className="text-lg font-semibold tracking-tight">Prisma | Finanças</span>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold leading-tight text-white drop-shadow-md">
              Controle total das suas finanças pessoais
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-white/70 drop-shadow-sm">
              Acompanhe despesas, cartões de crédito, faturas e planejamento
              financeiro em um só lugar.
            </p>
            <div className="flex items-center gap-3 pt-1">
              {slides.map((slide, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className="group flex items-center gap-2"
                  aria-label={slide.label}
                >
                  <span
                    className={`block h-1.5 rounded-full transition-all duration-300 ${
                      i === current
                        ? "w-8 bg-white"
                        : "w-4 bg-white/30 group-hover:bg-white/60"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-xs text-white/50">
                {slides[current].label}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center bg-background px-4 py-10">
        {children}
      </div>
    </div>
  );
}
