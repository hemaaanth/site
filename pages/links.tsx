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
            <h1 className="text-xl text-neutral-800 [font-variation-settings:'opsz'_32,_'wght'_500] dark:text-white sm:pb-6 sm:text-xl">Links</h1>
                <dl className="list-container">
                    <dt className="list-title">
                        <h3 className="text-neutral-500 dark:text-silver-dark">Meet</h3>
                    </dt>
                    <dd className="list-content">
                        <div className="pb-2 last-of-type:pb-0">
                            <div>
                                <LinkExternal href="#">
                                    Calendar
                                </LinkExternal>
                                <time className="time">
                                    cal.com
                                </time><br />
                            </div>
                        </div>
                    </dd>
                    <dt className="list-title">
                        <h3 className="text-neutral-500 dark:text-silver-dark">Contact</h3>
                    </dt>
                    <dd className="list-content">
                        <div className="pb-2 last-of-type:pb-0">
                            <div>
                                <LinkExternal href="#">
                                    Twitter
                                </LinkExternal>
                                <time className="time">
                                    @hemaaanth
                                </time><br />
                            </div>
                            <div>
                                <LinkExternal href="#">
                                    Telegram
                                </LinkExternal>
                                <time className="time">
                                    @hemaaanth
                                </time><br />
                            </div>
                            <div>
                                <LinkExternal href="#">
                                    Email
                                </LinkExternal>
                                <time className="time">
                                    hemanth@goldsky.com
                                </time><br />
                            </div>
                            <div>
                                <LinkExternal href="#">
                                    Personal Email
                                </LinkExternal>
                                <time className="time">
                                    site@soni.im
                                </time>
                            </div>
                        </div>
                    </dd>
                    <dt className="list-title">
                        <h3 className="text-neutral-500 dark:text-silver-dark">Goldsky</h3>
                    </dt>
                    <dd className="list-content">
                        <div className="pb-2 last-of-type:pb-0">
                            <div>
                                <LinkExternal href="#">
                                    Company
                                </LinkExternal>
                                <time className="time">
                                    goldsky.com
                                </time><br />
                            </div>
                            <div>
                                <LinkExternal href="#">
                                    Documentation
                                </LinkExternal>
                                <time className="time">
                                    docs.goldsky.com
                                </time><br />
                            </div>
                            <div>
                                <LinkExternal href="#">
                                    Open Datasets
                                </LinkExternal>
                                <time className="time">
                                    indexed.xyz
                                </time>
                            </div>
                        </div>
                    </dd>
                </dl>
            </Main>
        </>
    );
}
