export async function tryCatch<T>(
  promise: Promise<T>,
  onError?: (err: unknown) => void,
): Promise<T | undefined> {
  try {
    return await promise;
  } catch (err) {
    onError?.(err);
    return undefined;
  }
}
