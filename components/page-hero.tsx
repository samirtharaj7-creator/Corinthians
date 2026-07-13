import type { ReactNode } from "react";

export function PageHero({ eyebrow, title, description, children }: { eyebrow?: string; title: string; description?: string; children?: ReactNode }) {
  return (
    <section className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="folio-panel mx-auto max-w-7xl p-6 sm:p-8">
        {eyebrow ? (
          <p className="eyebrow-chip">
            {eyebrow}
          </p>
        ) : null}
        <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h1 className="text-5xl font-black tracking-normal text-balance sm:text-6xl">{title}</h1>
            {description ? <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">{description}</p> : null}
          </div>
          {children}
        </div>
      </div>
    </section>
  );
}
