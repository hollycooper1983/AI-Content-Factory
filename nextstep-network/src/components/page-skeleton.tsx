// Loading placeholder for read-mostly pages. Not used on pages with forms whose
// confirmation state would be lost if the page re-suspended after a save.
export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6" aria-busy="true" aria-label="Loading">
      <div className="mb-5 h-8 w-64 animate-pulse rounded bg-line" />
      <div className="grid gap-4 lg:grid-cols-[250px_1fr]">
        <div className="card h-72 animate-pulse" />
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="card h-28 animate-pulse" />)}</div>
      </div>
    </div>
  );
}
