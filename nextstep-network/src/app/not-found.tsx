import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="text-sm font-semibold text-brand">404</p>
      <h1 className="mt-2 text-2xl font-bold">We couldn't find that page</h1>
      <p className="mt-2 text-muted">It may have moved, or you may not have permission to view it.</p>
      <Link href="/" className="btn-primary mt-6">Go home</Link>
    </div>
  );
}
