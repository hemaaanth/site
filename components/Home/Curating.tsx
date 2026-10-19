import Link from "next/link";
import Badge from "../Badge";

const LISTS = [
  {
    title: "The code multiplexer universe",
    href: "/multiplexers",
    description: "Every app for running many coding agents at once, scored, filtered to your needs, refreshed by hand.",
  },
];

export default function Curating({ counts = {} }: { counts?: Record<string, number> }) {
  return (
    <section className="list-container border-0" aria-label="Curating">
      <div className="list-title">
        <h2 className="text-neutral-500 dark:text-silver-dark text-base [font-variation-settings:'wght'_400]">Curating</h2>
      </div>
      <div className="list-content">
        {LISTS.map((m) => (
          <div key={m.href} className="pb-4 last-of-type:pb-0">
            <div className="flex items-baseline gap-1">
              <Link href={m.href} className="link inline-flex items-center gap-1">
                {m.title}
              </Link>
              {counts[m.href] ? <Badge>{counts[m.href]} TOOLS</Badge> : null}
            </div>
            <div className="pt-1 text-sm text-neutral-500 [font-variation-settings:'opsz'_14] dark:text-silver-dark">
              {m.description}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
