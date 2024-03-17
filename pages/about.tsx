import React from "react";
import { Main } from "../components/Layouts";
import { SEO } from "../components/SEO";
import Writing from "../components/Home/Writing";
import { LinkExternal } from "../components/Links";
import Badge from "../components/Badge";


export default function Colophon() {
  return (
    <>
      <SEO
        seo={{
          title: "About",
          path: "/about",
        }}
      />
      <Main>
      <header><h1 className="text-xl text-neutral-800 [font-variation-settings:'opsz'_32,_'wght'_500] dark:text-white sm:pb-6 sm:text-xl">
          About
        </h1></header>
        <dl className="list-container">
      <dt className="list-title">
        <h3 className="text-neutral-500 dark:text-silver-dark">
          <div className="flex items-center gap-2">
            2023
            <Badge>Present</Badge>
          </div>
        </h3>
      </dt>
      <dd className="list-content">
        <div>Currently, I lead growth at <LinkExternal href="//goldsky.com">Goldsky</LinkExternal>, a realtime data infrastructure company.</div>
        <div className="pt-1 text-sm text-neutral-500 [font-variation-settings:'opsz'_14] dark:text-silver-dark">
        That sounds boring but I promise it&#39;s not. We solve complex data engineering problems that enable our customers to focus on building awesome new products, not wrangling with their data infra all day.
        </div>
      </dd>

      <dt className="list-title mt-4 border-none pt-4 sm:mt-0">
        <h3 className="text-neutral-500 dark:text-silver-dark">2020</h3>
      </dt>
      <dd className="list-content border-none pt-4">
        <div>When COVID19 hit Canada, I co-founded <LinkExternal href="//getgroceryhero.com">GroceryHero</LinkExternal> to match frontline medical workers with a volunteer shoppers.</div>
        <div className="pt-1 text-sm text-neutral-500 [font-variation-settings:'opsz'_14] dark:text-silver-dark">
        We made &gt;4K matches in 4 months, with over 70% of matches within 1km of each other. We were endorsed by notable public figures (eg. the mayor of Toronto, Ontario minister of health, deputy prime minister of Canada) and covered in major news networks (eg. National Post, CTV, CP24, Betakit, Global News).
        </div>
      </dd>

      <dt className="list-title mt-4 border-none pt-4 sm:mt-0">
        <h3 className="text-neutral-500 dark:text-silver-dark">2019</h3>
      </dt>
      <dd className="list-content border-none pt-4">
        <div>I built <LinkExternal href="//helika.io">Helika</LinkExternal>, <LinkExternal href="//conduit.fi">Conduit</LinkExternal>, and <LinkExternal href="//novisto.com">Novisto</LinkExternal> out of a $150M venture studio called <LinkExternal href="//diagram.ca">Diagram</LinkExternal>.</div>
        <div className="pt-1 text-sm text-neutral-500 [font-variation-settings:'opsz'_14] dark:text-silver-dark">
        I came up with the ideas, proved them by securing early users and investors, and hired the core team (CEO, CTO). These companies now have a combined market cap of &gt;$200M USD and employ &gt;150 people.
        </div>
      </dd>

      <dt className="list-title mt-4 border-none pt-4 sm:mt-0">
        <h3 className="text-neutral-500 dark:text-silver-dark">2018</h3>
      </dt>
      <dd className="list-content border-none pt-4">
        <div>At the <LinkExternal href="//wef.org">World Economic Forum</LinkExternal>, I led research on the impact of emerging tech in financial services.</div>
        <div className="pt-1 text-sm text-neutral-500 [font-variation-settings:'opsz'_14] dark:text-silver-dark">
        I interviewed 200+ industry leaders across the globe, and summarized my findings in reports that have been quoted / covered in the Wall Street Journal, Bloomberg, and numerous other publications.<br /><br />
          <LinkExternal href="https://www3.weforum.org/docs/WEF_Next_Gen_Data_Sharing_Financial_Services.pdf">The next generation of data sharing in financial services</LinkExternal><br />
          <LinkExternal href="https://www3.weforum.org/docs/WEF_Navigating_Uncharted_Waters_Report.pdf">Roadmap to responsible innovation with AI in financial services</LinkExternal>        </div>
      </dd>

      <dt className="list-title mt-4 border-none pt-4 sm:mt-0">
        <h3 className="text-neutral-500 dark:text-silver-dark">2016</h3>
      </dt>
      <dd className="list-content border-none pt-4">
        <div>I worked at Monitor Deloitte as a strategy consultant, where I spent most of my time exploring open banking.</div>
        <div className="pt-1 text-sm text-neutral-500 [font-variation-settings:'opsz'_14] dark:text-silver-dark">
I helped large financial institutions in Canada, USA, and the Carribean expand into new categories and launch new products.</div>
      </dd>

      <dt className="list-title mt-4 border-none pt-4 sm:mt-0">
        <h3 className="text-neutral-500 dark:text-silver-dark">2014</h3>
      </dt>
      <dd className="list-content border-none pt-4">
        <div>I co-founded REACH Diagnostics, a diabetes screening and care platform for urban slum dwellers in India.</div>
        <div className="pt-1 text-sm text-neutral-500 [font-variation-settings:'opsz'_14] dark:text-silver-dark">
        REACH was selected as one of the top 6 teams out of 11,000+ applicants globally to participate in an accelerator program in Boston. We screened over 4,500 individuals and impacted over 90,000 citizens in India through diagnosis, treatment, and awareness campaigns. We pitched to former president Bill Clinton, Nobel laureate Muhammad Yunu, and other esteemed social enterprise experts.
        </div>
      </dd>
    </dl>
      </Main>
    </>
  );
}
