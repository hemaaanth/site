import { LinkExternal } from "../Links";
import Link from "next/link";
import type { ProjectShot } from "../../lib/screenshots";

const PROJECTS = [
  {
    title: "Slant",
    url: "https://slant.page",
    id: "slant",
    description: "A writing app that interviews you, researches, and drafts in your voice.",
  },
  {
    title: "Sher",
    url: "https://sher.ing",
    id: "sher",
    description: "Share live coding agent sessions with your team or across machines.",
  },
  {
    title: "statcan2",
    url: "https://statcan2.ca",
    id: "statcan",
    description: "Statistics Canada data, easier to find, chart, and query.",
  },
];

export default function Tinkering({ shots }: { shots: Record<string, ProjectShot> }) {
  return (
    <section className="list-container border-0" aria-label="Tinkering">
      <div className="list-title">
        <h2 className="text-neutral-500 dark:text-silver-dark text-base [font-variation-settings:'wght'_400]">Tinkering</h2>
      </div>
      <div className="list-content">
        {PROJECTS.map((project) => {
          const shot = shots[project.id];
          return (
            <div key={project.url} className="pb-4 last-of-type:pb-0">
              <div className="studio-list-title" />
              <div className="studio-list-content">
                <LinkExternal
                  href={project.url}
                  imageUrl={shot.preview ?? shot.still}
                  fallbackImageUrl={shot.still}
                  imageVariant="screenshot"
                  preloadImage
                >
                  {project.title}
                </LinkExternal>
                <div className="pt-1 text-sm text-neutral-500 [font-variation-settings:'opsz'_14] dark:text-silver-dark">
                  {project.description}
                </div>
              </div>
            </div>
          );
        })}
        <div className="mt-2 flex items-center gap-3">
          <Link href="/studio" className="link link-sm inline-flex items-center">
            View all
          </Link>
        </div>
      </div>
    </section>
  );
}
