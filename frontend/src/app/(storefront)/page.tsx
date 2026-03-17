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
    <section className="space-y-8">
      <div className="panel relative overflow-hidden p-8 md:p-10">
        <div className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(circle_at_15%_10%,rgba(0,94,176,0.35),transparent_42%),radial-gradient(circle_at_90%_90%,rgba(184,29,32,0.24),transparent_38%)]" />
        <div className="relative space-y-4">
          <span className="inline-flex rounded-full border border-brand-primary/40 bg-brand-primary/10 px-3 py-1 text-caption uppercase tracking-[0.18em] text-brand-muted">
            3D print storefront
          </span>
          <h1 className="font-[var(--font-heading)] text-title text-white">
            Dream. Discover. Deliver.
          </h1>
          <p className="max-w-2xl text-body text-brand-muted">
            Upload your models, receive instant quotes, and move from checkout to production
            with a single workflow built for real print businesses.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <a href="/quote" className="btn-primary">
              Upload a model
            </a>
            <a href="#catalog" className="btn-secondary">
              Browse catalog
            </a>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <a
          href="/cart"
          className="btn-secondary"
        >
          Open cart
        </a>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_1fr]">
        <a
          href="/quote"
          className="panel group p-6 transition hover:-translate-y-0.5 hover:border-brand-primary/60 hover:shadow-glow"
        >
          <h2 className="font-[var(--font-heading)] text-h2 text-white group-hover:text-brand-accent">
            Upload &amp; get a quote
          </h2>
          <p className="mt-2 text-body text-brand-muted">
            Start from your own STL/OBJ/3MF files, configure material and quality, and see
            instant pricing, feasibility, and lead time.
          </p>
        </a>

        <div id="catalog" className="panel-soft p-6">
          <h2 className="font-[var(--font-heading)] text-h2 text-white">Catalog</h2>
          {items.length === 0 ? (
            <p className="mt-2 text-body text-brand-muted">
              Catalog items will appear here once configured in the admin panel.
              For now, start with the upload flow.
            </p>
          ) : (
            <ul className="mt-3 space-y-3 text-sm text-brand-text">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg border border-brand-border bg-brand-bg/45 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-medium text-white">{item.name}</div>
                      <p className="line-clamp-2 text-caption text-brand-subtle">
                        {item.description}
                      </p>
                    </div>
                    <a
                      href={`/quote?catalog=${encodeURIComponent(item.slug)}`}
                      className="rounded-md border border-brand-primary/40 bg-brand-primary/10 px-3 py-1 text-caption font-semibold text-brand-text hover:bg-brand-primary/25"
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

