export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6" aria-busy="true" aria-label="Loading">
      <div className="grid gap-4 lg:grid-cols-[225px_1fr_300px]">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card h-64 animate-pulse bg-surface" />
        ))}
      </div>
    </div>
  );
}
