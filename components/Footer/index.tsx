import Link from "next/link";
import { LinkExternal } from "../Links";
import { GithubIcon } from "../Icons";

export default function Footer() {
  return (
    <footer className="m:px-0 flex w-full justify-center pt-10 sm:pt-20">
      <div className="max-w-main flex-1">
        <div className="flex h-full w-full items-end justify-between border-t border-solid border-neutral-500/10 pt-8 dark:border-neutral-900">
          <div className="flex-1">
            <ul className="flex gap-4 pb-6">
            <li>
              <Link href="/" className="link-fade">
                Home
              </Link>
              </li>
              <li>
              <Link href="/about" className="link-fade">
                About
              </Link>
              </li>
              <li>
              <Link href="/posts" className="link-fade">
                Posts
              </Link>
              </li>
              <li>
              <Link href="/studio" className="link-fade">
                Studio
              </Link>
              </li>
              <li>
              <Link href="/places" className="link-fade">
                Places
              </Link>
              </li>
              <li>
              <Link href="/links" className="link-fade">
                Links
              </Link>
              </li>
              <li>
              <Link href="/colophon" className="link-fade">
                Colophon
              </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
