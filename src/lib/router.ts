import { useEffect, useState, useCallback } from 'react';

/**
 * Minimal hash-based router. Routes look like #/path/segment.
 * Keeps the app dependency-free and deployable anywhere.
 */
export function useRoute(): [string, (to: string) => void] {
  const [path, setPath] = useState<string>(() => normalize(window.location.hash));

  useEffect(() => {
    const onChange = () => setPath(normalize(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((to: string) => {
    const target = to.startsWith('#') ? to : `#${to.startsWith('/') ? to : `/${to}`}`;
    if (window.location.hash === target) {
      setPath(normalize(target));
    } else {
      window.location.hash = target;
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  return [path, navigate];
}

function normalize(hash: string): string {
  if (!hash || hash === '#') return '/';
  return hash.replace(/^#/, '');
}

export function parsePath(path: string): { segments: string[]; query: URLSearchParams } {
  const [rawPath, rawQuery] = path.split('?');
  const segments = rawPath.split('/').filter(Boolean);
  return { segments, query: new URLSearchParams(rawQuery ?? '') };
}
