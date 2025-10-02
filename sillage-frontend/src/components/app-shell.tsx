"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

import { usePalette } from "@/lib/palette-context";

type AppShellProps = {
  children: ReactNode;
};

const mainNavItems = [
  { label: "Inicio", href: "/", icon: HomeIcon },
  { label: "Colección", href: "/coleccion", icon: CollectionIcon },
  { label: "Rituales", href: "/rituales", icon: RitualsIcon },
  { label: "Notas y reseñas", href: "/notas", icon: NotebookIcon },
  { label: "Explorar", href: "/explorar", icon: CompassIcon }
] as const;

const quickActions = [
  { label: "Registrar aroma", href: "/registro" },
  { label: "Sincronizar piel", href: "/piel" },
  { label: "Moodboard", href: "/moodboard" }
] as const;

const bottomNavItems = [
  { label: "Inicio", href: "/", icon: HomeIcon },
  { label: "Explorar", href: "/explorar", icon: CompassIcon },
  { label: "Rituales", href: "/rituales", icon: RitualsIcon },
  { label: "Perfil", href: "/perfil", icon: UserIcon }
] as const;

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { activePalette, cyclePalette, palettes, setActivePalette } = usePalette();

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-[hsl(var(--accent))] opacity-20 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[hsl(var(--secondary))] opacity-20 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-surface px-5 py-4 shadow-sm shadow-black/5 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={cyclePalette}
                className="group flex h-14 w-14 items-center justify-center rounded-2xl border border-border/60 bg-surface-soft p-2 shadow-sm transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                aria-label="Cambiar paleta cromática"
              >
                <Image
                  src="/images/logo.png"
                  alt="Sillage"
                  width={48}
                  height={48}
                  className="rounded-xl transition-transform duration-300 group-active:scale-95"
                  priority
                />
              </button>

              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-muted-text">Sillage App</p>
                <h1 className="text-xl font-serif font-semibold leading-tight">Curador sensorial personal</h1>
                <p className="text-sm text-muted-text">Paleta activa: {activePalette.label}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="rounded-full border border-border/60 bg-surface-soft px-4 py-2 text-sm font-medium text-muted-text transition hover:border-primary/60 hover:text-primary"
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-text">
              {palettes.map((palette) => (
                <button
                  key={palette.id}
                  type="button"
                  onClick={() => setActivePalette(palette.id)}
                  className={`rounded-full border px-3 py-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${palette.id === activePalette.id ? "border-primary/60 bg-primary/15 text-primary" : "border-border/60 bg-surface-soft text-muted-text hover:border-primary/40 hover:text-primary"}`}
                >
                  {palette.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-text">
              Cicla el logo o selecciona una paleta para transformar por completo la experiencia cromática.
            </p>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 lg:flex-row">
          <aside className="hidden w-64 flex-shrink-0 lg:flex">
            <nav className="h-full w-full rounded-3xl border border-border/60 bg-nav-surface p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-text">Navegación</p>
              <ul className="mt-4 space-y-2 text-sm">
                {mainNavItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 rounded-2xl border px-3 py-2 transition hover:border-primary/50 hover:bg-primary/10 hover:text-primary ${
                          isActive
                            ? "border-primary/60 bg-primary/15 text-primary"
                            : "border-nav-border/30 bg-surface-soft text-muted-text"
                        }`}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface text-primary/80">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          <main className="flex-1">
            <div className="flex h-full flex-col gap-6 rounded-3xl border border-border/60 bg-surface-soft p-6 shadow-sm shadow-black/5">
              {children}
            </div>
          </main>
        </div>

        <nav className="sticky bottom-4 z-20 flex rounded-2xl border border-border/60 bg-nav-surface/80 p-3 shadow-lg backdrop-blur lg:hidden">
          <ul className="grid w-full grid-cols-4 gap-3 text-xs font-medium">
            {bottomNavItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 transition ${
                      isActive
                        ? "bg-primary/15 text-primary"
                        : "text-muted-text hover:bg-primary/10 hover:text-primary"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}

function HomeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m3 10.5 9-7.5 9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
    </svg>
  );
}

function CollectionIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8 3h8l2 4H6l2-4Z" />
      <path d="M6 7h12v14H6z" />
      <path d="M9 12h6" />
      <path d="M9 16h6" />
    </svg>
  );
}

function RitualsIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2v4" />
      <path d="M8 2h8" />
      <path d="M6 6h12" />
      <path d="M5 10h14l-1.5 10.5a1 1 0 0 1-1 .85H7.5a1 1 0 0 1-1-.85L5 10Z" />
      <path d="M9 14h6" />
    </svg>
  );
}

function NotebookIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16l-3-2-3 2-3-2-3 2V4Z" />
      <path d="M9 10h6" />
      <path d="M9 14h6" />
    </svg>
  );
}

function CompassIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="m16 8-3.5 7-5.5 1.5 3.5-7L16 8Z" />
    </svg>
  );
}

function UserIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M5.5 20.5c1.5-3 4.5-4.5 6.5-4.5s5 1.5 6.5 4.5" />
    </svg>
  );
}

type IconProps = React.SVGProps<SVGSVGElement>;
