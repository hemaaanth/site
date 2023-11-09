import React from "react";
import { Main } from "../components/Layouts";
import { SEO } from "../components/SEO";
import Writing from "../components/Home/Writing";
import Link from "next/link"
import { LinkExternal } from "../components/Links";

export default function Home() {
  return (
    <>
      <SEO
        seo={{
          title: "Hemanth Soni",
          path: "/",
        }}
      />
      <Main>
        <h1 className="text-xl text-neutral-800 [font-variation-settings:'opsz'_32,_'wght'_500] dark:text-white sm:pb-6 sm:text-xl">
          Hemanth Soni
        </h1>
        <dl className="list-container">
          <dt className="list-title">
            <h3 className="text-neutral-500 dark:text-silver-dark">
              Intro
            </h3>
          </dt>
          <dd className="list-content">
          <div>I have a decade of experience building in financial services, data infrastructure, crypto, and various mixes of the three. Currently, I lead growth at Goldsky. More about me <Link href="/about" className="link inline-flex items-center gap-1">here</Link>.</div>
          </dd>
        </dl>
        <Writing />
        <dl className="list-container">
          <dt className="list-title">
            <h3 className="text-neutral-500 dark:text-silver-dark">
              Reading
            </h3>
          </dt>
          <dd className="list-content">
          <div><LinkExternal href="https://literal.club/book/nine-pints-rmlbu">Nine Pints</LinkExternal> by Rose George</div>
          <div><LinkExternal href="https://literal.club/book/the-first-fifteen-lives-of-harry-august-d9bij">The First Fifteen Lives of Harry August
</LinkExternal> by Claire North</div>
          </dd>
        </dl>
      </Main>
    </>
  );
}
