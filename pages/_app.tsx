import "../styles/globals.css";
import "../styles/hover-preview.css";
import '@liveblocks/react-ui/styles.css';
import '@liveblocks/react-ui/styles/dark/attributes.css';
import type { AppProps as NextAppProps } from "next/app";
import localFont from "next/font/local";
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { Router } from 'next/router'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { enableVisualEditing } from '@sanity/visual-editing'

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
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: '/aly',
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

  // Enable visual editing overlays (only active when in preview mode)
  useEffect(() => {
    // Skip on preview pages to avoid overlay blocking text selection/highlighting
    if (typeof window === 'undefined') return
    if (window.location.pathname.startsWith('/preview/')) return

    const disableVisualEditing = enableVisualEditing()
    return () => disableVisualEditing()
  }, [])

  // Add dark class to body for portaled Liveblocks components
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
          <Component {...pageProps} />
        </PostHogProvider>
    </>
  );
}
