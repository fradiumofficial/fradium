import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[80vh] w-full flex-col items-center justify-center px-4 py-24 text-center">
      <div className="relative mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-secondary">
        <ShieldAlert className="h-12 w-12 text-destructive" strokeWidth={1.5} />
        <div className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full bg-destructive text-xl font-bold text-destructive-foreground">403</div>
      </div>

      <h1 className="mb-2 text-4xl font-bold tracking-tight">Access Denied</h1>
      <p className="mb-8 max-w-md text-muted-foreground">You don't have permission to access this resource. This area might require specific permissions or a higher community level.</p>
    </div>
  );
}
