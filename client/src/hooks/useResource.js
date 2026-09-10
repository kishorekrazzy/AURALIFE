import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Loads a value from the API and exposes an explicit four-state result:
 * loading / error / empty / data. Views must branch on all four, which is what
 * stops the UI from rendering confident-looking placeholders when the server
 * has not actually answered.
 */
export function useResource(loader, deps = [], { enabled = true, pollMs = 0 } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: enabled });
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(
    async (quiet = false) => {
      if (!enabled) return;
      if (!quiet) setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const data = await loaderRef.current();
        if (mounted.current) setState({ data, error: null, loading: false });
      } catch (err) {
        if (err.name === 'AbortError') return;
        if (mounted.current) setState({ data: null, error: err, loading: false });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enabled, ...deps],
  );

  useEffect(() => {
    run();
  }, [run]);

  useEffect(() => {
    if (!pollMs || !enabled) return undefined;
    const t = setInterval(() => run(true), pollMs);
    return () => clearInterval(t);
  }, [pollMs, enabled, run]);

  return { ...state, refresh: () => run(true), reload: () => run(false) };
}

/** Wraps a write call with pending/error state and a success callback. */
export function useAction(fn, { onSuccess, onError } = {}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      setPending(true);
      setError(null);
      try {
        const result = await fn(...args);
        if (onSuccess) onSuccess(result);
        return result;
      } catch (err) {
        setError(err);
        if (onError) onError(err);
        return null;
      } finally {
        setPending(false);
      }
    },
    [fn, onSuccess, onError],
  );

  return { execute, pending, error, clearError: () => setError(null) };
}
