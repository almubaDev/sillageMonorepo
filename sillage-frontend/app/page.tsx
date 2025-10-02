import type { SVGProps } from "react";

const featuredAccords = [
  {
    title: "Acorde Oriental",
    notes: "Ámbar · Vainilla · Resinas",
    energy: "Intensidad 92%"
  },
  {
    title: "Floral Radiante",
    notes: "Gardenia · Peonía · Rosa turca",
    energy: "Luminosidad 86%"
  },
  {
    title: "Cítrico Bruma",
    notes: "Bergamota · Yuzu · Neroli",
    energy: "Frescura 78%"
  }
] as const;

const rituals = [
  {
    name: "Bruma matutina",
    description: "Activa tu energía antes de salir",
    time: "08:00",
    progress: 72,
    notes: ["Bergamota", "Neroli", "Almizcle"]
  },
  {
    name: "Aura creativa",
    description: "Estimula inspiración durante el trabajo",
    time: "12:30",
    progress: 54,
    notes: ["Iris", "Violeta", "Sándalo"]
  },
  {
    name: "Velada íntima",
    description: "Eleva el mood nocturno",
    time: "20:00",
    progress: 88,
    notes: ["Ámbar gris", "Pachulí", "Vainilla"]
  }
] as const;

const experiences = [
  {
    title: "Cámara de notas",
    description: "Explora combinaciones sensoriales generadas por IA a partir de tu piel.",
    status: "Nuevo"
  },
  {
    title: "Mapa olfativo",
    description: "Visualiza tu colección organizada por emociones y estaciones.",
    status: "Actualizado"
  }
] as const;

const timeline = [
  {
    label: "Análisis de estela",
    time: "En 2 horas",
    description: "Veremos cómo evoluciona el acorde oriental sobre tu piel.",
    tone: "primario"
  },
  {
    label: "Recordatorio de hidratación",
    time: "Mañana 07:30",
    description: "Mejora la fijación antes de aplicar tus capas cítricas.",
    tone: "suave"
  },
  {
    label: "Entrega boutique",
    time: "Viernes",
    description: "El set 'Noir Chic' llegará a tu estudio sensorial.",
    tone: "neutro"
  }
] as const;

const journalPrompts = [
  "¿Qué emoción predominó en tu fragancia de hoy?",
  "Describe la primera nota que percibiste al reaplicar.",
  "¿Con qué escenario visual conectarías este aroma?"
] as const;

export default function Home() {
  return (
    <div className="flex h-full flex-col gap-6">
      <section className="overflow-hidden rounded-3xl border border-border/60 bg-surface p-6 shadow-sm shadow-black/5">
        <div className="grid gap-6 md:grid-cols-[1.6fr,1fr] md:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
              <SparklesIcon className="h-4 w-4" /> Ritual activo “Bruma matutina”
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-serif font-semibold leading-tight sm:text-4xl">
                Bienvenida, Lea. Este es tu cuaderno de aromas consciente.
              </h1>
              <p className="max-w-xl text-base text-muted-text">
                Tus notas favoritas se sincronizan con tu piel, tus espacios y tus rituales diarios. Diseñamos esta interfaz para que puedas explorar, documentar y componer fragancias sin fricción.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/30 transition hover:brightness-110">
                Explorar colección
              </button>
              <button className="rounded-full border border-border/70 px-5 py-2 text-sm font-semibold text-muted-text transition hover:border-primary/60 hover:text-primary">
                Crear ritual personalizado
              </button>
            </div>
            <dl className="grid gap-4 sm:grid-cols-3">
              {featuredAccords.map((accord) => (
                <div key={accord.title} className="rounded-2xl border border-border/60 bg-surface-soft p-4 shadow-sm">
                  <dt className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-text">{accord.title}</dt>
                  <dd className="mt-2 text-sm font-medium text-foreground">{accord.notes}</dd>
                  <p className="mt-3 text-xs text-muted-text">{accord.energy}</p>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/20 via-surface-soft to-surface p-6 shadow-inner">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--accent)_/_0.25),transparent_70%)]" aria-hidden />
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-text">Fragancia del día</p>
                <h2 className="mt-3 text-2xl font-serif font-semibold">Noir Étoilé</h2>
                <p className="mt-2 text-sm text-muted-text">
                  Acordes de cacao oscuro, peonía nocturna y un velo de almizcle blanco. Ideal para tu ritual de velada íntima.
                </p>
              </div>
              <div className="mt-6 space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-muted-text">Duración estimada</p>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface">
                    <div className="h-full w-11/12 rounded-full bg-primary" />
                  </div>
                  <p className="mt-1 text-xs text-muted-text">11h · En equilibrio con la temperatura actual</p>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-text">
                  <span>Capas activas</span>
                  <span className="font-medium text-foreground">3 de 4</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[3fr,2fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-border/60 bg-surface p-6 shadow-sm">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Rituales sugeridos para hoy</h2>
                <p className="text-sm text-muted-text">Afinados según humedad, temperatura y agenda.</p>
              </div>
              <button className="self-start rounded-full border border-border/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-text transition hover:border-primary/60 hover:text-primary">
                Ver agenda completa
              </button>
            </header>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {rituals.map((ritual) => (
                <article key={ritual.name} className="flex h-full flex-col justify-between rounded-2xl border border-border/50 bg-surface-soft p-4 shadow-sm">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-text">
                      <span className="font-semibold uppercase tracking-[0.3em]">{ritual.time}</span>
                      <span>#{ritual.name.toLowerCase().replace(/\s/g, "-")}</span>
                    </div>
                    <h3 className="text-base font-semibold text-foreground">{ritual.name}</h3>
                    <p className="text-sm text-muted-text">{ritual.description}</p>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${ritual.progress}%` }} />
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-text">
                      {ritual.notes.map((note) => (
                        <span key={note} className="rounded-full border border-border/50 bg-background px-3 py-1 font-medium text-foreground/80">
                          {note}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {experiences.map((experience) => (
              <article key={experience.title} className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-surface-soft via-surface to-surface-soft p-5 shadow-sm">
                <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-muted-text">
                  {experience.status}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-foreground">{experience.title}</h3>
                <p className="mt-2 text-sm text-muted-text">{experience.description}</p>
                <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
                  Abrir experiencia
                  <ArrowIcon className="h-4 w-4" />
                </div>
                <div className="pointer-events-none absolute -right-8 bottom-0 h-32 w-32 rounded-full bg-[hsl(var(--accent))] opacity-20 blur-3xl" aria-hidden />
              </article>
            ))}

            <article className="rounded-3xl border border-border/60 bg-surface-soft p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground">Estadísticas de colección</h3>
              <p className="mt-1 text-sm text-muted-text">Así evoluciona tu archivo personal durante la última semana.</p>
              <dl className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-muted-text">Capas registradas</dt>
                  <dd className="text-sm font-semibold text-foreground">18 (+4)</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-muted-text">Nuevas reseñas</dt>
                  <dd className="text-sm font-semibold text-foreground">6</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-text">Rituales completados</dt>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface">
                    <div className="h-full w-3/4 rounded-full bg-secondary" />
                  </div>
                  <p className="mt-1 text-xs text-muted-text">75% del objetivo semanal alcanzado.</p>
                </div>
              </dl>
            </article>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-border/60 bg-surface p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Agenda aromática</h2>
            <p className="text-sm text-muted-text">Seguimiento de evaluaciones, recordatorios y entregas.</p>
            <ul className="mt-4 space-y-4">
              {timeline.map((entry) => (
                <li key={entry.label} className="rounded-2xl border border-border/60 bg-surface-soft p-4">
                  <div className="flex items-center justify-between text-xs text-muted-text">
                    <span className="font-semibold uppercase tracking-[0.3em]">{entry.label}</span>
                    <span>{entry.time}</span>
                  </div>
                  <p className="mt-2 text-sm text-foreground">{entry.description}</p>
                  <Badge tone={entry.tone} />
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-border/60 bg-surface-soft p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Bitácora sensorial</h2>
            <p className="text-sm text-muted-text">Responde para registrar tus estados y notas.</p>
            <ul className="mt-4 space-y-3 text-sm text-foreground">
              {journalPrompts.map((prompt) => (
                <li key={prompt} className="rounded-2xl border border-border/50 bg-background px-4 py-3 text-muted-text transition hover:border-primary/50 hover:text-foreground">
                  {prompt}
                </li>
              ))}
            </ul>
            <button className="mt-4 w-full rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background shadow-sm transition hover:opacity-90">
              Registrar respuesta
            </button>
          </div>
        </aside>
      </section>
    </div>
  );
}

function SparklesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3v3" />
      <path d="M12 18v3" />
      <path d="M5.22 5.22 7.05 7.05" />
      <path d="M16.95 16.95 18.78 18.78" />
      <path d="M3 12h3" />
      <path d="M18 12h3" />
      <path d="M5.22 18.78 7.05 16.95" />
      <path d="M16.95 7.05 18.78 5.22" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function ArrowIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

type BadgeProps = {
  tone: "primario" | "suave" | "neutro";
};

function Badge({ tone }: BadgeProps) {
  const baseClasses = "mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]";

  if (tone === "primario") {
    return <span className={`${baseClasses} bg-primary/20 text-primary`}>Seguimiento activo</span>;
  }

  if (tone === "suave") {
    return <span className={`${baseClasses} bg-secondary/20 text-secondary`}>Recomendado</span>;
  }

  return <span className={`${baseClasses} bg-muted/40 text-muted-text`}>Informativo</span>;
}
