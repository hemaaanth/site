import "../styles/globals.css";
import "highcharts/css/highcharts.css";
import "../styles/highcharts.css";
import "../styles/hover-preview.css";
import "../styles/multiplexers.css";
import 'mapbox-gl/dist/mapbox-gl.css';
import type { AppProps as NextAppProps } from "next/app";
import localFont from "next/font/local";
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { Router } from 'next/router'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { enableVisualEditing } from '@sanity/visual-editing'
import dynamic from 'next/dynamic'
import { GlobeProvider, useGlobe } from '../components/Globe/context'

const Globe = dynamic(() => import('../components/Globe'), { ssr: false })

const sansFont = localFont({
  src: "../public/inter.roman.var.woff2",
  weight: "100 900",
  display: "swap",
});

type AppProps<P = any> = {
  pageProps: P;
} & Omit<NextAppProps<P>, "pageProps">;

export default function MyApp({
  Component,
  pageProps,
}: AppProps) {
  const router = useRouter()

  useEffect(() => {
    // Keep Studio and its embedded draft preview out of analytics.
    const isPrivate = /^\/cms(\/|$)/.test(window.location.pathname) || window.self !== window.top
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY && !isPrivate) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: 'https://p.hem.so',
        ui_host: 'https://us.posthog.com',
        person_profiles: 'always',
        loaded: (posthog) => {
          if (process.env.NODE_ENV === 'development') posthog.debug()
        }
      })

      const handleRouteChange = () => posthog?.capture('$pageview')

      Router.events.on('routeChangeComplete', handleRouteChange);

      return () => {
        Router.events.off('routeChangeComplete', handleRouteChange);
      }
    }
  }, [])

  // Enable visual editing overlays, only inside Sanity's Presentation tool
  useEffect(() => {
    if (typeof window === 'undefined') return
    // Presentation loads the site in an iframe or a popup. Elsewhere the
    // overlay only watches and rescans every DOM change, which is costly.
    if (window.self === window.top && !window.opener) return

    const disableVisualEditing = enableVisualEditing()
    return () => disableVisualEditing()
  }, [])

  // Keep the chart theme in sync with the system theme
  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const updateDarkClass = () => {
      document.body.classList.toggle('dark', mediaQuery.matches)
    }

    updateDarkClass()
    mediaQuery.addEventListener('change', updateDarkClass)
    return () => mediaQuery.removeEventListener('change', updateDarkClass)
  }, [])
  
  const isPlacesPage = router.asPath.startsWith('/places');

  return (
    <>
        <style jsx global>
          {`
            :root {
              --sans-font: ${sansFont.style.fontFamily};
            }
          `}
        </style>
        <PostHogProvider client={posthog}>
          <GlobeProvider>
            {isPlacesPage && <PersistentGlobe />}
            <Component {...pageProps} />
          </GlobeProvider>
        </PostHogProvider>
    </>
  );
}

function PersistentGlobe() {
  const {
    targetCoordinates,
    venues,
    areas,
    cityCoordinates,
    onCityReady,
    pinnedAreaKey,
    focusArea,
  } = useGlobe();
  return (
    <Globe
      targetCoordinates={targetCoordinates}
      venues={venues}
      areas={areas}
      cityCoordinates={cityCoordinates}
      onCityReady={onCityReady}
      pinnedAreaKey={pinnedAreaKey}
      onAreaFocus={focusArea}
    />
  );
}
