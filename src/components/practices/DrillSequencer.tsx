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
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SessionBlock, Drill, Coach, Equipment, Group, Player } from '@/types';
import { Button, Badge, Modal } from '@/components/ui';
import { calculateBlockDuration } from '@/lib/timeEngine';
import { v4 as uuidv4 } from 'uuid';
import { useFirestoreCollection } from '@/hooks/useFirestore';

interface DrillSequencerProps {
  sessionBlocks: SessionBlock[];
  drills: Drill[];
  coaches: Coach[];
  equipment: Equipment[];
  groups: Record<string, Group>;
  attendance?: Record<string, boolean>;
  onBlocksChange: (blocks: SessionBlock[]) => void;
  onAddRotation: () => void;
  onEditRotation?: (block: SessionBlock) => void;
  onAddWaterBreak?: () => void;
}

interface SortableBlockProps {
  block: SessionBlock;
  drill?: Drill;
  coach?: Coach;
  coaches?: Coach[];
  groups?: Group[];
  onRemove: () => void;
  onEdit: () => void;
}

function SortableBlock({ block, drill, coach, coaches, groups, onRemove, onEdit }: SortableBlockProps) {
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
  const isWaterBreak = block.notes === 'Water Break';

  // Get assigned groups/partners for this block - use drill-specific groups if available
  const assignedGroups = groups?.filter((g) => block.groupIds?.includes(g.id)) || [];
  // Check if this drill has modified partners
  const hasModifiedPartners = block.drillGroups && Object.keys(block.drillGroups).length > 0;
  // Get assigned coaches for this block
  const assignedCoaches = coaches?.filter((c) => block.coachIds?.includes(c.id)) || [];
  const displayCoaches = assignedCoaches.length > 0 ? assignedCoaches : coach ? [coach] : [];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg border-2 ${
        isWaterBreak
          ? 'border-blue-300 bg-blue-50'
          : block.type === 'rotation'
          ? 'border-purple-200'
          : 'border-gray-200'
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
            {isWaterBreak ? (
              <>
                <div className="font-medium text-blue-700">
                  💧 Water Break
                </div>
                <div className="text-sm text-blue-600">
                  {duration} min
                </div>
              </>
            ) : block.type === 'single' ? (
              <>
                <div className="font-medium text-gray-900">
                  {drill?.title || 'Unknown Drill'}
                </div>
                <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-sm text-gray-500">
                  <span>{duration} min</span>
                  {displayCoaches.length > 0 && (
                    <span>• {displayCoaches.map((c) => c.name).join(', ')}</span>
                  )}
                </div>
                {assignedGroups.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {assignedGroups.map((g) => (
                      <span
                        key={g.id}
                        className="px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded"
                      >
                        {g.name}
                      </span>
                    ))}
                    {hasModifiedPartners && (
                      <span className="px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded" title="Partners modified for this drill">
                        ✎ modified
                      </span>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center space-x-2">
                  <Badge variant="info">ROTATION</Badge>
                  <span className="font-medium text-gray-900">
                    {block.notes || `${block.rotationDrills?.length || 0} stations`}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {block.rotationDrills?.length || 0} stations • {duration} min total
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

      {block.notes && !isWaterBreak && block.type !== 'rotation' && (
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

// Draggable player for drill group editor
function EditorDraggablePlayer({
  playerId,
  playerName,
  groupId,
  isPartner,
}: {
  playerId: string;
  playerName: string;
  groupId: string;
  isPartner: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `editor-${groupId}-${playerId}`,
    data: { playerId, fromGroupId: groupId, isPartner },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1 rounded px-2 py-1 text-xs cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50' : ''
      } ${isPartner ? 'bg-purple-100' : 'bg-blue-100'}`}
      {...listeners}
      {...attributes}
    >
      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
      </svg>
      <span className="text-gray-700">{playerName}</span>
    </div>
  );
}

// Droppable group container for drill editor
function EditorDroppableGroup({
  groupId,
  isPartner,
  isOver,
  children,
}: {
  groupId: string;
  isPartner: boolean;
  isOver: boolean;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({
    id: `editor-group-${groupId}`,
    data: { groupId, isPartner },
  });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border-2 p-2 transition-colors min-h-[60px] ${
        isOver
          ? isPartner ? 'border-purple-500 bg-purple-100' : 'border-blue-500 bg-blue-100'
          : isPartner ? 'border-purple-200 bg-white' : 'border-blue-200 bg-white'
      }`}
    >
      {children}
    </div>
  );
}

// Drill Group Editor with drag and drop
interface DrillGroupEditorProps {
  editGroupIds: string[];
  editDrillGroups: Record<string, Group>;
  setEditDrillGroups: React.Dispatch<React.SetStateAction<Record<string, Group>>>;
  groups: Record<string, Group>;
  groupArray: Group[];
  players: Player[];
  onReset: () => void;
}

function DrillGroupEditor({
  editGroupIds,
  editDrillGroups,
  setEditDrillGroups,
  groups,
  groupArray,
  players,
  onReset,
}: DrillGroupEditorProps) {
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);
  const [activePlayerName, setActivePlayerName] = useState<string>('');
  const [activeIsPartner, setActiveIsPartner] = useState<boolean>(false);
  const [overGroupId, setOverGroupId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const getPlayerName = (playerId: string) => {
    return players.find((p) => p.id === playerId)?.name || 'Unknown';
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { playerId, isPartner } = event.active.data.current || {};
    if (playerId) {
      setActivePlayerId(playerId);
      setActivePlayerName(getPlayerName(playerId));
      setActiveIsPartner(isPartner || false);
    }
  };

  const handleDragOver = (event: { over: { data: { current?: { groupId?: string } } } | null }) => {
    setOverGroupId(event.over?.data?.current?.groupId || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActivePlayerId(null);
    setOverGroupId(null);

    if (!over) return;

    const playerId = active.data.current?.playerId;
    const fromGroupId = active.data.current?.fromGroupId;
    const toGroupId = over.data.current?.groupId;
    const fromIsPartner = active.data.current?.isPartner;
    const toIsPartner = over.data.current?.isPartner;

    if (playerId && fromGroupId && toGroupId && fromGroupId !== toGroupId) {
      // Only allow moves within same type
      if (fromIsPartner === toIsPartner) {
        setEditDrillGroups((prev) => {
          const updated = { ...prev };
          if (updated[fromGroupId]) {
            updated[fromGroupId] = {
              ...updated[fromGroupId],
              playerIds: updated[fromGroupId].playerIds.filter((id) => id !== playerId),
            };
          }
          if (updated[toGroupId]) {
            updated[toGroupId] = {
              ...updated[toGroupId],
              playerIds: [...updated[toGroupId].playerIds, playerId],
            };
          }
          return updated;
        });
      }
    }
  };

  const handleRenameGroup = (groupId: string, newName: string) => {
    setEditDrillGroups((prev) => ({
      ...prev,
      [groupId]: { ...prev[groupId], name: newName },
    }));
  };

  // Separate groups and partners
  const partnerIds = editGroupIds.filter(gId => groupArray.find(g => g.id === gId)?.type === 'partner');
  const groupIds = editGroupIds.filter(gId => groupArray.find(g => g.id === gId)?.type !== 'partner');

  const hasChanges = Object.keys(editDrillGroups).some((gId) => {
    const practiceGroup = groups[gId];
    const drillGroup = editDrillGroups[gId];
    if (!practiceGroup || !drillGroup) return false;
    return JSON.stringify([...practiceGroup.playerIds].sort()) !==
           JSON.stringify([...drillGroup.playerIds].sort());
  });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        {/* Groups Editor */}
        {groupIds.length > 0 && (
          <div className="border border-blue-200 rounded-lg p-3 bg-blue-50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-blue-900">Edit Groups for This Drill</h4>
              <button type="button" onClick={onReset} className="text-xs text-blue-600 hover:text-blue-800">
                Reset
              </button>
            </div>
            <p className="text-xs text-blue-700 mb-2">Drag players between groups</p>
            <div className="grid grid-cols-2 gap-2">
              {groupIds.map((groupId) => {
                const drillGroup = editDrillGroups[groupId];
                if (!drillGroup) return null;
                const isOver = overGroupId === groupId;
                return (
                  <EditorDroppableGroup key={groupId} groupId={groupId} isPartner={false} isOver={isOver}>
                    <input
                      type="text"
                      value={drillGroup.name}
                      onChange={(e) => handleRenameGroup(groupId, e.target.value)}
                      className="w-full text-xs font-medium text-blue-800 bg-transparent border-b border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none mb-1"
                    />
                    <div className="space-y-1 min-h-[30px]">
                      {drillGroup.playerIds.map((playerId) => (
                        <EditorDraggablePlayer
                          key={playerId}
                          playerId={playerId}
                          playerName={getPlayerName(playerId)}
                          groupId={groupId}
                          isPartner={false}
                        />
                      ))}
                      {drillGroup.playerIds.length === 0 && (
                        <p className="text-xs text-gray-400 italic py-1">Drop here</p>
                      )}
                    </div>
                  </EditorDroppableGroup>
                );
              })}
            </div>
          </div>
        )}

        {/* Partners Editor */}
        {partnerIds.length > 0 && (
          <div className="border border-purple-200 rounded-lg p-3 bg-purple-50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-purple-900">Edit Partners for This Drill</h4>
              <button type="button" onClick={onReset} className="text-xs text-purple-600 hover:text-purple-800">
                Reset
              </button>
            </div>
            <p className="text-xs text-purple-700 mb-2">Drag players between partners</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {partnerIds.map((groupId) => {
                const drillGroup = editDrillGroups[groupId];
                if (!drillGroup) return null;
                const isOver = overGroupId === groupId;
                return (
                  <EditorDroppableGroup key={groupId} groupId={groupId} isPartner={true} isOver={isOver}>
                    <input
                      type="text"
                      value={drillGroup.name}
                      onChange={(e) => handleRenameGroup(groupId, e.target.value)}
                      className="w-full text-xs font-medium text-purple-800 bg-transparent border-b border-transparent hover:border-purple-300 focus:border-purple-500 focus:outline-none mb-1"
                    />
                    <div className="space-y-1 min-h-[30px]">
                      {drillGroup.playerIds.map((playerId) => (
                        <EditorDraggablePlayer
                          key={playerId}
                          playerId={playerId}
                          playerName={getPlayerName(playerId)}
                          groupId={groupId}
                          isPartner={true}
                        />
                      ))}
                      {drillGroup.playerIds.length === 0 && (
                        <p className="text-xs text-gray-400 italic py-1">Drop here</p>
                      )}
                    </div>
                  </EditorDroppableGroup>
                );
              })}
            </div>
          </div>
        )}

        {hasChanges && (
          <p className="text-xs text-green-700 bg-green-100 rounded px-2 py-1">
            ✓ Modified for this drill
          </p>
        )}
      </div>

      <DragOverlay>
        {activePlayerId ? (
          <div className={`flex items-center gap-1 rounded px-2 py-1 text-xs shadow-lg cursor-grabbing ${
            activeIsPartner ? 'bg-purple-200 border-2 border-purple-400' : 'bg-blue-200 border-2 border-blue-400'
          }`}>
            <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
            <span className="font-medium">{activePlayerName}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default function DrillSequencer({
  sessionBlocks,
  drills,
  coaches,
  equipment: _equipment,
  groups,
  attendance: _attendance,
  onBlocksChange,
  onAddRotation,
  onEditRotation,
  onAddWaterBreak,
}: DrillSequencerProps) {
  // Suppress unused variable warnings - these props are kept for API compatibility
  void _equipment;
  void _attendance;
  const { data: players } = useFirestoreCollection<Player>('players');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Edit single drill modal state
  const [editingDrillBlock, setEditingDrillBlock] = useState<SessionBlock | null>(null);
  const [editDuration, setEditDuration] = useState(10);
  const [editCoachIds, setEditCoachIds] = useState<string[]>([]);
  const [editGroupIds, setEditGroupIds] = useState<string[]>([]);
  const [editNotes, setEditNotes] = useState('');
  const [editDrillGroups, setEditDrillGroups] = useState<Record<string, Group>>({});
  const [showPartnerEditor, setShowPartnerEditor] = useState(false);

  const groupArray = Object.values(groups);

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
    // All groups are assigned by default
    const allGroupIds = groupArray.map((g) => g.id);
    const newBlock: SessionBlock = {
      id: uuidv4(),
      type: 'single',
      order: sessionBlocks.length,
      drillId: drill.id,
      duration: drill.baseDuration,
      equipmentIds: drill.equipmentIds,
      groupIds: allGroupIds, // Assign all groups by default
      coachIds: [],
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
    const block = sessionBlocks.find((b) => b.id === blockId);
    if (!block) return;

    if (block.type === 'rotation' && onEditRotation) {
      onEditRotation(block);
    } else if (block.type === 'single' && block.notes !== 'Water Break') {
      // Open edit modal for single drill
      setEditingDrillBlock(block);
      setEditDuration(block.duration || 10);
      setEditCoachIds(block.coachIds || (block.coachId ? [block.coachId] : []));
      setEditGroupIds(block.groupIds || []);
      setEditNotes(block.notes || '');
      // Initialize drill-specific groups: use existing overrides or copy from practice groups
      if (block.drillGroups && Object.keys(block.drillGroups).length > 0) {
        setEditDrillGroups(block.drillGroups);
      } else {
        // Copy the selected groups as starting point
        const selectedGroups: Record<string, Group> = {};
        (block.groupIds || []).forEach((gId) => {
          if (groups[gId]) {
            selectedGroups[gId] = { ...groups[gId], playerIds: [...groups[gId].playerIds] };
          }
        });
        setEditDrillGroups(selectedGroups);
      }
      setShowPartnerEditor(false);
    }
  };

  const handleSaveDrillEdit = () => {
    if (!editingDrillBlock) return;

    // Check if drill groups differ from practice groups
    const hasDrillGroupOverrides = Object.keys(editDrillGroups).some((gId) => {
      const practiceGroup = groups[gId];
      const drillGroup = editDrillGroups[gId];
      if (!practiceGroup || !drillGroup) return true;
      // Compare player arrays
      const practicePlayerIds = [...practiceGroup.playerIds].sort();
      const drillPlayerIds = [...drillGroup.playerIds].sort();
      return JSON.stringify(practicePlayerIds) !== JSON.stringify(drillPlayerIds);
    });

    const updatedBlocks = sessionBlocks.map((block) => {
      if (block.id === editingDrillBlock.id) {
        const updatedBlock: SessionBlock = {
          ...block,
          duration: editDuration,
          coachIds: editCoachIds,
          coachId: editCoachIds[0] || '',
          groupIds: editGroupIds,
          notes: editNotes,
        };
        // Only include drillGroups if there are overrides (Firestore doesn't allow undefined)
        if (hasDrillGroupOverrides) {
          updatedBlock.drillGroups = editDrillGroups;
        } else {
          // Remove drillGroups if no overrides (in case it was previously set)
          delete updatedBlock.drillGroups;
        }
        return updatedBlock;
      }
      return block;
    });

    onBlocksChange(updatedBlocks);
    setEditingDrillBlock(null);
    setShowPartnerEditor(false);
  };

  const handleCancelDrillEdit = () => {
    setEditingDrillBlock(null);
    setShowPartnerEditor(false);
  };

  const handleResetDrillGroups = () => {
    // Reset to practice-level groups
    const selectedGroups: Record<string, Group> = {};
    editGroupIds.forEach((gId) => {
      if (groups[gId]) {
        selectedGroups[gId] = { ...groups[gId], playerIds: [...groups[gId].playerIds] };
      }
    });
    setEditDrillGroups(selectedGroups);
  };

  const toggleCoachSelection = (coachId: string) => {
    setEditCoachIds((prev) =>
      prev.includes(coachId) ? prev.filter((id) => id !== coachId) : [...prev, coachId]
    );
  };

  const toggleGroupSelection = (groupId: string) => {
    setEditGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const activeBlock = sessionBlocks.find((b) => b.id === activeId);
  const activeDrill = activeBlock?.drillId ? drills.find((d) => d.id === activeBlock.drillId) : undefined;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Drill Library */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-medium text-gray-900 mb-3">Drill Library</h3>

        {/* Search */}
        <div className="mb-3">
          <input
            type="text"
            placeholder="Search drills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
          />
        </div>

        {/* Category Filter Buttons */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {[
            { value: 'all', label: 'All' },
            { value: 'warmup', label: 'Warmup' },
            { value: 'hitting', label: 'Hitting' },
            { value: 'fielding', label: 'Fielding' },
            { value: 'pitching', label: 'Pitching' },
            { value: 'catching', label: 'Catching' },
            { value: 'iq', label: 'IQ' },
            { value: 'games', label: 'Games' },
          ].map((cat) => {
            const count = cat.value === 'all'
              ? drills.length
              : drills.filter(d => d.category === cat.value).length;
            const isSelected = categoryFilter === cat.value;
            if (count === 0 && cat.value !== 'all') return null;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategoryFilter(isSelected && cat.value !== 'all' ? 'all' : cat.value)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors border ${
                  isSelected
                    ? 'bg-gold-100 border-gold-500 text-navy-900'
                    : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
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

        {/* Add Rotation & Water Break Buttons */}
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
          <Button variant="secondary" className="w-full" onClick={onAddRotation}>
            + Add Rotation Block
          </Button>
          {onAddWaterBreak && (
            <Button
              variant="ghost"
              className="w-full text-blue-600 hover:bg-blue-50"
              onClick={onAddWaterBreak}
            >
              💧 Add Water Break (5 min)
            </Button>
          )}
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
                      coaches={coaches}
                      groups={groupArray}
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

      {/* Edit Single Drill Modal */}
      <Modal
        isOpen={!!editingDrillBlock}
        onClose={handleCancelDrillEdit}
        title={`Edit: ${editingDrillBlock?.drillId ? drills.find((d) => d.id === editingDrillBlock.drillId)?.title : 'Drill'}`}
        size="lg"
      >
        <div className="space-y-6">
          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes)
            </label>
            <input
              type="number"
              min="1"
              value={editDuration}
              onChange={(e) => setEditDuration(parseInt(e.target.value) || 1)}
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          {/* Coaches */}
          {coaches.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assigned Coaches
              </label>
              <div className="flex flex-wrap gap-2">
                {coaches.map((coach) => (
                  <button
                    key={coach.id}
                    type="button"
                    onClick={() => toggleCoachSelection(coach.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      editCoachIds.includes(coach.id)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {coach.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Groups/Partners */}
          {groupArray.length > 0 && (
            <div className="space-y-4">
              {/* Groups Section */}
              {groupArray.filter(g => g.type !== 'partner').length > 0 && (
                <div className="border border-blue-200 rounded-lg p-3 bg-blue-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-blue-900">
                      Groups
                    </label>
                    <div className="space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          const groupIds = groupArray.filter(g => g.type !== 'partner').map(g => g.id);
                          setEditGroupIds(prev => [...new Set([...prev, ...groupIds])]);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const groupIds = groupArray.filter(g => g.type !== 'partner').map(g => g.id);
                          setEditGroupIds(prev => prev.filter(id => !groupIds.includes(id)));
                        }}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {groupArray.filter(g => g.type !== 'partner').map((group) => (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => toggleGroupSelection(group.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          editGroupIds.includes(group.id)
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {group.name} ({group.playerIds.length})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Partners Section */}
              {groupArray.filter(g => g.type === 'partner').length > 0 && (
                <div className="border border-purple-200 rounded-lg p-3 bg-purple-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-purple-900">
                      Partners
                    </label>
                    <div className="space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          const partnerIds = groupArray.filter(g => g.type === 'partner').map(g => g.id);
                          setEditGroupIds(prev => [...new Set([...prev, ...partnerIds])]);
                        }}
                        className="text-xs text-purple-600 hover:text-purple-800"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const partnerIds = groupArray.filter(g => g.type === 'partner').map(g => g.id);
                          setEditGroupIds(prev => prev.filter(id => !partnerIds.includes(id)));
                        }}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {groupArray.filter(g => g.type === 'partner').map((group) => (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => toggleGroupSelection(group.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          editGroupIds.includes(group.id)
                            ? 'bg-purple-600 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {group.name}
                        {group.playerIds.length === 3 && (
                          <span className="ml-1 text-xs opacity-75">(trio)</span>
                        )}
                      </button>
                    ))}
                  </div>

                </div>
              )}

              {editGroupIds.length === 0 && (
                <p className="text-xs text-amber-600">
                  No groups or partners selected - all players will participate
                </p>
              )}

              {/* Edit Groups/Partners Button */}
              {editGroupIds.length > 0 && (() => {
                const hasGroups = editGroupIds.some(id => groupArray.find(g => g.id === id)?.type !== 'partner');
                const hasPartners = editGroupIds.some(id => groupArray.find(g => g.id === id)?.type === 'partner');
                const buttonText = hasGroups && hasPartners
                  ? 'Edit Groups & Partners'
                  : hasPartners
                  ? 'Edit Partners'
                  : 'Edit Groups';
                const buttonColor = hasPartners && !hasGroups ? 'text-purple-600 hover:text-purple-800' : 'text-blue-600 hover:text-blue-800';

                return (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (!showPartnerEditor) {
                          // Initialize editDrillGroups with all selected groups/partners when opening
                          const newDrillGroups: Record<string, Group> = { ...editDrillGroups };
                          editGroupIds.forEach((gId) => {
                            if (groups[gId] && !newDrillGroups[gId]) {
                              newDrillGroups[gId] = { ...groups[gId], playerIds: [...groups[gId].playerIds] };
                            }
                          });
                          setEditDrillGroups(newDrillGroups);
                        }
                        setShowPartnerEditor(!showPartnerEditor);
                      }}
                      className={`text-sm ${buttonColor} flex items-center gap-1`}
                    >
                      <svg className={`w-4 h-4 transition-transform ${showPartnerEditor ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      {showPartnerEditor ? `Hide ${buttonText}` : `${buttonText} for this Drill`}
                    </button>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Partner/Group Editor - for changing compositions for this specific drill */}
          {showPartnerEditor && editGroupIds.length > 0 && (
            <DrillGroupEditor
              editGroupIds={editGroupIds}
              editDrillGroups={editDrillGroups}
              setEditDrillGroups={setEditDrillGroups}
              groups={groups}
              groupArray={groupArray}
              players={players}
              onReset={handleResetDrillGroups}
            />
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Optional notes for this drill..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="secondary" onClick={handleCancelDrillEdit}>
              Cancel
            </Button>
            <Button onClick={handleSaveDrillEdit}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
