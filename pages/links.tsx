import React from "react";
import { Main } from "../components/Layouts";
import { SEO } from "../components/SEO";
import Writing from "../components/Home/Writing";
import formatDate from "../lib/formatDate";
import { LinkExternal } from "../components/Links";
import Link from "next/link";
import { FeedIcon, NoteIcon } from "../components/Icons";

export default function Links() {
    return (
        <>
            <SEO
                seo={{
                    title: "Hemanth Soni - Links",
                    path: "/links",
                }}
            />
            <Main>
            <header><h1 className="text-xl text-neutral-800 [font-variation-settings:'opsz'_32,_'wght'_500] dark:text-white sm:pb-6 sm:text-xl">Links</h1></header>
                <dl className="list-container">
                    <dt className="list-title">
                        <h3 className="text-neutral-500 dark:text-silver-dark">Meet</h3>
                    </dt>
                    <dd className="list-content">
                        <div className="pb-2 last-of-type:pb-0">
                            <div>
                                <LinkExternal href="https://cal.com/hemaanth/meet-open">
                                    Calendar
                                </LinkExternal>
                                <time className="time">
                                    cal.com
                                </time><br />
                            </div>
                        </div>
                    </dd>
                    </dl>
                    <dl className="list-container">
                    <dt className="list-title">
                        <h3 className="text-neutral-500 dark:text-silver-dark">Contact</h3>
                    </dt>
                    <dd className="list-content">
                        <div className="pb-2 last-of-type:pb-0">
                            <div>
                                <LinkExternal href="https://twitter.com/hemaaanth">
                                    Twitter
                                </LinkExternal>
                                <time className="time">
                                    @hemaaanth
                                </time><br />
                            </div>
                            <div>
                                <LinkExternal href="https://t.me/hemaaanth">
                                    Telegram
                                </LinkExternal>
                                <time className="time">
                                    @hemaaanth
                                </time><br />
                            </div>
                            <div>
                                <LinkExternal href="https://warpcast.com/hemaaanth">
                                    Farcaster
                                </LinkExternal>
                                <time className="time">
                                    @hemaaanth
                                </time><br />
                            </div>
                            <div>
                                <LinkExternal href="https://www.linkedin.com/in/hemanthsoni/">
                                    LinkedIn
                                </LinkExternal>
                                <time className="time">
                                    @hemanthsoni
                                </time><br />
                            </div>
                            <div>
                                <LinkExternal href="mailto:hemanth@goldsky.com">
                                    Email
                                </LinkExternal>
                                <time className="time">
                                    hemanth@goldsky.com
                                </time><br />
                            </div>
                            <div>
                                <LinkExternal href="mailto:site@soni.im">
                                    Personal Email
                                </LinkExternal>
                                <time className="time">
                                    site@soni.im
                                </time>
                            </div>
                        </div>
                    </dd>
                    </dl>
                    <dl className="list-container">
                    <dt className="list-title">
                        <h3 className="text-neutral-500 dark:text-silver-dark">Goldsky</h3>
                    </dt>
                    <dd className="list-content">
                        <div className="pb-2 last-of-type:pb-0">
                            <div>
                                <LinkExternal href="https://goldsky.com?ref=hemanth">
                                    Company
                                </LinkExternal>
                                <time className="time">
                                    goldsky.com
                                </time><br />
                            </div>
                            <div>
                                <LinkExternal href="https://docs.goldsky.com?ref=hemanth">
                                    Documentation
                                </LinkExternal>
                                <time className="time">
                                    docs.goldsky.com
                                </time><br />
                            </div>
                            <div>
                                <LinkExternal href="https://crypto.clickhouse.com?ref=hemanth">
                                    Open Solana data
                                </LinkExternal>
                                <time className="time">
                                    CryptoHouse
                                </time><br />
                            </div>
                            <div>
                                <LinkExternal href="https://goldsky.com/products/turbo-pipelines?ref=hemanth">
                                    Solana Data Streams
                                </LinkExternal>
                                <time className="time">
                                    Turbo Pipelines
                                </time><br />
                            </div>
                            <div>
                                <LinkExternal href="https://indexed.xyz?ref=hemanth">
                                    Open EVM + Arweave data
                                </LinkExternal>
                                <time className="time">
                                    indexed.xyz
                                </time><br />
                            </div>
                            <div>
                                <LinkExternal href="https://erpc.cloud?ref=hemanth">
                                    RPC load-balancer and cache
                                </LinkExternal>
                                <time className="time">
                                    eRPC
                                </time>
                            </div>
                        </div>
                    </dd>
                </dl>
            </Main>
        </>
    );
}
