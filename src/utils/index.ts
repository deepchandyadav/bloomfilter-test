
export function env(key: string) {
  if (process.env[key]) {
    return process.env[key];
  }
  console.error(key, " ENV variable not found");
  return "";
}