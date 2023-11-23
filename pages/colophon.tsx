import React from "react";
import { Main } from "../components/Layouts";
import { SEO } from "../components/SEO";
import Writing from "../components/Home/Writing";

export default function Colophon() {
  return (
    <>
      <SEO
        seo={{
          title: "Colophon",
          path: "/colophon",
        }}
      />
      <Main>
      <header><h1 className="text-xl text-neutral-800 [font-variation-settings:'opsz'_32,_'wght'_500] dark:text-white sm:pb-6 sm:text-xl">
          Colophon
        </h1></header>
        <dl className="list-container">
          <dt className="list-title">
            <h3 className="text-neutral-500 dark:text-silver-dark">
              Source
            </h3>
          </dt>
          <dd className="list-content">
          <p>
              The majority of this website&#39;s code is forked from <a className="link" target="_blank" href="https://www.fabianschultz.com/">Fabian Schultz</a>, which is open source and available on <a className="link" target="_blank" href="https://github.com/fabe/site">Github</a>.
            </p>
          </dd>
        </dl>
        <dl className="list-container">
          <dt className="list-title">
            <h3 className="text-neutral-500 dark:text-silver-dark">
              Technology
            </h3>
          </dt>
          <dd className="list-content">
            <p>
              Built with <a className="link" target="_blank" href="https://nextjs.org">Next.js</a> and <a className="link" target="_blank" href="https://tailwindcss.com">Tailwind</a>, hosted on <a className="link" target="_blank" href="https://vercel.com">Vercel</a>. The font face is <a className="link" target="_blank" href="https://rsms.me/inter/">Inter</a> by <a className="link" target="_blank" href="https://rsms.me">Rasmus Andersson</a>.
            </p>
          </dd>
        </dl>
      </Main>
    </>
  );
}
