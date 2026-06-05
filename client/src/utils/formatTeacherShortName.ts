export function formatTeacherShortName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return '';

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0];

  const surname = parts[0];
  const initials = parts
    .slice(1)
    .map((part) => `${part.charAt(0).toUpperCase()}.`)
    .join(' ');

  return `${surname} ${initials}`;
}
