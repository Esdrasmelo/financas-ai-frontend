"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { LogOut, User, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function navLinkActive(href: string, pathname: string) {
  if (href === "/home") return pathname === "/home";
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const links = [
  { href: "/home", label: "Início" },
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
  const { user, logout } = useAuth();

  return (
    <div className={cn("flex min-h-screen flex-col bg-background", className)}>
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1280px] items-center gap-4 px-4 py-3 sm:px-6">
          <Link
            href="/home"
            className="flex shrink-0 items-center gap-2.5 rounded-lg text-foreground transition-opacity hover:opacity-90"
          >
            <Image src="/logo.png" alt="" width={160} height={160} className="h-16 w-16" />
            <span className="hidden text-base font-semibold tracking-tight sm:inline">Prisma | Finanças</span>
          </Link>

          <nav className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
            {links.map((link) => {
              const isActive = navLinkActive(link.href, pathname);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "shrink-0 px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground",
                    isActive && "text-foreground underline decoration-primary decoration-2 underline-offset-[6px]",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="shrink-0 gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-muted-foreground text-xs focus:bg-transparent" disabled>
                  {user.email}
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account">
                    <Shield className="mr-2 h-4 w-4" />
                    Minha conta
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
