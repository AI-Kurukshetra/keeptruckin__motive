"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="p-8 space-y-4">
      <p>Something went wrong.</p>
      <button className="border px-3 py-1" onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
