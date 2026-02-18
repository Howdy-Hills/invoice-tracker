"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface InvoicePaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  perPage: number;
}

export function InvoicePagination({
  page,
  totalPages,
  totalCount,
  perPage,
}: InvoicePaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function goToPage(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (newPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(newPage));
    }
    router.replace(`${pathname}?${params.toString()}`);
  }

  const start = (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, totalCount);

  // Generate page numbers to show
  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    ) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between flex-wrap gap-4 mt-6">
      <p className="text-base text-charcoal-600">
        Showing{" "}
        <span className="font-semibold text-charcoal-900">{start}</span>
        {" - "}
        <span className="font-semibold text-charcoal-900">{end}</span>
        {" of "}
        <span className="font-semibold text-charcoal-900">{totalCount}</span>
        {" invoices"}
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => goToPage(page - 1)}
          disabled={page <= 1}
          className="p-2.5 rounded-xl hover:bg-cream-200 disabled:opacity-30 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 text-charcoal-600" />
        </button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span
              key={`dots-${i}`}
              className="px-2 py-2 text-charcoal-400 text-base"
            >
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => goToPage(p)}
              className={`min-w-[44px] min-h-[44px] rounded-xl text-base font-semibold transition-colors ${
                p === page
                  ? "bg-brand-600 text-white"
                  : "text-charcoal-600 hover:bg-cream-200"
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => goToPage(page + 1)}
          disabled={page >= totalPages}
          className="p-2.5 rounded-xl hover:bg-cream-200 disabled:opacity-30 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <ChevronRight className="w-5 h-5 text-charcoal-600" />
        </button>
      </div>
    </div>
  );
}
