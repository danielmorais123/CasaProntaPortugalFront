import { useEffect, useState } from "react";

export function useDebouncedSearch<T>(
  query: string,
  searchFn: (query: string) => Promise<T[]>,
  delay = 400
) {
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const handler = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchFn(query);
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, delay);

    return () => clearTimeout(handler);
  }, [delay, query, searchFn]);

  return { results, loading };
}
