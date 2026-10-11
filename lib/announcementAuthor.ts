const authorAliases: Record<string, string> = {
  "Elizabeth Reider": "LC Admin",
};

export function getAnnouncementAuthorName(name: string) {
  return authorAliases[name] ?? name;
}
