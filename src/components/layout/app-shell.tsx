"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

function navLinkActive(href: string, pathname: string) {
  if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/planning", label: "Planejamento" },
  { href: "/categories", label: "Categorias" },
  { href: "/fixed-expenses", label: "Contas fixas" },
  { href: "/entries", label: "Lançamentos" },
  { href: "/credit-cards", label: "Cartões" },
  { href: "/purchases", label: "Compras" },
  { href: "/statements", label: "Faturas" },
  { href: "/guia", label: "Guia" },
];

export function AppShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <div className={cn("flex min-h-screen flex-col bg-background", className)}>
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center gap-2 px-4 py-3 sm:px-6">
          <Link
            href="/dashboard"
            className="mr-2 flex items-center gap-2 rounded-lg text-foreground transition-opacity hover:opacity-90 sm:mr-6"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Wallet className="h-4 w-4" aria-hidden />
            </span>
            <span className="text-base font-semibold tracking-tight">Finanças AI</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-1">
            {links.map((link) => {
              const isActive = navLinkActive(link.href, pathname);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground",
                    isActive && "bg-primary/10 font-medium text-foreground",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
