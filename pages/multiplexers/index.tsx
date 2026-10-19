import type { GetStaticProps } from 'next'
import { PostShell, headerSlug } from '../../components/PostShell'
import { baseUrl, SEO } from '../../components/SEO'
import { ExplorerControls, ExplorerQuadrant, ExplorerTable, useExplorer } from '../../components/Multiplexers'
import { LongTail } from '../../components/Multiplexers/LongTail'
import { Notable } from '../../components/Multiplexers/Notable'
import { loadLongTail, loadTools } from '../../lib/multiplexersData'
import type { LongTailTool } from '../../lib/multiplexersData'
import type { Tool } from '../../lib/multiplexers'

const TITLE = 'The code multiplexer universe'
const PATH = '/multiplexers'

const HEADERS = [
  { text: 'The universe', depth: 1 },
  { text: 'Notable names', depth: 1 },
  { text: 'Detail table', depth: 1 },
  { text: 'The long tail', depth: 1 },
  { text: 'Methodology', depth: 1 },
]

function H2({ children }: { children: string }) {
  return <h2 id={headerSlug(children)}>{children}</h2>
}

interface PageProps {
  tools: Tool[]
  longTail: LongTailTool[]
  date: string
  asOf: string
}

export default function Multiplexers({ tools, longTail, date, asOf }: PageProps) {
  const ex = useExplorer(tools)
  const tldr = 'A living comparison of tools for running many coding agents at once. Weight what matters to you and the map re-ranks.'

  return (
    <>
      <SEO
        seo={{
          title: TITLE,
          description: tldr,
          path: PATH,
          // Static copy of /api/og?title=...&field=multiplexers. Live, that render takes
          // ~15s on the edge and link scrapers (Telegram, X) give up. Re-save it if the map moves.
          image: `${baseUrl}/images/multiplexers/og.png`,
          article: { datePublished: date },
        }}
      />
      <PostShell
        title={TITLE}
        date={asOf}
        path={PATH}
        headers={HEADERS}
        metadataLabel=""
        sidebarRight={false}
        backHref="/"
        backLabel="← Home"
      >
        <div className="prose-custom mx-prose">
          <p>
            A code multiplexer is an app that helps start, watch, and steer multiple agent sessions at once. This has quickly become an incredibly frothy category,
            with hundreds if not thousands of options emerging in the past six months. And they all make different choices: where they run, which agents they run,
            how they work with multiple users, and a lot more.
          </p>
          <p data-pp="pp_mvewmktql6z1">
            This page is an attempt to keep the whole field in one place. I built a harness to run every tool through a 45-step agentic evaluation, and add in
            my own notes for the tools I’ve used on top. Key features such as mobile support, sandboxing capabilities, and more are checked by running the
            multiplexers in a sandbox, and confirming against the code if available.
          </p>

          <H2>The universe</H2>
          <p data-pp="pp_mvewpm0x3qeq">
            The right multiplexer is a deeply personal choice. There’s no attempt here to define a universal winner, but rather find the one that matches your
            requirements. You can do this manually by expanding the filtering options below, or you can type what you’re looking for and the filters will
            automatically adapt to match those preferences.
          </p>
          <p data-pp="pp_mvex21edy6z5">
            Every tool that passes your requirements is placed by two things. Horizontal is <em>product quality</em>: polish, depth and feel. Vertical is{' '}
            <em>standing</em>: how widely it’s used and how fast it ships. Usually, top right is the recommendation for the most part, unless you dig into the
            details for some specific reason to use another tool based on your specific need. My suggestion is to use the filters to get yourself down to a
            maximum of 4-5 options even visible on the screen, and then try them all. The camera copies a picture of the map, with your settings on it, to the
            clipboard if you’d like to share it with your team or publicly anywhere.
          </p>
        </div>

        <ExplorerControls ex={ex} total={tools.length} />

        <ExplorerQuadrant ex={ex} total={tools.length} date={asOf} />

        <div className="prose-custom mx-prose">
          <H2>Notable names</H2>
          <p data-pp="pp_mvewqlilgd3q">Below, I’ve written out a few notes for some specifically interesting options.</p>
        </div>

        <Notable tools={tools} onOpen={ex.select} />

        <div className="prose-custom mx-prose">
          <H2>Detail table</H2>
          <p data-pp="pp_mvewwi1u5tgn">
            Click a row to see why it scored the way it did, with the numbers behind the score and the full checklist of what an agent found for its features and limitations. The glyphs on the right summarize the platforms, where agents run, and openness (lit means yes, half means partial, faint means no). Hover any glyph or chip
            for the details - an ‘amber’ dot means there’s some sort of caveat. And a quote mark by a name means I’ve used it and left a note. Press “Compare” on up to four tools and they line up side by side above the table.
          </p>
        </div>

        <ExplorerTable ex={ex} tools={tools} />

        <div className="prose-custom mx-prose">
          <H2>The long tail</H2>
          <p data-pp="pp_mvewzf74zbkv">
            Despite how big and busy that chart above is, it’s nowhere NEAR the full list of what my research turned up, or even tools that I’ve personally
            used. Below is the full list of an additional {longTail.length} tools, {longTail.filter((t) => t.status === 'dead').length} of which are now
            defunct. They’re just indexed with a name and a link, but they’re not scored, yet. If you’d like me to run the full agent run on it, press +1 on one
            to vote for a full scan. And if one is missing, click the ‘Suggest a tool’ button to open an issue on GitHub for it.
          </p>
        </div>

        <LongTail tools={longTail} />

        <div className="prose-custom mx-prose">
          <H2>Methodology</H2>
          <p data-pp="pp_mvewzmzk3axe">An agent swarm running in a Daytona sandbox is dispatched against an app domain to collect metadata and score the app on five dimensions.</p>
          <p>
            Reach is how widely the tool is used: dominant, major, established, emerging or niche. Quantitative data incl. GitHub stars, X followers, and social
            media mentions are taken into account, but so are qualitative measures such as the sentiment of those mentions.
          </p>
          <p data-pp="pp_mvex0pfxuy2l">
            Pace is how fast it ships, from relentless / continuous to dormant. This is based on all the various signals for Pace possible, including changelogs,
            announcements on social media for new features, and actual code on GitHub.
          </p>
          <p data-pp="pp_mvex1cc8ft05">
            Polish, depth and feel are the three editorial calls, each with a written rationale in every detail view. Polish is how finished the product is. Depth
            is how far it goes beyond a single agent TUI. Feel is how fast the interface itself is: whether switching sessions and scrolling terminals is instant
            or sticky, which tends to track whether it’s a native app or a web view in a frame. All three of these are qualitatively assessed incl. with human
            input (from just me for now) as well as the agents’ own hands-on runs. The overall is the weighted mean of the five, and Fine-tune sets
            how much each one counts.
          </p>
          <p>
            Many factors, such as which platforms it runs on to which agents it drives, are binary yes/no questions. Those can also be filtered manually or via the
            checkbox, and don’t move the scoring.
          </p>
        </div>
      </PostShell>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const tools = loadTools()
  const dates = tools.flatMap((t) => [t.research.lastFullRefresh, t.research.lastMetricsRefresh]).filter(Boolean) as string[]
  const asOf = dates.length ? dates.sort().at(-1)!.slice(0, 10) : 'unknown'
  const first = dates.length ? dates.sort()[0].slice(0, 10) : asOf
  return { props: { tools, longTail: loadLongTail().tools, date: first, asOf } }
}
