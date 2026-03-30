import formatDate from "../../lib/formatDate";
import { LinkExternal } from "../Links";
import Link from "next/link";
import { FeedIcon, NoteIcon } from "../Icons";
import Badge from "../../components/Badge";

export default function Writing({ posts }) {
  return (
    <section className="list-container border-0" aria-label="Writing">
      <div className="list-title">
        <h2 className="text-neutral-500 dark:text-silver-dark text-base [font-variation-settings:'wght'_400]">Writing</h2>
      </div>
      <div className="list-content">
        {posts.map((post) => (
          <div key={post.slug} className={`pb-2 last-of-type:pb-0 ${post.status === 'draft' ? 'opacity-30 dark:opacity-30' : ''}`}>
            {post.status === 'draft' ? (
              // For drafts, display the title without a link and with the "WIP" badge
              <div className="inline-flex items-center gap-1">
                <div className="opacity-30 dark:opacity-30">
                  <NoteIcon size={16} />
                </div>
                {post.title}<Badge>WIP</Badge>
              </div>
            ) : (
              // For published posts, display the link and without the "WIP" badge
              <Link href={`/posts/${post.slug}`} className="link inline-flex items-center gap-1">
                <div className="opacity-30 dark:opacity-30">
                  <NoteIcon size={16} />
                </div>
                {post.title}
              </Link>
            )}
          </div>
        ))}
                <div className="mt-2 flex items-center gap-3">
          <Link href="/posts" className="link link-sm inline-flex items-center">
            View all
          </Link>
        </div>
      </div>
    </section>
  );
}