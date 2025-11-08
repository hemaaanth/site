import "../styles/globals.css";
import "../styles/hover-preview.css";
import type { AppProps as NextAppProps } from "next/app";
import localFont from "next/font/local";
import { useEffect } from 'react'
import { Router } from 'next/router'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { VisualEditing } from '@sanity/visual-editing'

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
          {/* Visual editing overlays - automatically enabled when in preview mode */}
          <VisualEditing />
        </PostHogProvider>
    </>
  );
}
