type CatalogItem = {
  id: string;
  slug: string;
  name: string;
  description: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3000/api/v1";

async function fetchCatalogItems(): Promise<CatalogItem[]> {
  try {
    const res = await fetch(`${API_BASE}/catalog/items`, {
      // Basic caching so storefront isn't revalidated on every request
      next: { revalidate: 60 }
    });
    if (!res.ok) return [];
    const data = (await res.json()) as CatalogItem[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export default async function StorefrontPage() {
  const items = await fetchCatalogItems();

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          3D printing for home businesses
        </h1>
        <p className="max-w-2xl text-sm text-slate-300">
          Browse your catalog, upload models, and get instant quotes for 3D printing jobs.
          This is the public storefront entry point for Playground.au.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <a
          href="/quote"
          className="rounded-lg border border-emerald-400/40 bg-slate-900/60 p-4 transition hover:border-emerald-400 hover:bg-slate-900"
        >
          <h2 className="text-lg font-medium text-emerald-300">Upload &amp; get a quote</h2>
          <p className="mt-1 text-sm text-slate-300">
            Start from your own STL/OBJ/3MF files, configure material and quality, and see
            instant pricing, feasibility, and lead time.
          </p>
        </a>

        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <h2 className="text-lg font-medium text-slate-100">Catalog</h2>
          {items.length === 0 ? (
            <p className="mt-1 text-sm text-slate-300">
              Catalog items will appear here once configured in the admin panel.
              For now, start with the upload flow.
            </p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm text-slate-200">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="rounded border border-slate-800 bg-slate-900/40 p-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-medium text-slate-50">{item.name}</div>
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                    <a
                      href={`/quote?catalog=${encodeURIComponent(item.slug)}`}
                      className="rounded bg-slate-800 px-3 py-1 text-xs font-medium text-emerald-300 hover:bg-slate-700"
                    >
                      Configure &amp; quote
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

