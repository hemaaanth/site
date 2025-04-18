import React from "react";
import { Main } from "../components/Layouts";
import { SEO } from "../components/SEO";
import { LinkExternal } from "../components/Links";
import Image from "next/image";

export default function Studio() {
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
              <Image
                src="/images/studio/hypee_header.png"
                alt="Hyp.ee header screenshot"
                className="studio-screenshot-placeholder object-cover rounded-md border border-neutral-200 dark:border-zinc-800"
                width={794}
                height={548}
              />
            </dt>
            <dd className="studio-list-content">
              <LinkExternal href="https://hyp.ee">Hyp.ee</LinkExternal>
              <div className="pt-1 text-sm text-neutral-500 [font-variation-settings:'opsz'_14] dark:text-silver-dark">
                Hand-picked apps, software, readings, and more.
              </div>
            </dd>
          </React.Fragment>
          <React.Fragment>
            <dt className="studio-list-title mt-8">
              <Image
                src="/images/studio/bridgebot_header.png"
                alt="Hyp.ee header screenshot"
                className="studio-screenshot-placeholder object-cover rounded-md border border-neutral-200 dark:border-zinc-800"
                width={794}
                height={548}
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
