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
    <div ref={setNodeRef} style={style} className="relative group h-full">
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 z-[5] cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-background/90 rounded-md border border-border shadow-sm"
      >
        <GripVertical className="w-3 h-3 text-muted-foreground" />
      </div>
      <div className="h-full">
        {children}
      </div>
    </div>
  );
};

interface DraggableStatsCardsProps {
  children: React.ReactElement[];
  layout?: "grid" | "vertical" | "config";
  storageKey?: string;
}

export const DraggableStatsCards = ({ children, layout = "grid", storageKey = "statsCardsOrder" }: DraggableStatsCardsProps) => {
  // Inicializar com ordem padrão para evitar problemas no PWA
  const [items, setItems] = useState<string[]>(() => {
    return children.map((_, index) => `card-${index}`);
  });
  const [isLoaded, setIsLoaded] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    // Carregar ordem salva do localStorage de forma segura
    try {
      const savedOrder = localStorage.getItem(storageKey);
      if (savedOrder) {
        const parsed = JSON.parse(savedOrder);
        // Verificar se a ordem salva é válida
        if (Array.isArray(parsed) && parsed.length === children.length) {
          setItems(parsed);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar ordem dos cards:', error);
    } finally {
      setIsLoaded(true);
    }
  }, [children.length, storageKey]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        // Salvar nova ordem no localStorage de forma segura
        try {
          localStorage.setItem(storageKey, JSON.stringify(newOrder));
        } catch (error) {
          console.error('Erro ao salvar ordem dos cards:', error);
        }
        
        return newOrder;
      });
    }
  };

  const gridClass = layout === "vertical" 
    ? "grid grid-cols-1 gap-3 items-stretch"
    : layout === "config"
    ? "grid grid-cols-1 lg:grid-cols-2 gap-3 items-stretch"
    : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-stretch";

  // Reordenar children baseado na ordem salva
  const orderedChildren = items.map((id) => {
    const index = parseInt(id.split("-")[1]);
    return children[index];
  }).filter(Boolean);

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
