import { Badge } from "@/components/ui/badge";
import { toggleItem } from "@/lib/recipe-utils";

interface ChipGroupProps {
  items: string[];
  activeItems: string[];
  onChange: (items: string[]) => void;
}

export function ChipGroup({ items, activeItems, onChange }: ChipGroupProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const isActive = activeItems.includes(item);
        return (
          <button key={item} type="button" onClick={() => onChange(toggleItem(activeItems, item))}>
            <Badge variant={isActive ? "default" : "muted"}>{item}</Badge>
          </button>
        );
      })}
    </div>
  );
}
