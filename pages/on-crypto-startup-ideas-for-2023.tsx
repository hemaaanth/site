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
import { LinkExternal } from "../components/Links";

export default function BlogPost() {
  const router = useRouter();

  return (
    <>
      <SEO
        seo={{
          title: "On crypto startup ideas for 2023",
          description:
            "Until recently, I worked at a venture studio where my job was to build new businesses from scratch. Here I outline the 3 ideas I would have spent my time working on if I'd continued in that role.",
          path: "/on-crypto-startup-ideas-for-2023",
        }}
      />
      <Main>
        <div className="flex w-full flex-col justify-between sm:flex-row">
          <h1 className="text-xl text-neutral-800 [font-variation-settings:'opsz'_32,_'wght'_500] dark:text-white sm:pb-6 sm:text-xl">
            On crypto startup ideas for 2023
          </h1>
          <p
            onClick={() => router.back()}
            className="text-neutral-700 sm:pb-6 sm:align-left cursor-pointer"
          >
            Go Back
          </p>
        </div>
        <dl className="list-container">
          <dd className="list-content">
            <div className="prose-custom">
              <p>Today is my last day at <LinkExternal href="https://diagram.ca">Diagram</LinkExternal>, a venture studio that builds business from scratch. I made the jump into a growth role at an incredibly exciting company (<LinkExternal href="https://goldsky.com">Goldsky</LinkExternal>) that I couldn&#39;t pass up, but there were a number of high-excitement areas in crypto that I was convinced would be the beginning of the next company I launch out of Diagram. As a form of closure, I&#39;m sharing them publicly with the hope that someone might pick them up one day, whether inside of Diagram or elsewhere.</p>
              <h4>Category #1: Verticalized wallets</h4>
              <p>Practically every wallet &quot;comes from the same planet&quot;. They have a send/receive button, show you a list of your assets, let you sign transactions, etc. Some wallets are improving incrementally on this with transaction simulation, nice animations, and support for NFT metadata. Those are all nice improvements, but I think there&#39;s a bigger opportunity to fundamentally rethink the role wallets play in the space.</p>
              <p>The way different people use crypto is radically unique: Some are token-focused traders, others are operating entire businesses (with employees, payroll, corporate expenses), and yet others are primarily - niche example - collecting music NFTs. The primarily interface they need to navigate their version of crypto should similarly be unique and offer vertical-specific functionality to better enable them.</p>
              <p>There were 2 specific &quot;niches&quot; that I would start the exploration from:</p>
              <ul>
                <li>Media-focused wallets (Metamask x iPod)</li>
                <li>B2B-focused wallets (Fireblocks x Ramp x Carta)</li>
              </ul>
              <h4>Category #2: Block explorers 2.0</h4>
              <p>The genesis for this was learning that Etherscan charges projects somewhere between $1-2M per year, and felt like a product that remained fundamentally unchanged for years. It&#39;s a great place to understand what is happening on chain - only if you&#39;re a decently savvy crypto user already, AND have a pretty specific piece of information you&#39;re looking for. But even there, Etherscan falls short, and other block explorers are even further behind. NFTs are clearly an afterthought in the design, yet represent a very meaningful piece of the industry. Data is generally thought to be trustworthy, but with enough use I&#39;ve run into enough missing transactions, logs, and other quality issues that make me wary. I can see what is happening but not engage with it in any meaningful way, at least not in a shape that&#39;s user-friendly or useful. And all of this ignores that practically every block explorer is chain-specific while activity is increasingly cross-chain.</p>
              <p>All of this - similar to the point above - begs the question: what does a block explorer not constrained by the v1 design space look like? Would the homepage just be a list of transactions, or more meaningful aggregations of activity? Would low-level data like logs, traces, transactions, and blocks just be presented as-is, or would they be packaged into easy-to-consume messages about what is happening? Would they be read-only interfaces for on-chain data only, owr write/execution layers and factor in off-chain context? As a starting point, there were again two specific areas I was excited about:</p>
              <ul>
                <li>Social block explorers</li>
                <li>&quot;Omni-chain&quot; block explorers</li>
              </ul>
              <h4>Category #3: Non-financialized consumer apps</h4>
              <p>This might be a hard sell but stick with me.</p>
              <p>The vast majority of crypto activity is incentivized financially. Whether it&#39;s direct arbitrage, expectations of future asset appreciation, or activity in anticipation of an award (ie. airdrop hunting), I&#39;d bet 90%+ of activity in the space is conducted in anticipation of profit, if not 95%+ or 99%+.</p>
              <p>So given that, why would focusing on consumer apps without this mechanism be exciting, especially in a broader VC funding context that is very anti-consumer-app-focused? Because the music has to stop one day on the &quot;incentivized activity&quot; game, and that will wash out all of these operations that aren&#39;t driving genuine interaction between real human beings who are there for some genuine value. I don&#39;t know when that would happen but it will, so might as well build for the audience that&#39;s going to be around after it happens, even if it&#39;s not the most fun category right now.</p>
              <p>There were two specific areas I was excited to explore:</p>
              <ul>
                <li>Private P2P messaging apps</li>
                <li>Genuine, non-P2E gaming</li>
              </ul>
              <hr />
              <p>If you&#39;re curious to hear more about any of these, don&#39;t hesitate to reach out!</p>
            </div>
          </dd>
          <dt className="list-title">
            <h3>Date</h3>
            <p>
              <time className="time" dateTime="2023-02-01">
                {formatDate("2023-02-01", false)}
              </time>
            </p>
            <h3>Tl;dr</h3>
            <p className="time">
            Until recently, I worked at a venture studio where my job was to build new crypto businesses from scratch. Here, I outline the 3 themes I would have spent my time working on if I&#39;d continued in that role.
            </p>
            <h3>Meta</h3>
            <p className="time">
              I had light research for this done prior to leaving Diagram so this might be a one-off, but if there&#39;s enough positive feedback, might do one every year.
            </p>
          </dt>
        </dl>
      </Main>
    </>
  );
}
