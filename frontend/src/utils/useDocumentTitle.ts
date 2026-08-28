import { useEffect } from 'react';

export const useDocumentTitle = (title: string, description?: string) => {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title ? `${title} | Nexora Network` : 'Nexora — Distributed Professional & Social Network';

    if (description) {
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', description);
      }
    }

    return () => {
      document.title = prevTitle;
    };
  }, [title, description]);
};
