"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function FilterPills() {
  const filters = ["All", "Artisans", "Music", "Surf", "Food", "Heritage"];
  const [active, setActive] = useState("All");

  return (
    <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar py-2">
      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => setActive(filter)}
          className={cn(
            "px-5 py-2 rounded-full whitespace-nowrap text-sm font-medium spring-transition",
            active === filter 
              ? "bg-brand-saffron text-brand-deep-ocean shadow-md" 
              : "bg-white border border-brand-dark-text/10 text-[#18181B] hover:bg-brand-soft-gray"
          )}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}
