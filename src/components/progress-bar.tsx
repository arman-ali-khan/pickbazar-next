'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import NProgress from 'nprogress';

export default function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // When the route changes, we're done.
    NProgress.done();
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleAnchorClick = (event: MouseEvent) => {
      try {
        const target = event.target as HTMLElement;
        const anchor = target.closest('a');

        // Ensure anchor and href exist, and it's not a button or other element without an href
        if (anchor && anchor.href) {
          const url = new URL(anchor.href);
          const currentUrl = new URL(window.location.href);

          // Check if it's an internal link
          if (url.origin === currentUrl.origin) {
            // Check if it's a different page and not just a hash link
            if (url.pathname !== currentUrl.pathname || url.search !== currentUrl.search) {
               NProgress.start();
            }
          }
        }
      } catch (err) {
        // Ignore errors from invalid URLS (e.g. `mailto:`)
        NProgress.start();
      }
    };

    document.addEventListener('click', handleAnchorClick);

    return () => {
      document.removeEventListener('click', handleAnchorClick);
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  return null;
}
