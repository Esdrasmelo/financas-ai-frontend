"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
  { src: "/screenshot-dashboard.png", label: "Dashboard financeiro" },
  { src: "/screenshot-credit-cards.png", label: "Cartões de crédito" },
  { src: "/screenshot-planning.png", label: "Planejamento mensal" },
  { src: "/screenshot-entries.png", label: "Lançamentos" },
  { src: "/screenshot-fixed.png", label: "Contas fixas" },
  { src: "/screenshot-purchases.png", label: "Compras no cartão" },
  { src: "/screenshot-invoice-detail.png", label: "Detalhe de fatura" },
  { src: "/screenshot-statements.png", label: "Lista de faturas" },
];

export function ScreenshotCarousel() {
  const [current, setCurrent] = React.useState(0);
  const timerRef = React.useRef<ReturnType<typeof setInterval>>(null);

  function resetTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((p) => (p + 1) % slides.length);
    }, 4000);
  }

  React.useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  function go(dir: -1 | 1) {
    setCurrent((p) => (p + dir + slides.length) % slides.length);
    resetTimer();
  }

  return (
    <div className="relative mx-auto w-full">
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
        {slides.map((slide, i) => (
          <Image
            key={slide.src}
            src={slide.src}
            alt={slide.label}
            fill
            sizes="(min-width: 1024px) 900px, 90vw"
            className={`object-cover object-top transition-opacity duration-500 ${
              i === current ? "opacity-100" : "opacity-0"
            }`}
            priority={i === 0}
          />
        ))}

        <button
          onClick={() => go(-1)}
          className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
          aria-label="Anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => go(1)}
          className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
          aria-label="Próximo"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-5 flex items-center justify-center gap-3">
        {slides.map((slide, i) => (
          <button
            key={i}
            onClick={() => { setCurrent(i); resetTimer(); }}
            className="group flex items-center gap-2"
            aria-label={slide.label}
          >
            <span
              className={`block h-2 rounded-full transition-all duration-300 ${
                i === current
                  ? "w-8 bg-primary"
                  : "w-3 bg-border hover:bg-muted-foreground/40"
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-xs text-muted-foreground">
          {slides[current].label}
        </span>
      </div>
    </div>
  );
}
