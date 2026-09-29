type PublicCandidate = {
  id: string;
  title: string;
  summary: string;
  url: string;
  updatedAt?: string;
  signal?: string;
};

type Fetcher = typeof fetch;

async function getJson(url: string, fetcher: Fetcher) {
  const response = await fetcher(url, {
    headers: { Accept: 'application/vnd.github+json, application/json', 'User-Agent': 'newpossible-tech-scout' },
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export async function searchPublicProjects(query: string, fetcher: Fetcher = fetch): Promise<PublicCandidate[]> {
  const data = await getJson(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=8`, fetcher);
  return (Array.isArray(data?.items) ? data.items : []).map((item: any) => ({
    id: `github:${item.full_name}`,
    title: item.full_name,
    summary: item.description || 'GitHub public repository',
    url: item.html_url,
    updatedAt: item.updated_at,
    signal: `${Number(item.stargazers_count || 0).toLocaleString()} stars`
  }));
}

export async function searchPublicModels(query: string, fetcher: Fetcher = fetch): Promise<PublicCandidate[]> {
  const data = await getJson(`https://huggingface.co/api/models?search=${encodeURIComponent(query)}&sort=trendingScore&direction=-1&limit=8`, fetcher);
  return (Array.isArray(data) ? data : []).map((item: any) => ({
    id: `huggingface:${item.id}`,
    title: item.id,
    summary: Array.isArray(item.tags) ? item.tags.slice(0, 8).join(' · ') : 'Hugging Face model',
    url: `https://huggingface.co/${item.id}`,
    updatedAt: item.lastModified,
    signal: `${Number(item.downloads || 0).toLocaleString()} downloads`
  }));
}

export async function searchPublicEcosystem(source: 'github' | 'huggingface', query: string, fetcher: Fetcher = fetch) {
  return source === 'github' ? searchPublicProjects(query, fetcher) : searchPublicModels(query, fetcher);
}
