export const wrapAsync = async <T>(fn: () => Promise<T>, onError: (e: unknown) => void): Promise<T> => {
  try {
    return await fn();
  } catch (e) {
    console.error(e);
    onError(e);
    throw e;
  }
};
