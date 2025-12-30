export function initialsFromName(fullName?: string) {
  const name = (fullName ?? "").trim();
  if (!name) return "CP";
  const parts = name.split(" ").filter(Boolean);
  const a = parts[0]?.[0] ?? "C";
  const b =
    parts.length > 1 ? parts[parts.length - 1]?.[0] : parts[0]?.[1] ?? "P";
  return (a + b).toUpperCase();
}
