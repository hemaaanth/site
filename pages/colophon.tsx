import React from "react";
import { Main } from "../components/Layouts";
import { SEO } from "../components/SEO";
import { getCurrentCoffee } from "../lib/coffee";

interface CoffeeData {
  coffee: string;
  roaster: string;
  averageRating: number;
  totalRatings: number;
  imageUrl: string;
}

export default function Colophon({ coffeeData }: { coffeeData: CoffeeData | null }) {
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
              The majority of this website&apos;s code is forked from <a className="link" target="_blank" href="https://www.fabianschultz.com/">Fabian Schultz</a>, which is open source and available on <a className="link" target="_blank" href="https://github.com/fabe/site">Github</a>. Text diagram style inspired by <a className="link" target="_blank" href="https://drew.tech">Drew Bredvick</a>.
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
              Built with <a className="link" target="_blank" href="https://nextjs.org">Next.js</a> and <a className="link" target="_blank" href="https://tailwindcss.com">Tailwind</a>, hosted on <a className="link" target="_blank" href="https://vercel.com">Vercel</a>. Vibe-coded with <a className="link" target="_blank" href="https://windsurf.com/">Windsurf</a> and <a className="link" target="_blank" href="https://ampcode.com">Amp</a>. The font face is <a className="link" target="_blank" href="https://rsms.me/inter/">Inter</a> by <a className="link" target="_blank" href="https://rsms.me">Rasmus Andersson</a>.
            </p>
          </dd>
        </dl>
        <dl className="list-container">
          <dt className="list-title">
            <h3 className="text-neutral-500 dark:text-silver-dark">
              Caffeine
            </h3>
          </dt>
          <dd className="list-content">
            <p>
              {coffeeData ? (
                `Currently drinking ${coffeeData.coffee} by ${coffeeData.roaster}, with an average score of ${coffeeData.averageRating.toFixed(2)} across ${coffeeData.totalRatings} rating${coffeeData.totalRatings !== 1 ? 's' : ''}.`
              ) : (
                'Unable to load current coffee information.'
              )}
            </p>
          </dd>
        </dl>
      </Main>
    </>
  );
}

export async function getStaticProps() {
  const coffeeData = await getCurrentCoffee();

  return {
    props: {
      coffeeData,
    },
    revalidate: 3600, // update every hour
  };
}
