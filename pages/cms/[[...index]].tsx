import Head from 'next/head'
import { NextStudio } from 'next-sanity/studio'
import config from '../../sanity.config'

export default function StudioPage() {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
        <title>Sanity Studio</title>
      </Head>
      <NextStudio config={config} />
    </>
  )
}

