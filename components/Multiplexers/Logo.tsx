import type { CSSProperties } from 'react'

/**
 * Monochrome mark that follows the surrounding text colour. Logos are stored
 * as single-colour SVGs (public/images/multiplexers/<slug>.svg) and painted
 * through a CSS mask, so light/dark and hover states come for free.
 */
export function Logo({ slug, name, size = 20, className = '' }: { slug: string; name: string; size?: number; className?: string }) {
  const url = `url(/images/multiplexers/${slug}.svg)`
  const style: CSSProperties = {
    width: size,
    height: size,
    WebkitMaskImage: url,
    maskImage: url,
    WebkitMaskSize: 'contain',
    maskSize: 'contain',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
  }
  return <span role="img" aria-label={name} className={`inline-block shrink-0 bg-current ${className}`} style={style} />
}

export default Logo
