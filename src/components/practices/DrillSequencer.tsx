'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SessionBlock, Drill, Coach, Equipment } from '@/types';
import { Button, Card, Badge } from '@/components/ui';
import { calculateBlockDuration } from '@/lib/timeEngine';
import { v4 as uuidv4 } from 'uuid';

interface DrillSequencerProps {
  sessionBlocks: SessionBlock[];
  drills: Drill[];
  coaches: Coach[];
  equipment: Equipment[];
  onBlocksChange: (blocks: SessionBlock[]) => void;
  onAddRotation: () => void;
}

interface SortableBlockProps {
  block: SessionBlock;
  drill?: Drill;
  coach?: Coach;
  onRemove: () => void;
  onEdit: () => void;
}

function SortableBlock({ block, drill, coach, onRemove, onEdit }: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const duration = calculateBlockDuration(block);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg border-2 ${
        block.type === 'rotation' ? 'border-purple-200' : 'border-gray-200'
      } p-3`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </button>

          <div>
            {block.type === 'single' ? (
              <>
                <div className="font-medium text-gray-900">
                  {drill?.title || 'Unknown Drill'}
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>{duration} min</span>
                  {coach && <span>- {coach.name}</span>}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-2">
                  <Badge variant="info">ROTATION</Badge>
                  <span className="font-medium text-gray-900">
                    {block.rotationDrills?.length || 0} drills
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {duration} min total
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-red-600 hover:bg-red-50"
          >
            Remove
          </Button>
        </div>
      </div>

      {block.notes && (
        <p className="mt-2 text-sm text-gray-500 italic">{block.notes}</p>
      )}
    </div>
  );
}

interface DrillLibraryItemProps {
  drill: Drill;
  onAdd: () => void;
}

function DrillLibraryItem({ drill, onAdd }: DrillLibraryItemProps) {
  const categoryColors: Record<string, string> = {
    warmup: 'bg-orange-100 text-orange-800',
    hitting: 'bg-red-100 text-red-800',
    fielding: 'bg-green-100 text-green-800',
    pitching: 'bg-blue-100 text-blue-800',
    catching: 'bg-purple-100 text-purple-800',
    iq: 'bg-yellow-100 text-yellow-800',
    games: 'bg-pink-100 text-pink-800',
  };

  return (
    <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all">
      <div className="flex items-center space-x-2">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${categoryColors[drill.category]}`}>
          {drill.category}
        </span>
        <span className="text-sm font-medium text-gray-900">{drill.title}</span>
        <span className="text-xs text-gray-500">{drill.baseDuration}m</span>
      </div>
      <Button size="sm" variant="ghost" onClick={onAdd}>
        + Add
      </Button>
    </div>
  );
}

export default function DrillSequencer({
  sessionBlocks,
  drills,
  coaches,
  equipment,
  onBlocksChange,
  onAddRotation,
}: DrillSequencerProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredDrills = drills.filter((drill) => {
    const matchesSearch = drill.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || drill.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = sessionBlocks.findIndex((b) => b.id === active.id);
      const newIndex = sessionBlocks.findIndex((b) => b.id === over.id);
      const newBlocks = arrayMove(sessionBlocks, oldIndex, newIndex).map((block, index) => ({
        ...block,
        order: index,
      }));
      onBlocksChange(newBlocks);
    }
  };

  const handleAddDrill = (drill: Drill) => {
    const newBlock: SessionBlock = {
      id: uuidv4(),
      type: 'single',
      order: sessionBlocks.length,
      drillId: drill.id,
      duration: drill.baseDuration,
      equipmentIds: drill.equipmentIds,
    };
    onBlocksChange([...sessionBlocks, newBlock]);
  };

  const handleRemoveBlock = (blockId: string) => {
    const newBlocks = sessionBlocks
      .filter((b) => b.id !== blockId)
      .map((block, index) => ({ ...block, order: index }));
    onBlocksChange(newBlocks);
  };

  const handleEditBlock = (blockId: string) => {
    // TODO: Open edit modal
    console.log('Edit block:', blockId);
  };

  const activeBlock = sessionBlocks.find((b) => b.id === activeId);
  const activeDrill = activeBlock?.drillId ? drills.find((d) => d.id === activeBlock.drillId) : undefined;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Drill Library */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-medium text-gray-900 mb-3">Drill Library</h3>

        {/* Search & Filter */}
        <div className="flex space-x-2 mb-3">
          <input
            type="text"
            placeholder="Search drills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2 py-1.5 border border-gray-300 rounded text-sm"
          >
            <option value="all">All</option>
            <option value="warmup">Warmup</option>
            <option value="hitting">Hitting</option>
            <option value="fielding">Fielding</option>
            <option value="pitching">Pitching</option>
            <option value="catching">Catching</option>
            <option value="iq">IQ</option>
            <option value="games">Games</option>
          </select>
        </div>

        {/* Drill List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredDrills.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No drills found. Add drills in the Drill Library first.
            </p>
          ) : (
            filteredDrills.map((drill) => (
              <DrillLibraryItem
                key={drill.id}
                drill={drill}
                onAdd={() => handleAddDrill(drill)}
              />
            ))
          )}
        </div>

        {/* Add Rotation Button */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Button variant="secondary" className="w-full" onClick={onAddRotation}>
            + Add Rotation Block
          </Button>
        </div>
      </div>

      {/* Practice Schedule */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-medium text-gray-900 mb-3">Practice Schedule</h3>

        {sessionBlocks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No drills scheduled yet.</p>
            <p className="text-sm mt-1">Add drills from the library or create a rotation.</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sessionBlocks.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {sessionBlocks.map((block) => {
                  const drill = block.drillId ? drills.find((d) => d.id === block.drillId) : undefined;
                  const coach = block.coachId ? coaches.find((c) => c.id === block.coachId) : undefined;

                  return (
                    <SortableBlock
                      key={block.id}
                      block={block}
                      drill={drill}
                      coach={coach}
                      onRemove={() => handleRemoveBlock(block.id)}
                      onEdit={() => handleEditBlock(block.id)}
                    />
                  );
                })}
              </div>
            </SortableContext>

            <DragOverlay>
              {activeBlock && (
                <div className="bg-white rounded-lg border-2 border-blue-500 p-3 shadow-lg">
                  <div className="font-medium text-gray-900">
                    {activeDrill?.title || 'Rotation Block'}
                  </div>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  );
}
