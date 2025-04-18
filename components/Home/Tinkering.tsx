import Image from "next/image";
import { LinkExternal } from "../Links";
import Link from "next/link";

const PROJECTS = [
  {
    title: "Hyp.ee",
    url: "https://hyp.ee",
    img: "/images/studio/hypee_header.png",
    imgAlt: "Hyp.ee header screenshot",
    description: "Hand-picked apps, software, readings, and more.",
    width: 794,
    height: 548,
  },
  {
    title: "Bridgebot",
    url: "https://bridgebot.cloud",
    img: "/images/studio/bridgebot_header.png",
    imgAlt: "Bridgebot.cloud header screenshot",
    description: "Real-time relay between Telegram group chats and Slack channels.",
    width: 794,
    height: 548,
  },
];

export default function Tinkering() {
  return (
    <dl className="list-container">
      <dt className="list-title">
        <h3 className="text-neutral-500 dark:text-silver-dark">Tinkering</h3>
      </dt>
      <dd className="list-content">
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
      </dd>
    </dl>
  );
}
