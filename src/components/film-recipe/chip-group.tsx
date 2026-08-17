import { Badge } from "@/components/ui/badge";
import { toggleItem } from "@/lib/recipe-utils";

interface ChipGroupProps {
  items: string[];
  activeItems: string[];
  size?: "compact" | "button";
  onChange: (items: string[]) => void;
}

export function ChipGroup({ items, activeItems, size = "compact", onChange }: ChipGroupProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const isActive = activeItems.includes(item);
        return (
          <button key={item} type="button" className="inline-flex items-center" onClick={() => onChange(toggleItem(activeItems, item))}>
            <Badge
              variant={isActive ? "default" : "muted"}
              className={size === "button" ? "h-11 rounded-[22px] px-[18px] text-sm leading-5" : undefined}
            >
              {item}
            </Badge>
          </button>
        );
      })}
    </div>
  );
}
