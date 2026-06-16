import { PortableText as SanityPortableText } from '@portabletext/react'
import type { PortableTextBlock, PortableTextMarkDefinition } from '@portabletext/types'
import { LinkExternal } from '../Links'
import { HoverNote } from '../HoverNote'
import { TextDiagram } from '../TextDiagram'
import { Chart } from '../Chart'
import { ChartControls } from '../ChartControls'
import { parseJsonArray } from '../Chart/controls'
import type { ChartButtonDef } from '../Chart/types'
import { urlFor } from '../../lib/sanity'

interface PortableTextProps {
  content: PortableTextBlock[]
}

// Custom block renderer for Aside (grayed out text)
const AsideBlock = ({ value }: { value: any }) => {
  if (!value.content) return null
  
  return (
    <div className="aside-block [&_*]:!text-neutral-500 dark:[&_*]:!text-silver-dark">
      <SanityPortableText value={value.content} components={defaultComponents} />
    </div>
  )
}

// Custom block renderer for Note (bordered box)
const NoteBlock = ({ value }: { value: any }) => {
  if (!value.content) return null
  
  return (
    <div className="note-block my-6">
      <SanityPortableText value={value.content} components={defaultComponents} />
    </div>
  )
}

// Custom block renderer for Text Diagram
const TextDiagramBlock = ({ value }: { value: any }) => {
  if (!value.content) return null
  
  return (
    <TextDiagram 
      content={value.content} 
      caption={value.caption}
      captionPosition={value.captionPosition}
      minWidth={value.minWidth}
    />
  )
}

// Custom block renderer for Table
const TableBlock = ({ value }: { value: any }) => {
  if (!value.rows || !Array.isArray(value.rows) || value.rows.length === 0) return null
  
  return (
    <div className="my-6 overflow-x-auto">
      <table className="min-w-full border-collapse border border-neutral-300 dark:border-neutral-700">
        <tbody>
          {value.rows.map((row: any, rowIndex: number) => {
            const cells = row.cells || row // Support both new format (row.cells) and old format (row is array)
            const cellArray = Array.isArray(cells) ? cells : []
            
            return (
              <tr key={rowIndex} className={rowIndex === 0 ? 'bg-neutral-100 dark:bg-neutral-800' : ''}>
                {cellArray.map((cell: any, cellIndex: number) => {
                  const Tag = cell.isHeader || rowIndex === 0 ? 'th' : 'td'
                  return (
                    <Tag
                      key={cellIndex}
                      className={`border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-left ${
                        cell.isHeader || rowIndex === 0
                          ? 'font-medium bg-neutral-100 dark:bg-neutral-800'
                          : ''
                      }`}
                    >
                      {cell.content ? (
                        <SanityPortableText value={cell.content} components={defaultComponents} />
                      ) : (
                        ''
                      )}
                    </Tag>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// Chart block: server-rendered (incl. the SSR data table); the interactive SVG
// is client-only inside it.
const ChartBlock = ({ value }: { value: any }) => {
  if (!value?.config) return null
  return (
    <Chart
      config={value.config}
      title={value.title}
      subtitle={value.subtitle}
      caption={value.caption}
      altText={value.altText}
      variant={value.variant}
      width={value.width}
      aspectRatio={value.aspectRatio}
      frame={value.frame}
      id={value.id}
    />
  )
}

// Map the CMS button shape (label, mode, targetIds[], actions JSON) onto the
// ChartButtonDef the controls expect: one target → chartId, many → targets[].
function toButtonDefs(buttons: any): ChartButtonDef[] {
  if (!Array.isArray(buttons)) return []
  return buttons
    .filter((b) => b && b.label)
    .map((b) => {
      const actions = parseJsonArray<any>(b.actions)
      const ids: string[] = Array.isArray(b.targetIds)
        ? b.targetIds.filter(Boolean)
        : []
      const base = { label: b.label as string, mode: b.mode }
      return ids.length === 1
        ? { ...base, chartId: ids[0], actions }
        : { ...base, targets: ids.map((id) => ({ chartId: id, actions })) }
    })
}

// Standalone controls block. ChartControls is client-only (renders null on the
// server), so this is enhancement on top of the SSR chart + data table.
const ChartControlsBlock = ({ value }: { value: any }) => {
  const buttons = toButtonDefs(value?.buttons)
  if (!buttons.length) return null
  return <ChartControls buttons={buttons} />
}

// Custom block renderer for images uploaded via the CMS
const ImageBlock = ({ value }: { value: any }) => {
  if (!value?.asset) return null
  const src = urlFor(value).width(1600).fit('max').auto('format').url()
  return (
    <figure className="my-8">
      <img src={src} alt={value.alt || ''} loading="lazy" className="w-full h-auto" />
      {value.caption && (
        <figcaption className="text-sm text-neutral-500 dark:text-silver-dark text-left py-2">
          {value.caption}
        </figcaption>
      )}
    </figure>
  )
}

// Custom components for Portable Text
const defaultComponents = {
  types: {
    image: ImageBlock,
    aside: AsideBlock,
    note: NoteBlock,
    table: TableBlock,
    textDiagram: TextDiagramBlock,
    chart: ChartBlock,
    chartControls: ChartControlsBlock,
  },
  marks: {
    link: ({ value, children }: any) => {
      const href = value?.href || ''
      return (
        <a href={href} className="link" target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      )
    },
    linkExternal: ({ value, children }: any) => {
      const href = value?.href || ''
      return <LinkExternal href={href}>{children}</LinkExternal>
    },
    code: ({ children }: any) => <code>{children}</code>,
    strong: ({ children }: any) => <strong>{children}</strong>,
    em: ({ children }: any) => <em>{children}</em>,
  },
  block: {
    h1: ({ children, value }: any) => {
      const id = childrenToString(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '')
      return <h1 id={id} data-block-key={value._key}>{children}</h1>
    },
    h2: ({ children, value }: any) => {
      const id = childrenToString(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '')
      return <h2 id={id} data-block-key={value._key}>{children}</h2>
    },
    h3: ({ children, value }: any) => {
      const id = childrenToString(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '')
      return <h3 id={id} data-block-key={value._key}>{children}</h3>
    },
    h4: ({ children, value }: any) => {
      const id = childrenToString(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '')
      return <h4 id={id} data-block-key={value._key}>{children}</h4>
    },
    h5: ({ children, value }: any) => {
      const id = childrenToString(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '')
      return <h5 id={id} data-block-key={value._key}>{children}</h5>
    },
    h6: ({ children, value }: any) => {
      const id = childrenToString(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '')
      return <h6 id={id} data-block-key={value._key}>{children}</h6>
    },
    normal: ({ children, value }: any) => <p data-block-key={value._key}>{children}</p>,
    blockquote: ({ children, value }: any) => (
      <blockquote className="border-l-4 border-neutral-300 dark:border-neutral-700 pl-4 italic text-neutral-600 dark:text-silver-dark my-6" data-block-key={value._key}>
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }: any) => <ul className="!list-disc !my-4 !space-y-2 !pl-6 list-outside">{children}</ul>,
    number: ({ children }: any) => <ol className="!list-decimal !my-4 !space-y-2 !pl-6 list-outside">{children}</ol>,
  },
  listItem: {
    bullet: ({ children }: any) => <li className="!ml-0">{children}</li>,
    number: ({ children }: any) => <li className="!ml-0">{children}</li>,
  },
}

function childrenToString(children: any): string {
  if (typeof children === 'string') return children
  if (Array.isArray(children)) {
    return children.map(child => childrenToString(child)).join('')
  }
  if (children?.props?.children) {
    return childrenToString(children.props.children)
  }
  return ''
}

export default function PortableText({ content }: PortableTextProps) {
  return <SanityPortableText value={content} components={defaultComponents} />
}

