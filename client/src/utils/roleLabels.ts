const roleLabels: Record<string, string> = {
  teacher: 'Преподаватель',
  student: 'Студент',
  admin: 'Администратор',
};

export function formatUserRole(role: string): string {
  return roleLabels[role] ?? role.charAt(0).toUpperCase() + role.slice(1);
}
