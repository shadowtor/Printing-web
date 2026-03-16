export default function StorefrontPage() {
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
          <h2 className="text-lg font-medium text-slate-100">Catalog (coming soon)</h2>
          <p className="mt-1 text-sm text-slate-300">
            This section will surface curated catalog items and presets once backend catalog
            APIs are wired. For now, use the upload flow.
          </p>
        </div>
      </div>
    </section>
  );
}

