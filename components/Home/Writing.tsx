import formatDate from "../../lib/formatDate";
import { LinkExternal } from "../Links";
import Link from "next/link";
import { FeedIcon, NoteIcon } from "../Icons";
import Badge from "../../components/Badge";

export default function Writing() {
  return (
    <dl className="list-container">
      <dt className="list-title">
        <h3 className="text-neutral-500 dark:text-silver-dark">Writing</h3>
      </dt>
      <dd className="list-content">
        <div className="pb-2 last-of-type:pb-0">
        <div>
            <Link href="#" className="opacity-20 dark:opacity-20 link inline-flex items-center gap-1">
              <div className="opacity-20 dark:opacity-30"><NoteIcon size={16} /></div>
              On launching a blockchain rollup <Badge>WIP</Badge>
            </Link>
          </div>
          <div>
            <Link href="#" className="opacity-20 dark:opacity-20 link inline-flex items-center gap-1">
              <div className="opacity-20 dark:opacity-30"><NoteIcon size={16} /></div>
              On pricing a PLG SaaS product <Badge>WIP</Badge>
            </Link>
          </div>
          <div>
            <Link href="#" className="opacity-20 dark:opacity-20 link inline-flex items-center gap-1">
              <div className="opacity-20 dark:opacity-30"><NoteIcon size={16} /></div>
              On opportunities to build a crypto business in 2023<Badge>WIP</Badge>
            </Link>
          </div>
          <div>
            <Link href="/on-the-future-of-pensions-in-canada" className="link inline-flex items-center gap-1">
              <div className="opacity-20 dark:opacity-30"><NoteIcon size={16} /></div>
              On the future of pensions in Canada
            </Link>
          </div>
          <div>
            <Link href="/on-uber-surge-pricing" className="link inline-flex items-center gap-1">
              <div className="opacity-20 dark:opacity-30"><NoteIcon size={16} /></div>
              On Uber&#39;s surge pricing
            </Link>
          </div>
        </div>
      </dd>
    </dl>
  );
}
