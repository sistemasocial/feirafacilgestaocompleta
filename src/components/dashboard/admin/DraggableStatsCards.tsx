import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { GripVertical } from "lucide-react";

interface DraggableCardProps {
  id: string;
  children: React.ReactNode;
}

const DraggableCard = ({ id, children }: DraggableCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 z-20 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-background/80 rounded-md border border-border"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      {children}
    </div>
  );
};

interface DraggableStatsCardsProps {
  children: React.ReactElement[];
  layout?: "grid" | "vertical" | "config";
  storageKey?: string;
}

export const DraggableStatsCards = ({ children, layout = "grid", storageKey = "statsCardsOrder" }: DraggableStatsCardsProps) => {
  const [items, setItems] = useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    // Carregar ordem salva do localStorage
    const savedOrder = localStorage.getItem(storageKey);
    if (savedOrder) {
      setItems(JSON.parse(savedOrder));
    } else {
      // Ordem padrão
      const defaultOrder = children.map((_, index) => `card-${index}`);
      setItems(defaultOrder);
    }
  }, [children.length, storageKey]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        // Salvar nova ordem no localStorage
        localStorage.setItem(storageKey, JSON.stringify(newOrder));
        
        return newOrder;
      });
    }
  };

  const gridClass = layout === "vertical" 
    ? "grid grid-cols-1 gap-4"
    : layout === "config"
    ? "grid grid-cols-1 md:grid-cols-2 gap-4"
    : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4";

  if (items.length === 0) {
    return <div className={gridClass}>{children}</div>;
  }

  // Reordenar children baseado na ordem salva
  const orderedChildren = items.map((id) => {
    const index = parseInt(id.split("-")[1]);
    return children[index];
  });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={rectSortingStrategy}>
        <div className={gridClass}>
          {orderedChildren.map((child, index) => (
            <DraggableCard key={items[index]} id={items[index]}>
              {child}
            </DraggableCard>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
