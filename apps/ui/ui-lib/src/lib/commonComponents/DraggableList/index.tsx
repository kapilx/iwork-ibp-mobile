import { ReactNode } from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  DraggableProvidedDraggableProps,
  DraggableProvidedDragHandleProps,
  DroppableProvidedProps,
  DropResult,
} from "react-beautiful-dnd";

/**
 * Props handed to each rendered row so the consumer can wire its own styled
 * element as the draggable, and place the drag handle wherever it wants.
 */
export interface DraggableItemProvided {
  innerRef: (element: HTMLElement | null) => void;
  draggableProps: DraggableProvidedDraggableProps;
  dragHandleProps: DraggableProvidedDragHandleProps | null | undefined;
}

interface DraggableListContainer {
  containerRef: (element: HTMLElement | null) => void;
  containerProps: DroppableProvidedProps;
  children: ReactNode;
}

interface DraggableListProps<T> {
  items: T[];
  getItemId: (item: T, index: number) => string | number;
  onReorder: (items: T[]) => void;
  renderItem: (
    item: T,
    provided: DraggableItemProvided,
    index: number
  ) => ReactNode;
  /**
   * Optional wrapper for the list so the consumer can supply its own styled,
   * scrollable container. Must forward `containerRef`/`containerProps` to the
   * rendered element. Defaults to a plain div.
   */
  renderContainer?: (container: DraggableListContainer) => ReactNode;
  droppableId?: string;
}

/**
 * Generic drag-and-drop reorderable list built on react-beautiful-dnd.
 * Centralises the DragDropContext/Droppable/Draggable + reorder wiring so
 * consumers (e.g. table column settings, cover mappings) only render rows.
 */
function DraggableList<T>({
  items,
  getItemId,
  onReorder,
  renderItem,
  renderContainer,
  droppableId = "draggable-list",
}: DraggableListProps<T>) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const next = Array.from(items);
    const [moved] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, moved);
    onReorder(next);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId={droppableId}>
        {(provided) => {
          const children = (
            <>
              {items.map((item, index) => (
                <Draggable
                  key={getItemId(item, index)}
                  draggableId={String(getItemId(item, index))}
                  index={index}
                >
                  {(dragProvided) =>
                    renderItem(
                      item,
                      {
                        innerRef: dragProvided.innerRef,
                        draggableProps: dragProvided.draggableProps,
                        dragHandleProps: dragProvided.dragHandleProps,
                      },
                      index
                    )
                  }
                </Draggable>
              ))}
              {provided.placeholder}
            </>
          );

          const container: DraggableListContainer = {
            containerRef: provided.innerRef,
            containerProps: provided.droppableProps,
            children,
          };

          return renderContainer ? (
            renderContainer(container)
          ) : (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {children}
            </div>
          );
        }}
      </Droppable>
    </DragDropContext>
  );
}

export default DraggableList;
