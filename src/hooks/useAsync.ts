import { useState, useEffect, useCallback, useRef } from 'react';

interface UseAsyncSingleOptions<TArgs extends any[]> {
  immediate?: boolean;
  args: TArgs;
  multipleArgs?: never;
}

interface UseAsyncMultipleOptions<TArgs extends any[]> {
  immediate?: boolean;
  args?: never;
  multipleArgs: TArgs[];
}

interface UseAsyncEmptyOptions {
  immediate?: boolean;
  args?: never;
  multipleArgs?: never;
}

type UseAsyncOptions<TArgs extends any[]> =
  | UseAsyncSingleOptions<TArgs>
  | UseAsyncMultipleOptions<TArgs>
  | UseAsyncEmptyOptions;

export function useAsync<TData, TArgs extends any[] = []>(
  asyncFunction: (...args: TArgs) => Promise<TData>,
  options: UseAsyncSingleOptions<TArgs>,
): {
  data: TData | null;
  error: string | null;
  loading: boolean;
  refetch: (...args: TArgs) => Promise<void>;
};

export function useAsync<TData, TArgs extends any[] = []>(
  asyncFunction: (...args: TArgs) => Promise<TData>,
  options: UseAsyncMultipleOptions<TArgs>,
): {
  data: TData[] | null;
  error: string | null;
  loading: boolean;
  refetch: (argsArray: TArgs[]) => Promise<void>;
};

export function useAsync<TData, TArgs extends any[] = []>(
  asyncFunction: (...args: TArgs) => Promise<TData>,
  options: UseAsyncOptions<TArgs> = {} as UseAsyncEmptyOptions,
) {
  const [data, setData] = useState<TData | TData[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const abortControllersRef = useRef<AbortController[]>([]);

  // Single request function (original behavior)
  const callSingle = useCallback(
    async (...args: TArgs) => {
      // Abort any existing requests
      abortControllersRef.current.forEach(controller => controller.abort());

      const controller = new AbortController();
      abortControllersRef.current = [controller];

      setLoading(true);
      setError(null);

      try {
        const result = await asyncFunction(...args);

        if (!controller.signal.aborted) {
          setData(result);
        }
      } catch (err: any) {
        if (!controller.signal.aborted) {
          setError(err?.response?.data?.message || err.message || 'Unknown error');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [asyncFunction],
  );

  // Multiple requests function
  const callMultiple = useCallback(
    async (argsArray: TArgs[]) => {
      // Abort any existing requests
      abortControllersRef.current.forEach(controller => controller.abort());

      const controllers = argsArray.map(() => new AbortController());
      abortControllersRef.current = controllers;

      setLoading(true);
      setError(null);

      try {
        const promises = argsArray.map(async (args, index) => {
          const controller = controllers[index];

          try {
            const result = await asyncFunction(...args);

            if (!controller.signal.aborted) {
              return result;
            }
            return null;
          } catch (err: any) {
            if (!controller.signal.aborted) {
              throw err;
            }
            return null;
          }
        });

        const results = await Promise.allSettled(promises);

        // Check if any controller was aborted
        const wasAborted = controllers.some(controller => controller.signal.aborted);
        if (wasAborted) return;

        // Collect successful results
        const successfulResults: TData[] = [];
        let hasError = false;
        let lastError: string | null = null;

        results.forEach(result => {
          if (result.status === 'fulfilled' && result.value !== null) {
            successfulResults.push(result.value);
          } else if (result.status === 'rejected') {
            hasError = true;
            lastError =
              result.reason?.response?.data?.message || result.reason?.message || 'Unknown error';
          }
        });

        setData(successfulResults);

        // Set error only if all requests failed
        if (hasError && successfulResults.length === 0) {
          setError(lastError);
        } else {
          setError(null);
        }
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || err.message || 'Unknown error';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [asyncFunction],
  );

  const call = useCallback(
    async (...args: any[]) => {
      if (args.length === 1 && Array.isArray(args[0])) {
        await callMultiple(args[0] as TArgs[]);
      } else {
        await callSingle(...(args as TArgs));
      }
    },
    [callSingle, callMultiple],
  );

  // Run immediately on mount if enabled
  useEffect(() => {
    if (options.immediate) {
      if (options.multipleArgs) {
        callMultiple(options.multipleArgs);
      } else if (options.args) {
        callSingle(...options.args);
      } else {
        callSingle(...([] as unknown as TArgs));
      }
    }

    return () => {
      abortControllersRef.current.forEach(controller => controller.abort());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.immediate]);

  return {
    data,
    error,
    loading,
    refetch: call,
  };
}
