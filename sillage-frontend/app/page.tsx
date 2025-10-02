import Link from "next/link";

const resources = [
  {
    href: "https://beta.nextjs.org/docs",
    title: "Guía Next.js",
    description: "Documentación oficial para construir la nueva experiencia web de Sillage."
  },
  {
    href: "https://tanstack.com/query/latest",
    title: "TanStack Query",
    description: "Maneja datos asincrónicos y caché alineada con la API de FastAPI."
  },
  {
    href: "https://tailwindcss.com/docs",
    title: "Tailwind CSS",
    description: "Implementa el sistema de diseño emocional con utilidades consistentes."
  }
];

export default function Home() {
  return (
    <section className="w-full max-w-4xl space-y-12 animate-fade-in">
      <header className="space-y-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-secondary-foreground/80">
          Bienvenido al nuevo frontend de Sillage
        </p>
        <h1 className="text-4xl font-serif font-semibold text-primary sm:text-5xl">
          El punto de partida para una experiencia sensorial
        </h1>
        <p className="mx-auto max-w-2xl text-base text-muted-foreground">
          Esta base con Next.js, TypeScript, Tailwind CSS y TanStack Query está lista para
          integrarse con el backend FastAPI. Añade páginas, componentes y lógica compartida
          para llegar a web, iOS y Android desde una sola plataforma React.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2">
        {resources.map((resource) => (
          <Link
            key={resource.href}
            href={resource.href}
            className="group rounded-2xl border border-border/60 bg-background/60 p-6 transition hover:border-primary/70 hover:shadow-lg"
            target="_blank"
            rel="noreferrer"
          >
            <h2 className="text-xl font-semibold text-foreground group-hover:text-primary">
              {resource.title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{resource.description}</p>
            <span className="mt-4 inline-flex items-center text-sm font-medium text-primary group-hover:translate-x-1 transition-transform">
              Abrir recurso →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
