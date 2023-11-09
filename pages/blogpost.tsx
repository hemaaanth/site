import type { GetStaticProps, GetStaticPaths } from "next";
import { Main } from "../components/Layouts";
import { baseUrl, SEO } from "../components/SEO";
import { initializeApollo } from "../graphql/client";
import { QUERY_POST, QUERY_POST_SLUGS } from "../graphql/queries";
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
          title: "On Uber's surge pricing",
          description: "Description",
        }}
      />
      <Main>
        <div className="flex w-full flex-col justify-between sm:flex-row">
          <h1 className="text-xl text-neutral-800 [font-variation-settings:'opsz'_32,_'wght'_500] dark:text-white sm:pb-6 sm:text-xl">
            On Uber's surge pricing
          </h1>
          <button
            onClick={() => router.back()}
            className="text-neutral-700 sm:pb-6 sm:align-left"
          >
            Go Back
          </button>
        </div>
        <div className="list-title">
          <div className="flex flex-row items-center gap-2">
            <time className="time" dateTime="2021-08-20">
              {formatDate("2023-11-12", false)}
            </time>
          </div>
          <div className="prose-custom">
            <p>
              Uber received significant media coverage in the past few days as
              storms drew attention to their surge pricing model. Heated
              discussions around its merits & morality crowd the web; in terms
              of economic theory, the model makes perfect sense, but it makes
              people furious.
            </p>
            <blockquote>
              <p>
                We did more trips because of our approach, not fewer. We gave
                people more options to get around, and that is the whole
                frickin' goal.
              </p>
              Travis Kalanick
            </blockquote>
            <p>
              Uber charges more when the demand for their services increases.
              During rush hour, Uber's algorithm increases prices to incent
              drivers to get on the road, maximizing the number of rides
              completed (as well as Uber's profit). This makes sense, but what
              if the reason demand increased is a snowstorm? Prices have gone up
              more than 7x base fare under extreme scenarios. Kalanick says that
              increasing prices ensures that anyone who wants a ride and can pay
              for one will get one, and delivers on Uber's core value:
              reliability. Economic theory is on his side - when demand
              increases, prices need to increase to encourage an increase in
              supply until the market clears (and in a free market, this would
              also maximize Uber's profit). Technically, the flexible pricing
              mechanism means greater market efficiency.
            </p>
            <p>
              However, economic theory also points to the Big Tradeoff: there is
              a trade-off between efficiency and equality. And this is the core
              of the problem: Uber's pricing model targets efficiency over
              equality, and the surge fees price certain people out of the
              market. Tied with the fact that demand for taxi services
              correlatives positively to extreme weather changes, some see it as
              an example of price gouging (which is illegal in most states).
            </p>
            <p>
              This is where black and white turn to grey. The lack of a
              price-finding mechanism means the model could be considered
              gouging; in a real open market, the demand has the opportunity to
              bid, but this power is ceded to Uber's proprietary algorithm. The
              calculation is a black box, so we have no idea what's really going
              on, and for all we know it's not actually efficient. But on the
              flipsite, for price gouging to truly exist Uber needs to be a
              monopoly (or demand would switch to a competing product rather
              than pay the outrageous price). There's a variety of other options
              and Uber doesn't control the prices set by those alternatives.
              Even in times of extreme weather, it's unlikely that Uber is the
              only option available.
            </p>
            <p>
              Ultimately, Uber is a private company with no legal/moral
              responsibility to service people they don't want to service. They
              probably still want to do something to address the negative
              publicity, especially as they simultaneously face increased
              regulatory scrutiny and backlash from traditional cab companies.
              For me as a user, Uber has been cheaper, more convenient, and an
              overall better experience. The economics for drivers isn't yet
              proven but at a glance it looks like most stakeholders (except for
              traditional cab companies) are better off with Uber around.
            </p>
            <p>
              If I was in charge of Uber's response to this backlash, I'd do two
              things:
            </p>
            <ul>
              <li>Increase transparency on the algorithm</li>
              <li>
                Take Uber's commission off the base price, not the surge price
              </li>
            </ul>
            <p>This would have three key benefits:</p>
            <ul>
              <li>
                Uber wouldn't be seen as profiting off natural disasters and
                other emergencies. Combined with better communication in-app and
                outside of it generally, this would help sway users in favour of
                Uber and a dynamic pricing model.
              </li>
              <li>
                End-user prices would be lower. For example, a $20 ride at clearing price
                (eg. 2x surge) would be $40, and Uber's commission would be $10.
                Taking only the base fee of $5 means the clearing price would be
                $35. Driver income would be unchanged and rider surge would be
                1.75x insted of 2x.
              </li>
              <li>
                This would still maximize Uber's ability to deliver on their
                core value of reliability. The slighly lower income is well
                worth the cost of the negative press, damage control response,
                etc.
              </li>
            </ul>
            <p>
              Overall, I think variable demand-based pricing is a great idea and
              one that we should see more often, as long as the right checks and
              balances are in place to comfort users.
            </p>
          </div>
        </div>
      </Main>
    </>
  );
}
