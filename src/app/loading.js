import { Loader } from "@/components/ui/loader";

export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-900">
      <Loader size="xl" variant="default" text="Loading..." />
    </div>
  );
}
