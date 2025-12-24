import { NextPage } from 'next'
import Head from 'next/head'
import { useEffect } from 'react'
import { Studio } from 'sanity'
import config from '../../sanity.config'

const StudioPage: NextPage = () => {
  // Ensure full viewport for Studio
  useEffect(() => {
    document.documentElement.style.height = '100%'
    document.documentElement.style.overflow = 'hidden'
    document.body.style.height = '100%'
    document.body.style.margin = '0'
    document.body.style.padding = '0'
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.documentElement.style.height = ''
      document.documentElement.style.overflow = ''
      document.body.style.height = ''
      document.body.style.margin = ''
      document.body.style.padding = ''
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <>
      <Head>
        <title>CMS - Sanity Studio</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden'
      }}>
        <Studio config={config} />
      </div>
    </>
  )
}

export default StudioPage

