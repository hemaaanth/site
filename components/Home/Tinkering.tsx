import Image from "next/image";
import { LinkExternal } from "../Links";
import Link from "next/link";

const PROJECTS = [
  {
    title: "Slant",
    url: "https://slant.page",
    img: "/images/studio/slant_header.png",
    imgAlt: "Slant header screenshot",
    description: "A writing app that interviews you, researches, and drafts in your voice.",
    width: 794,
    height: 548,
  },
  {
    title: "Sher",
    url: "https://sher.ing",
    img: "/images/studio/sher_header.png",
    imgAlt: "Sher header screenshot",
    description: "Share live coding agent sessions with your team or across machines.",
    width: 794,
    height: 548,
  },
  {
    title: "statcan2",
    url: "https://statcan2.ca",
    img: "/images/studio/statcan_header.png",
    imgAlt: "statcan2 header screenshot",
    description: "Statistics Canada data, easier to find, chart, and query.",
    width: 794,
    height: 548,
  },
];

export default function Tinkering() {
  return (
    <section className="list-container border-0" aria-label="Tinkering">
      <div className="list-title">
        <h2 className="text-neutral-500 dark:text-silver-dark text-base [font-variation-settings:'wght'_400]">Tinkering</h2>
      </div>
      <div className="list-content">
        {PROJECTS.map((project) => (
          <div key={project.url} className="pb-4 last-of-type:pb-0">
            <div className="studio-list-title" />
            <div className="studio-list-content">
              <LinkExternal href={project.url}>
                {project.title}
              </LinkExternal>
              <div className="pt-1 text-sm text-neutral-500 [font-variation-settings:'opsz'_14] dark:text-silver-dark">
                {project.description}
              </div>
            </div>
          </div>
        ))}
        <div className="mt-2 flex items-center gap-3">
          <Link href="/studio" className="link link-sm inline-flex items-center">
            View all
          </Link>
        </div>
      </div>
    </section>
  );
}
