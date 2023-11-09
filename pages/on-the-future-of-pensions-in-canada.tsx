import type { GetStaticProps, GetStaticPaths } from "next";
import { Main } from "../components/Layouts";
import { baseUrl, SEO } from "../components/SEO";
import { useRouter } from "next/router";
import React from "react";
import Image from "next/image";
import Badge from "../components/Badge";
import { LinkShare } from "../components/Links";
import Link from "next/link";
import { serialize } from "next-mdx-remote/serialize";
import { MDXRemote } from "next-mdx-remote";
import { mdxComponents } from "../components/Prose";
import formatDate from "../lib/formatDate";

export default function BlogPost() {
  const router = useRouter();

  return (
    <>
      <SEO
        seo={{
          title: "On the future of pensions in Canada",
          description: "Description",
          path: "/on-the-future-of-pensions-in-canada",
        }}
      />
      <Main>
        <div className="flex w-full flex-col justify-between sm:flex-row">
          <h1 className="text-xl text-neutral-800 [font-variation-settings:'opsz'_32,_'wght'_500] dark:text-white sm:pb-6 sm:text-xl">
            On the future of pensions in Canada
          </h1>
          <button
            onClick={() => router.back()}
            className="text-neutral-700 sm:pb-6 sm:align-left"
          >
            Go Back
          </button>
        </div>
        <dl className="list-container">
          <dd className="list-content">
            <div className="prose-custom">
              <h4>
                Pensions as my parents knew them are dead. Not only do they not
                make sense for the next generation, they never made sense to
                begin with.
              </h4>
              <p>
                Pensions were negotiated without full consideration for the
                long-term liability they represent, creating unsustainable
                systems whereby new contributions only pay retiree income and
                are not actually saved for contributors&#39; own retirement, making
                the fundamental assumption that populations and economies will
                grow continuously and infinitely - an assumption that cannot be
                taken for granted. Private pensions are also unprotected,
                leaving pensioners holding the bag if/when things go wrong (eg.
                Sears, Nortel, Indalex, and more).
              </p>
              <p>
                These shortcomings are exacerbated by the changing environment:
                Increasing lifespans, a growing informal + self-employed sector,
                sustained low-rate environment, and shrinking populations all
                put pressure on this model.
              </p>
              <h4>This is a critical issue for Canada.</h4>
              <p>
                There is a $3T retirement gap as of 2015, which will balloon to
                $13T by 2050. 12M working Canadians have no workplace pension,
                and thus relay on private savings or Canada&#39;s social security
                benefit which totals ~$20K, enough to avoid poverty but not
                enough for a dignified quality-of-life. Less than 20% of
                Canadians have enough private savings to adequately supplement
                public coverage.
              </p>
              <p>
                This means that most Canadians risk late retirement, and/or
                insufficient income to last through retirement. It means that
                for the average Canadian,{" "}
                <em>
                  over 4 decades of full-time work is insufficient for peaceful,
                  dignified rest in their old age
                </em>
                .
              </p>
              <h4>
                Pensions for the next 50 years can be secured but will require
                novel solutions. In Canada&#39;s context, there is specifically an
                opportunity in government-managed reverse-mortgages.
              </h4>
              <p>
                Reverse-mortgages allow homeowners to exchange home equity for
                regular income while living in the property, and can mimic
                traditional pension cash-flows. Currently, they have complex
                structures and concerns have been raised that lenders take
                advantage of this, but a government-managed program could avoid
                such pitfalls.
              </p>
              <p>
                Consider the following “base case”: a retiree with a $500K home
                enters a reverse-mortgage at 5.49% and other conservative
                assumptions are held (eg. &lt;3% annual home appreciation vs.
                5.65% actual over the past 30 years). This would deliver $1,500
                monthly for 15 years, nearly matching the maximum benefit from
                public coverage while leaving over $100K in equity. In a highly
                conservative case where the home value doesn&#39;t increase at all,
                14 years of income could be sustained before equity is exhausted
                (ie. net value becomes negative).
              </p>
              <p>
                Almost $200K woudl be paid in interest which can create sticker
                shock, but it&#39;s important to remember the unique benefits:
              </p>
              <ul>
                <li>
                  Saved rent expense incurred otherwise by downsizing into a
                  rental or through a sale+leaseback.
                </li>
                <li>
                  Income isn&#39;t taxable, and thus doesn&#39;t reduce public pension
                  benefits eligibility.
                </li>
                <li>
                  Downside protection where if the home value decreases,
                  mortgagors never owe more than the fair value of their home.
                </li>
              </ul>
              <h4>
                A reverse-mortgage program allows retirees to maintain their
                retirement quality of life and still potentially pass on
                meaningful inheritances. To enable wide-spread
                reverse-mortgages, the government will need to play a role in
                managing the ecosystem, starting by redesigning the product.
              </h4>
              <p className="time">
                Note: I am not recommending specific policy, focusing instead on
                the high-level steps to achieving desired outcomes. “Canadian
                government” is used as a general term to include federal and
                provincial regulators/policymakers, including agencies such as
                OSFI.
              </p>
              <p>
                The Canadian government will need to support the development of
                new reverse-mortgage products engineered for the mass-market
                retiree in mind. This would include three key features:
              </p>
              <ul>
                <li>
                  Standardized terms that simplify the purchasing experience and
                  decrease up-front costs (eg. origination fees). This is
                  critical to reducing the barrier to entry.
                </li>
                <li>
                  Integration for end-of-life care that allows
                  reverse-mortgagors to vacate the premises while continuing to
                  receive payments (or sell the home early) to pay for
                  end-of-life care. This is critical to ensuring that the
                  product caters to the full lifecycle of retirees&#39;s needs.
                </li>
                <li>
                  Payments pegged to inflation that ensure mortgagors sustain
                  their quality of life in real terms. This is already possible
                  today [and in the full version of the essay, is modelled into
                  the illustrative cases.]
                </li>
              </ul>
              <p>
                Beyond these design elements, the government should drive two
                broader shifts:
              </p>
              <ul>
                <li>
                  Mutualize the insurance that mortgagees pay to cover the risk
                  of declines in property value. By aggregating coverage across
                  providers (eg. underwritten by a global reinsurer), the
                  government can drive economies of scale, leading to lower
                  interest rates.
                </li>
                <li>
                  Rebrand away from “reverse-mortgage” which may connote “giving
                  up” home equity. Instead, a “home equity pension” (HEP) or
                  similar branding would frame the product to what it really is:
                  a method of unlocking the value of a lifetime&#39;s worth of
                  investment in property.
                </li>
              </ul>
              <p>
                These initiatives enable HEPs that are more affordable,
                purpose-fit, and socially admissible.
              </p>
              <h4>
                The government will also need to open the market to a greater
                number of providers - specifically, Canada&#39;s largest banks.
              </h4>
              <p>
                These institutions have the expertise, balance sheet, and
                footprint needed to serve Canadians. For example, consider the
                T1 capital ratio of Canada&#39;s largest banks as of Q3 2019:
              </p>
              <ul>
                <li>RBC: 13.00%</li>
                <li>TD: 12.00%</li>
                <li>Scotiabank: 13.00%</li>
                <li>BMO: 11.70%</li>
                <li>CIBC: 12.70%</li>
              </ul>
              <p> The Basel III requirement is 10.50%.</p>
              <p>
                Today, these institutions do not offer HEPs due to their
                conservative nature and the strict governance frameworks they
                are subject to. By encouraging their participation (eg. allowing
                IRB calculations for HEPs), the government can foster greater
                competition in the market and enable seamless access (these
                banks already serve most Canadians, have them KYC&#39;d, etc.).
              </p>
              <h4>Such a program would not be without its downsides.</h4>
              <p>
                It is critical to note that this proposal is not perfect, with
                several limitations to consider:
              </p>
              <ul>
                <li>
                  Doesn&#39;t serve everyone: By 64, 80% of Canadians own their
                  primary residence (and this has increased over time),
                  indicating that reverse-mortgages can help many. However,
                  those who don&#39;t own a home and don&#39;t have other savings will
                  need to rely on the social safety net. The net of income
                  supplements combined with the country&#39;s universal healthcare
                  and public housing program offered by the CMHC can ensure
                  retirement even for those with limited resources.
                </li>
                <li>
                  Limits intergenerational transfers: A HEP usually terminates
                  with the sale of the home. This contravenes the social desire
                  to leave assets behind for descendants, but as explored in the
                  models above, a HEP can still leave cash behind while funding
                  the desired quality of retirement life. To mitigate this
                  further, the government should explore how HEPs may be
                  designed to be tax-neutral vs. property transfer, so that
                  retirees and their descendants are not disadvantaged for
                  unlocking the value of a home earlier.
                </li>
                <li>
                  Relies on increasing home prices: Presuming a growth in
                  housing prices introduces risk, as this may not always hold
                  true. However, even in a highly conservative case with 1.5%
                  growth while working and no growth in retirement, a HEP can
                  provide meaningful income for 10+ years.
                </li>
                <li>
                  Increases exposure to the housing market: The Canadian market
                  may become doubly exposed to housing (on regular mortgages and
                  on HEPs). With regular mortgages, this is offset by CMHC
                  insurance. For HEPs, a similar insurance program could be
                  instituted, underwritten by a global reinsurer rather than the
                  CMHC to spread the housing market risk.
                </li>
                <li>
                  Facilitates concentration of wealth over generations: Those
                  who rely on home equity to fund their retirement will deplete
                  the asset, while those with other savings will be able to
                  retain the asset and pass it on to their children who can
                  continue to capture its appreciation. It is unclear without
                  significant simulation and modelling whether the widespread
                  use of HEPs will exacerbate this beyond what would otherwise
                  be experienced, but this is worth flagging for further
                  investigation. For this essay, a detailed examination of this
                  risk was considered out of scope.
                </li>
              </ul>
              <h4>
                HEPs drive value for retirees, financial institutions, the
                government, and society; they can plausibly be negotiated for
                wide-spread use.
              </h4>
              <p>
                HEPs allow retirees to draw stable income and give descendants
                confidence that their parents are comfortable. They allow
                institutions to earn new revenue and acquire assets that have
                outpaced the S&amp;P500 for 20+ years. They allow the government
                to secure pensions without raising new funds (ie. increasing
                taxes). Most stakeholders (if not all) likely benefit from such
                a program, and thus negotiating it - with collaboration between
                the public and private sector - should be feasible. A starting
                point would be a series of roundtable discussions between banks
                and Canadian regulars to design principles for the new product,
                model the program in greater detail, and explore
                concerns/complications surrounding its deployment.
              </p>
              <h4>
                In conjunction with the expanded use of HEPs, three regulatory
                pillars should also be enacted to drive greater access and
                adoption of pension programs.
              </h4>
              <p>
                The Canadian pension system can benefit from other policy
                shifts. First, pensions should be made portable, with easy
                switching between employers/geographies, driving greater access.
                Second, all companies above a certain size should be federally
                required to provide pensions, further driving access and
                adoption. And finally, all pension programs should mandatorily
                be “opt-out” instead of “opt-in”, further driving adoption.
              </p>
              <h4>
                The expanded use of “home equity pensions” and a restructuring
                of related regulation can enable Canada to secure pensions for
                the next 50 years and beyond, driving accumulation during
                Canadians&#39; working years and graceful decumulation in
                retirement.
              </h4>
            </div>
          </dd>
          <dt className="list-title">
            <h3>Date</h3>
            <p>
              <time className="time" dateTime="2019-11-18">
                {formatDate("2019-11-18", false)}
              </time>
            </p>
            <h3>Tl;dr</h3>
            <p className="time">
              There is a huge and growing pension gap in Canada, and this paper
              explores a novel approach, reverse mortgages, to defuse the
              ticking time bomb.
            </p>
            <h3>Meta</h3>
            <p className="time">
              I wrote this originally for a challenge run by Credit Suisse&#39;s
              research institute, and received an honorary mention (top 20 of
              170+ submissions from 30 countries). Because of this, there&#39;s a
              more formal tone to this than most of my other writing.
            </p>
          </dt>
        </dl>
      </Main>
    </>
  );
}
