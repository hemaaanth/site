import { Cloud, Globe, HardDrive, Laptop, Puzzle, Server, Terminal } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'
import { Tip } from './Tip'
import { featureLabel } from '../../lib/multiplexers'
import type { FeatureValue, Tool } from '../../lib/multiplexers'

type IconProps = { size?: number; className?: string }

/* Brand marks (Simple Icons paths, CC0) for the platforms lucide has no glyph for. */
function brand(path: string, label: string) {
  const Icon = ({ size = 14, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d={path} />
    </svg>
  )
  Icon.displayName = `${label}Icon`
  return Icon
}

const Apple = brand(
  'M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701',
  'macOS',
)
const Windows = brand('M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-13.051-1.8', 'Windows')
const Linux = brand(
  'M12.5 2C9.5 2 8 4.3 8 7.2c0 1.2.2 2.1.6 3-.9.8-2.3 2.5-2.8 4.6-.4 1.5-.2 2.7.2 3.4-.7.4-1.6 1-1.5 1.7.1.9 1.3 1.1 2.4 1.3.9.2 1.7.7 2.6.7.6 0 1-.3 1.3-.7h2.4c.3.4.7.7 1.3.7.9 0 1.7-.5 2.6-.7 1.1-.2 2.3-.4 2.4-1.3.1-.7-.8-1.3-1.5-1.7.4-.7.6-1.9.2-3.4-.5-2.1-1.9-3.8-2.8-4.6.4-.9.6-1.8.6-3C17 4.3 15.5 2 12.5 2zm-1.3 4c.5 0 .8.6.8 1.3s-.3 1.2-.8 1.2-.8-.6-.8-1.2.3-1.3.8-1.3zm2.6 0c.5 0 .8.6.8 1.3s-.3 1.2-.8 1.2-.8-.6-.8-1.2.3-1.3.8-1.3zm-1.3 3c.9 0 1.8.5 1.8.9s-.9 1.1-1.8 1.1-1.8-.7-1.8-1.1.9-.9 1.8-.9z',
  'Linux',
)
const Ios = brand(
  'M1.1 6.05C.486 6.05 0 6.53 0 7.13A1.08 1.08 0 0 0 1.1 8.21C1.72 8.21 2.21 7.73 2.21 7.13C2.21 6.53 1.72 6.05 1.1 6.05M8.71 6.07C5.35 6.07 3.25 8.36 3.25 12C3.25 15.67 5.35 17.95 8.71 17.95C12.05 17.95 14.16 15.67 14.16 12C14.16 8.36 12.05 6.07 8.71 6.07M19.55 6.07C17.05 6.07 15.27 7.45 15.27 9.5C15.27 11.13 16.28 12.15 18.4 12.64L19.89 13C21.34 13.33 21.93 13.81 21.93 14.64C21.93 15.6 20.96 16.28 19.58 16.28C18.17 16.28 17.11 15.59 17 14.53H15C15.08 16.65 16.82 17.95 19.46 17.95C22.25 17.95 24 16.58 24 14.4C24 12.69 23 11.72 20.68 11.19L19.35 10.89C17.94 10.55 17.36 10.1 17.36 9.34C17.36 8.38 18.24 7.74 19.54 7.74C20.85 7.74 21.75 8.39 21.85 9.46H23.81C23.76 7.44 22.09 6.07 19.55 6.07M8.71 7.82C10.75 7.82 12.06 9.45 12.06 12C12.06 14.57 10.75 16.2 8.71 16.2C6.65 16.2 5.35 14.57 5.35 12C5.35 9.45 6.65 7.82 8.71 7.82M.111 9.31V17.76H2.1V9.31H.11Z',
  'iOS',
)
const Android = brand(
  'M18.4395 5.5586c-.675 1.1664-1.352 2.3318-2.0274 3.498-.0366-.0155-.0742-.0286-.1113-.043-1.8249-.6957-3.484-.8-4.42-.787-1.8551.0185-3.3544.4643-4.2597.8203-.084-.1494-1.7526-3.021-2.0215-3.4864a1.1451 1.1451 0 0 0-.1406-.1914c-.3312-.364-.9054-.4859-1.379-.203-.475.282-.7136.9361-.3886 1.5019 1.9466 3.3696-.0966-.2158 1.9473 3.3593.0172.031-.4946.2642-1.3926 1.0177C2.8987 12.176.452 14.772 0 18.9902h24c-.119-1.1108-.3686-2.099-.7461-3.0683-.7438-1.9118-1.8435-3.2928-2.7402-4.1836a12.1048 12.1048 0 0 0-2.1309-1.6875c.6594-1.122 1.312-2.2559 1.9649-3.3848.2077-.3615.1886-.7956-.0079-1.1191a1.1001 1.1001 0 0 0-.8515-.5332c-.5225-.0536-.9392.3128-1.0488.5449zm-.0391 8.461c.3944.5926.324 1.3306-.1563 1.6503-.4799.3197-1.188.0985-1.582-.4941-.3944-.5927-.324-1.3307.1563-1.6504.4727-.315 1.1812-.1086 1.582.4941zM7.207 13.5273c.4803.3197.5506 1.0577.1563 1.6504-.394.5926-1.1038.8138-1.584.4941-.48-.3197-.5503-1.0577-.1563-1.6504.4008-.6021 1.1087-.8106 1.584-.4941z',
  'Android',
)
const OpenSource = brand(
  'M11.959.447A11.938 11.938 0 000 12.407c0 5.576 3.874 10.097 7.783 11.114.193.05.392-.05.467-.234l2.771-6.822a.396.396 0 00-.246-.528C9.365 15.47 8.53 14.32 8.48 12.4c-.024-1.828 1.5-3.45 3.561-3.447 1.931.003 3.479 1.632 3.479 3.453 0 .966-.203 1.687-.575 2.238-.371.552-.922.951-1.695 1.239a.396.396 0 00-.23.515l2.685 6.903a.396.396 0 00.465.24C20.163 22.534 24 18.062 24 12.406 24 5.804 18.603.447 11.959.447z',
  'Open source',
)

const lucide = (C: ComponentType<SVGProps<SVGSVGElement>>) => {
  const Icon = ({ size = 14, className }: IconProps) => <C width={size} height={size} className={className} strokeWidth={2} aria-hidden />
  Icon.displayName = 'LucideFeatureIcon'
  return Icon
}

/** Which features get a glyph, and which. Order is display order. */
export const ICONS: Record<string, ComponentType<IconProps>> = {
  'platforms.macos': Apple,
  'platforms.windows': Windows,
  'platforms.linux': Linux,
  'platforms.ios': Ios,
  'platforms.android': Android,
  'platforms.web': lucide(Globe),
  'platforms.cli': lucide(Terminal),
  'execution.local': lucide(Laptop),
  'execution.remoteOwn': lucide(Server),
  'execution.cloudManaged': lucide(Cloud),
  'openness.openSource': OpenSource,
  'openness.selfHostable': lucide(HardDrive),
  'openness.pluginSystem': lucide(Puzzle),
}

/** The three icon columns shown in the index. */
export const ICON_COLUMNS: { key: string; label: string; keys: string[] }[] = [
  { key: 'platforms', label: 'Platforms', keys: ['platforms.macos', 'platforms.windows', 'platforms.linux', 'platforms.ios', 'platforms.android', 'platforms.web', 'platforms.cli'] },
  { key: 'runs', label: 'Runs on', keys: ['execution.local', 'execution.remoteOwn', 'execution.cloudManaged'] },
  { key: 'open', label: 'Open', keys: ['openness.openSource', 'openness.selfHostable', 'openness.pluginSystem'] },
]

export function featureValue(tool: Tool, key: string): FeatureValue {
  const [cat, f] = key.split('.')
  return tool.features?.[cat]?.[f] ?? null
}

const STATE: Record<string, string> = { true: 'is-yes', partial: 'is-partial', false: 'is-no', null: 'is-unknown' }
const WORD: Record<string, string> = { true: 'yes', partial: 'partial', false: 'no', null: 'unknown' }

/** A row of glyphs, lit for yes, half for partial, faint for no or unknown. */
export function FeatureIconStrip({ tool, keys, size = 14 }: { tool: Tool; keys: string[]; size?: number }) {
  return (
    <span className="mx-icons">
      {keys.map((k) => {
        const Icon = ICONS[k]
        if (!Icon) return null
        const v = featureValue(tool, k)
        const note = tool.featureNotes?.[k]
        const title = `${featureLabel(k)}: ${WORD[String(v)]}`
        return (
          <Tip key={k} className={`mx-icon ${STATE[String(v)]}`} title={title} body={note} label={note ? `${title}. ${note}` : title}>
            <Icon size={size} />
          </Tip>
        )
      })}
    </span>
  )
}
