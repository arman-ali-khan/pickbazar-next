'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import NProgress from 'nprogress'

export default function ProgressBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    NProgress.done()
  }, [pathname, searchParams])

  useEffect(() => {
    // This is a workaround to trigger NProgress on route changes in Next.js App Router.
    // It monkey-patches the history API to call NProgress.start() on pushState and replaceState.
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    const handleStateChange = () => {
      NProgress.start()
    }
    
    history.pushState = function(...args) {
      handleStateChange()
      return originalPushState.apply(history, args)
    }

    history.replaceState = function(...args) {
      handleStateChange()
      return originalReplaceState.apply(history, args)
    }
    
    const handlePopState = () => {
      handleStateChange()
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      // Restore original functions on unmount
      history.pushState = originalPushState
      history.replaceState = originalReplaceState
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  return null
}
