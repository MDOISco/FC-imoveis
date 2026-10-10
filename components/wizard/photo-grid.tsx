"use client";

import { useEffect, useState } from "react";
import {
  closestCenter,
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/client-api";
import type { WizardPhoto } from "@/lib/wizard-dto";
import { PhotoCard } from "./photo-card";

function SortablePhoto({
  photo,
  patchUrl,
}: {
  photo: WizardPhoto;
  patchUrl: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
      }}
    >
      <PhotoCard
        photo={photo}
        patchUrl={patchUrl}
        dragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

/** Grade de fotos com arrastar-e-soltar para definir a ordem do anúncio. */
export function PhotoGrid({
  propertyId,
  photos,
}: {
  propertyId: string;
  photos: WizardPhoto[];
}) {
  const [items, setItems] = useState<WizardPhoto[]>(photos);
  useEffect(() => setItems(photos), [photos]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((p) => p.id === active.id);
    const newIndex = items.findIndex((p) => p.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);
    try {
      await apiFetch(`/api/imoveis/${propertyId}/fotos/ordem`, {
        method: "PUT",
        body: { ids: reordered.map((p) => p.id) },
      });
    } catch {
      toast("Não foi possível salvar a nova ordem.", "erro");
      setItems(items);
    }
  }

  if (items.length === 0) return null;

  return (
    <div>
      <p className="mb-3 text-base text-stone-600">
        Arraste pelo símbolo <strong>⠿</strong> para mudar a ordem. A primeira
        foto (ou a marcada como <strong>★ Capa</strong>) abre o anúncio.
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((p) => p.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {items.map((photo) => (
              <SortablePhoto
                key={photo.id}
                photo={photo}
                patchUrl={`/api/imoveis/${propertyId}/fotos/${photo.id}`}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
