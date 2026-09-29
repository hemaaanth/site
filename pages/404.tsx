import Link from "next/link";

import { Main } from "../components/Layouts";
import { SEO } from "../components/SEO";

export default function NotFound() {
  return (
    <>
      <SEO
        seo={{
          title: "404 — Hemanth Soni",
          path: "/404",
          noindex: true,
        }}
      />
      <Main>
        <header>
          <h1 className="text-xl text-neutral-800 [font-variation-settings:'opsz'_32,_'wght'_500] dark:text-white">
            404
          </h1>
        </header>
        <p className="mt-8 sm:mt-10">
          Nothing found here. Go to the{" "}
          <Link href="/" className="link whitespace-nowrap">
            home page
          </Link>
          .
        </p>
      </Main>
    </>
  );
}
