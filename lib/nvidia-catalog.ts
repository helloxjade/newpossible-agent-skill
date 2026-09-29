const catalogUrl = 'https://raw.githubusercontent.com/NVIDIA/skills/main/skills.sh.json';

type CatalogGroup = {
  title: string;
  description: string;
  skills: string[];
};

type Catalog = {
  groupings: CatalogGroup[];
};

export type CatalogCandidate = {
  id: string;
  title: string;
  category: string;
  summary: string;
  url: string;
};

let cachedCatalog: Catalog | null = null;

export async function loadNvidiaCatalog(): Promise<Catalog> {
  if (cachedCatalog) return cachedCatalog;
  const response = await fetch(catalogUrl, { signal: AbortSignal.timeout(8_000) });
  if (!response.ok) throw new Error(`NVIDIA Catalog HTTP ${response.status}`);
  const catalog = await response.json() as Catalog;
  if (!Array.isArray(catalog.groupings)) throw new Error('NVIDIA Catalog 格式无效');
  cachedCatalog = catalog;
  return catalog;
}

export function catalogGroups(catalog: Catalog) {
  return catalog.groupings.map(({ title, description, skills }) => ({ title, description, count: skills.length }));
}

export function searchNvidiaCatalog(catalog: Catalog, category: string, query: string): CatalogCandidate[] {
  const normalizedCategory = category.trim().toLowerCase();
  const group = catalog.groupings.find(item => item.title.toLowerCase() === normalizedCategory)
    || catalog.groupings.find(item => item.title.toLowerCase().includes(normalizedCategory));
  if (!group) return [];
  const tokens = query.toLowerCase().split(/[^a-z0-9]+/).filter(token => token.length > 1);
  return group.skills
    .map(id => ({
      id,
      title: id,
      category: group.title,
      summary: group.description,
      url: `https://github.com/NVIDIA/skills/tree/main/skills/${encodeURIComponent(id)}`,
      score: tokens.reduce((score, token) => score + (id.includes(token) ? 2 : group.description.toLowerCase().includes(token) ? 1 : 0), 0)
    }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, 12)
    .map(({ score: _score, ...candidate }) => candidate);
}
