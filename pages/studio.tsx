import React from "react";
import { Main } from "../components/Layouts";
import { SEO } from "../components/SEO";
import { LinkExternal } from "../components/Links";
import { ProjectScreenshot } from "../components/ProjectScreenshot";
import { getProjectShots, ProjectShot } from "../lib/screenshots";

export default function Studio({ shots }: { shots: Record<string, ProjectShot> }) {
  return (
    <>
      <SEO seo={{ title: "Studio", path: "/studio" }} />
      <Main>
        <header>
          <h1 className="text-xl text-neutral-800 [font-variation-settings:'opsz'_32,_'wght'_500] dark:text-white sm:pb-6 sm:text-xl">
            Studio
          </h1>
        </header>
        <dl className="list-container mt-6">
          <React.Fragment>
            <dt className="studio-list-title">
              <ProjectScreenshot
                src={shots.caniworknow.card}
                fallback={shots.caniworknow.fallback}
                alt="Can I Work Now? header screenshot"
              />
            </dt>
            <dd className="studio-list-content">
              <LinkExternal href="https://caniworknow.com">Can I Work Now?</LinkExternal>
              <div className="pt-1 text-sm text-neutral-500 [font-variation-settings:'opsz'_14] dark:text-silver-dark">
                A live yes or no on whether GitHub, Cloudflare, Claude, and Codex are up.
              </div>
            </dd>
          </React.Fragment>
          <React.Fragment>
            <dt className="studio-list-title mt-8">
              <ProjectScreenshot
                src={shots.slant.card}
                fallback={shots.slant.fallback}
                alt="Slant header screenshot"
              />
            </dt>
            <dd className="studio-list-content mt-8">
              <LinkExternal href="https://slant.page">Slant</LinkExternal>
              <div className="pt-1 text-sm text-neutral-500 [font-variation-settings:'opsz'_14] dark:text-silver-dark">
                A writing app that interviews you, researches, and drafts in your voice.
              </div>
            </dd>
          </React.Fragment>
          <React.Fragment>
            <dt className="studio-list-title mt-8">
              <ProjectScreenshot
                src={shots.sher.card}
                fallback={shots.sher.fallback}
                alt="Sher header screenshot"
              />
            </dt>
            <dd className="studio-list-content mt-8">
              <LinkExternal href="https://sher.ing">Sher</LinkExternal>
              <div className="pt-1 text-sm text-neutral-500 [font-variation-settings:'opsz'_14] dark:text-silver-dark">
                Share live coding agent sessions with your team or across machines.
              </div>
            </dd>
          </React.Fragment>
          <React.Fragment>
            <dt className="studio-list-title mt-8">
              <ProjectScreenshot
                src={shots.statcan.card}
                fallback={shots.statcan.fallback}
                alt="statcan2 header screenshot"
              />
            </dt>
            <dd className="studio-list-content mt-8">
              <LinkExternal href="https://statcan2.ca">statcan2</LinkExternal>
              <div className="pt-1 text-sm text-neutral-500 [font-variation-settings:'opsz'_14] dark:text-silver-dark">
                Statistics Canada data, easier to find, chart, and query.
              </div>
            </dd>
          </React.Fragment>
          <React.Fragment>
            <dt className="studio-list-title mt-8">
              <ProjectScreenshot
                src={shots.hypee.card}
                fallback={shots.hypee.fallback}
                alt="Hyp.ee header screenshot"
              />
            </dt>
            <dd className="studio-list-content mt-8">
              <LinkExternal href="https://hyp.ee">Hyp.ee</LinkExternal>
              <div className="pt-1 text-sm text-neutral-500 [font-variation-settings:'opsz'_14] dark:text-silver-dark">
                Hand-picked apps, software, readings, and more.
              </div>
            </dd>
          </React.Fragment>
          <React.Fragment>
            <dt className="studio-list-title mt-8">
              <ProjectScreenshot
                src={shots.bridgebot.card}
                fallback={shots.bridgebot.fallback}
                alt="Bridgebot header screenshot"
              />
            </dt>
            <dd className="studio-list-content mt-8">
              <LinkExternal href="https://bridgebot.cloud">
                Bridgebot
              </LinkExternal>
              <div className="pt-1 text-sm text-neutral-500 [font-variation-settings:'opsz'_14] dark:text-silver-dark">
                Real-time relay between Telegram group chats and Slack channels.
              </div>
            </dd>
          </React.Fragment>
          <React.Fragment>
            <dt className="studio-list-title mt-8">
              <ProjectScreenshot
                src={shots.tagtunes.card}
                fallback={shots.tagtunes.fallback}
                alt="Tagtun.es header screenshot"
              />
            </dt>
            <dd className="studio-list-content mt-8">
              <LinkExternal href="https://tagtun.es">
                Tagtun.es
              </LinkExternal>
              <div className="pt-1 text-sm text-neutral-500 [font-variation-settings:'opsz'_14] dark:text-silver-dark">
                A tags-based music manager for Spotify.
              </div>
            </dd>
          </React.Fragment>
          <React.Fragment>
            <dt className="studio-list-title mt-8 opacity-50">
              <div className="studio-screenshot-placeholder bg-gray-200 dark:bg-zinc-900" />
            </dt>
            <dd className="studio-list-content mt-8 opacity-50">
              <div className="font-medium text-neutral-700 dark:text-silver-dark select-none">
                ▒▒▒▒▒▒▒▒▒▒
              </div>
              <div className="pt-1 text-sm text-neutral-500 [font-variation-settings:'opsz'_14] dark:text-silver-dark select-none">
                ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
              </div>{" "}
            </dd>
          </React.Fragment>
        </dl>
      </Main>
    </>
  );
}

export async function getStaticProps() {
  return {
    props: { shots: await getProjectShots() },
    revalidate: 3600, // refresh the signed URLs and re-check the API every hour
  };
}
