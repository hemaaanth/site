import React from "react";
import { Main } from "../components/Layouts";
import { SEO } from "../components/SEO";
import Writing from "../components/Home/Writing";
import { LinkExternal } from "../components/Links";


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
      <h1 className="text-xl text-neutral-800 [font-variation-settings:'opsz'_32,_'wght'_500] dark:text-white sm:pb-6 sm:text-xl">
          About
        </h1>
        <dl className="list-container">
      <dt className="list-title">
        <h3 className="text-neutral-500 dark:text-silver-dark">
          <div className="flex items-center gap-2">
            Work
          </div>
        </h3>
      </dt>
      <dd className="list-content">
        <div>Currently, I lead growth at <LinkExternal href="//goldsky.com">Goldsky</LinkExternal>, a realtime data infrastructure company.</div>
        <div className="text-neutral-500 [font-variation-settings:'opsz'_14] dark:text-silver-dark">
          That sounds boring but I promise it&#39;s not. We&#39;re solving complex problems that enable our customers to focus on building awesome new products, not wrangling with their data infrastructure all day.
        </div><br />
        <div>Previously, I built <LinkExternal href="//helika.io">Helika</LinkExternal>, <LinkExternal href="//conduit.fi">Conduit</LinkExternal>, and <LinkExternal href="//novisto.com">Novisto</LinkExternal> out of a venture studio called <LinkExternal href="//diagram.ca">Diagram</LinkExternal>.</div>
        <div className="text-neutral-500 [font-variation-settings:'opsz'_14] dark:text-silver-dark">
          I came up with the ideas, proved them by securing early users and investors, and hired the core team (CEO, CTO). These companies now have a combined market cap of &gt;$200M USD and employ &gt;150 people.
        </div><br />
        <div>
          At the <LinkExternal href="//wef.org">World Economic Forum</LinkExternal>, I led research on the impact of emerging tech in financial services.
        </div>
        <div className="text-neutral-500 [font-variation-settings:'opsz'_14] dark:text-silver-dark">
          I interviewed 200+ industry leaders across the globe, and summarized my findings in reports that have been quoted / covered in the Wall Street Journal, Bloomberg, and numerous other publications.<br /><br />
          <LinkExternal href="https://www3.weforum.org/docs/WEF_Next_Gen_Data_Sharing_Financial_Services.pdf">The next generation of data sharing in financial services</LinkExternal><br />
          <LinkExternal href="https://www3.weforum.org/docs/WEF_Navigating_Uncharted_Waters_Report.pdf">Roadmap to responsible innovation with AI in financial services</LinkExternal>
        </div><br />
        <div>
          I started my career at Monitor Deloitte as a strategy consultant, where I spent most of my time exploring open banking.
        </div>
      </dd>
      </dl>
      <dl className="list-container">
      <dt className="list-title">
        <h3 className="text-neutral-500 dark:text-silver-dark">
          <div className="flex items-center gap-2">
            Impact
          </div>
        </h3>
      </dt>
      <dd className="list-content">
        <div>When COVID19 hit Canada, I co-founded <LinkExternal href="//getgroceryhero.com">GroceryHero</LinkExternal> to match frontline medical workers with a volunteer shoppers.</div>
        <div className="text-neutral-500 [font-variation-settings:'opsz'_14] dark:text-silver-dark">
          We made &gt;4K matches in 4 months, with over 70% of matches within 1KM of each other. We were endorsed by notable public figures (eg. mayor of Toronto, Ontario minister of health, deputy Prime Minister of Canada) and covered in major news networks (eg. National Post, CTV, CP24, Betakit, Global News).
        </div><br />
        <div>In college, I co-founded REACH Diagnostics, a diabetes screening and care platform for urban slum dwellers in India.</div>
        <div className="text-neutral-500 [font-variation-settings:'opsz'_14] dark:text-silver-dark">
          REACH was selected as one of the top 6 teams out of 11,000+ applicants globally to participate in an accelerator program in Boston. We screened over 4,500 individuals and impacted over 90,000 citizens in India through diagnosis, treatment, and awareness campaigns. We pitched to former president Bill Clinton, Nobel laureate Muhammad Yunu, and other esteemed social enterprise experts.
        </div>
      </dd>
    </dl>
      </Main>
    </>
  );
}
