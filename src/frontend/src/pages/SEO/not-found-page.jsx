import { Search } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[80vh] w-full flex-col items-center justify-center px-4 py-24 text-center">
      <div className="relative mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-secondary">
        <Search className="h-12 w-12 text-emerald-500" strokeWidth={1.5} />
        <div className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-xl font-bold text-emerald-50">404</div>
      </div>

      <h1 className="mb-2 text-4xl font-bold tracking-tight">Page Not Found</h1>
      <p className="mb-8 max-w-md text-muted-foreground">The resource you're looking for doesn't exist or has been moved. It might have been renamed, removed, or the URL may be incorrect.</p>
    </div>
  );
}
