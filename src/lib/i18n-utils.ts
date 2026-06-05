export function statusKey(value: string) {
  return value.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

export function translateStatus(t: (key: string) => string, value: string) {
  try {
    return t(statusKey(value));
  } catch {
    return value;
  }
}
