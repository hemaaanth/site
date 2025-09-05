import React from "react";
import { Main } from "../components/Layouts";
import { SEO } from "../components/SEO";
import { LinkExternal } from "../components/Links";

export default function Meridian() {
    return (
        <>
            <SEO
                seo={{
                    title: "Stellar Meridian 2025: Building Your Data Stack",
                    path: "/meridian",
                    noindex: true,
                }}
            />
            <Main>
                <header><h1 className="text-xl text-neutral-800 [font-variation-settings:'opsz'_32,_'wght'_500] dark:text-white sm:pb-6 sm:text-xl">Stellar Meridian 2025: Building Your Data Stack</h1></header>
                <dl className="list-container">
                    <dt className="list-title">
                        <h3 className="text-neutral-500 dark:text-silver-dark">Stellar Data</h3>
                    </dt>
                    <dd className="list-content">
                        <div className="pb-2 last-of-type:pb-0">
                            <div>
                                <LinkExternal href="https://developers.stellar.org/docs/data/indexers/build-your-own/galexie">
                                    Galexie Docs
                                </LinkExternal>
                                <time className="time">
                                    developers.stellar.org
                                </time><br />
                            </div>
                            <div>
                                <LinkExternal href="https://developers.stellar.org/docs/data/indexers/build-your-own/processors/token-transfer-processor">
                                    Token Transfer Processor
                                </LinkExternal>
                                <time className="time">
                                    developers.stellar.org
                                </time><br />
                            </div>
                            <div>
                                <LinkExternal href="https://developers.stellar.org/docs/data/indexers/build-your-own/ingest-sdk/developer_guide/ledgerbackends">
                                    Ledger Backends
                                </LinkExternal>
                                <time className="time">
                                    developers.stellar.org
                                </time><br />
                            </div>
                            <div>
                                <LinkExternal href="https://github.com/tamirms/asset-indexer">
                                    Asset Indexer Codebase
                                </LinkExternal>
                                <time className="time">
                                    github.com
                                </time><br />
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
                                <LinkExternal href="https://docs.goldsky.com/chains/stellar">
                                    Realtime Stellar Indexing
                                </LinkExternal>
                                <time className="time">
                                    docs.goldsky.com
                                </time><br />
                            </div>
                            <div>
                                <LinkExternal href="https://docs.goldsky.com/reference/schema/non-EVM-schemas#stellar">
                                    Stellar Dataset Schemas
                                </LinkExternal>
                                <time className="time">
                                    docs.goldsky.com
                                </time><br />
                            </div>
                            <div>
                                <LinkExternal href="https://goldsky.com">
                                    Homepage
                                </LinkExternal>
                                <time className="time">
                                    goldsky.com
                                </time><br />
                            </div>
                            <div>
                                <LinkExternal href="https://x.com/goldskyio">
                                    X / Twitter
                                </LinkExternal>
                                <time className="time">
                                    x.com
                                </time><br />
                            </div>
                        </div>
                    </dd>
                </dl>
                <dl className="list-container">
                    <dt className="list-title">
                        <h3 className="text-neutral-500 dark:text-silver-dark">Tamir Sen</h3>
                    </dt>
                    <dd className="list-content">
                        <div className="pb-2 last-of-type:pb-0">
                            <div>
                                <LinkExternal href="#">
                                    LinkedIn
                                </LinkExternal>
                                <time className="time">
                                    @tamirsen
                                </time><br />
                            </div>
                            <div>
                                <LinkExternal href="#">
                                    X / Twitter
                                </LinkExternal>
                                <time className="time">
                                    @tamirsen
                                </time>
                            </div>
                        </div>
                    </dd>
                </dl>
                <dl className="list-container">
                    <dt className="list-title">
                        <h3 className="text-neutral-500 dark:text-silver-dark">Hemanth Soni</h3>
                    </dt>
                    <dd className="list-content">
                        <div className="pb-2 last-of-type:pb-0">
                            <div>
                                <LinkExternal href="https://www.linkedin.com/in/hemanthsoni/">
                                    LinkedIn
                                </LinkExternal>
                                <time className="time">
                                    @hemanthsoni
                                </time><br />
                            </div>
                            <div>
                                <LinkExternal href="https://twitter.com/hemaaanth">
                                    X / Twitter
                                </LinkExternal>
                                <time className="time">
                                    @hemaaanth
                                </time>
                            </div>
                        </div>
                    </dd>
                </dl>
            </Main>
        </>
    );
}
