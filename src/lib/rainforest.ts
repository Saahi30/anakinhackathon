// Rainforest API — Amazon search/product data.
// Docs: https://trajectdata.com/ecommerce/rainforest-api/data-formats/
const BASE = "https://api.rainforestapi.com/request";

export type RainforestSearchResult = {
  asin: string;
  title: string;
  link: string;
  image?: string;
  price?: { value?: number; currency?: string; raw?: string };
  rating?: number;
  ratings_total?: number;
  categories?: { name: string }[];
  is_prime?: boolean;
};

function apiKey(): string | null {
  return process.env.RAINFOREST_API_KEY || null;
}

function amazonDomain(): string {
  return process.env.RAINFOREST_AMAZON_DOMAIN || "amazon.in";
}

export async function searchAmazon(
  query: string,
  opts: { category?: string; limit?: number } = {}
): Promise<RainforestSearchResult[]> {
  const key = apiKey();
  if (!key) {
    console.warn("[rainforest] RAINFOREST_API_KEY not set, returning empty");
    return [];
  }
  const params = new URLSearchParams({
    api_key: key,
    type: "search",
    amazon_domain: amazonDomain(),
    search_term: query,
    output: "json",
  });
  if (opts.category) params.set("category_id", opts.category);

  const res = await fetch(`${BASE}?${params.toString()}`, { method: "GET" });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`rainforest search failed ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  const results = (data?.search_results || []) as any[];
  const limit = opts.limit ?? 12;
  return results.slice(0, limit).map((r) => ({
    asin: r.asin,
    title: r.title,
    link: r.link,
    image: r.image,
    price: r.price,
    rating: r.rating,
    ratings_total: r.ratings_total,
    categories: r.categories,
    is_prime: r.is_prime,
  }));
}

export async function fetchAmazonProduct(asin: string): Promise<any | null> {
  const key = apiKey();
  if (!key) return null;
  const params = new URLSearchParams({
    api_key: key,
    type: "product",
    amazon_domain: amazonDomain(),
    asin,
    output: "json",
  });
  const res = await fetch(`${BASE}?${params.toString()}`, { method: "GET" });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.product || null;
}

export function rainforestConfigured(): boolean {
  return Boolean(apiKey());
}
