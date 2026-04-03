import Link from "next/link";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/categories", label: "Categorias" },
  { href: "/fixed-expenses", label: "Contas fixas" },
  { href: "/entries", label: "Lançamentos" },
  { href: "/credit-cards", label: "Cartões" },
  { href: "/purchases", label: "Compras" },
  { href: "/statements", label: "Faturas" },
];

export function AppShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950", className)}>
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3">
          <Link href="/dashboard" className="mr-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Finanças AI
          </Link>
          <nav className="flex flex-wrap gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-md px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
