export async function tryCatch<T>(
  promise: Promise<T>,
  onError?: (err: unknown) => void,
): Promise<T | undefined> {
  try {
    return await promise;
  } catch (err) {
    console.log(err);
    onError?.(err);
    return undefined;
  }
}
