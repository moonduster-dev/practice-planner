'use client';

import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import { Button, Card, Input, Badge, Modal } from '@/components/ui';
import { Drill, Coach, Group, RotationDrill, SessionBlock, Player } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { useFirestoreCollection } from '@/hooks/useFirestore';

interface RotationBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  drills: Drill[];
  coaches: Coach[];
  groups: Record<string, Group>;
  onSave: (block: SessionBlock) => void;
  editingBlock?: SessionBlock; // Block to edit, if any
}

// A single drill within a station
interface StationDrill {
  id: string;
  drillId: string;
  duration: number;
}

// A station can have multiple drills
interface Station {
  id: string;
  name: string;
  drills: StationDrill[];
  coachIds: string[];
  assignedGroupIds: string[];
  stationGroups?: Record<string, Group>; // Per-station group overrides
}

// Draggable player component
function DraggablePlayer({
  playerId,
  playerName,
  groupId,
  isFromOtherGroup,
  onRemove,
}: {
  playerId: string;
  playerName: string;
  groupId: string;
  isFromOtherGroup: boolean;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `player-${playerId}`,
    data: { playerId, fromGroupId: groupId },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between rounded px-2 py-1.5 text-xs cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50' : ''
      } ${isFromOtherGroup ? 'bg-amber-50 border border-amber-200' : 'bg-purple-50'}`}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-center gap-1.5">
        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
        <span className={isFromOtherGroup ? 'text-amber-700' : 'text-gray-700'}>
          {playerName}
        </span>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="p-0.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
        title="Remove from rotation"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// Droppable group container
function DroppableGroup({
  group,
  children,
  isOver,
}: {
  group: Group;
  children: React.ReactNode;
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({
    id: `group-${group.id}`,
    data: { groupId: group.id },
  });

  return (
    <div
      ref={setNodeRef}
      className={`bg-white rounded-lg border-2 p-3 transition-colors ${
        isOver ? 'border-purple-500 bg-purple-50' : 'border-purple-200'
      }`}
    >
      {children}
    </div>
  );
}

// Draggable player for station group editor
function StationEditorDraggablePlayer({
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
    id: `station-editor-${groupId}-${playerId}`,
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

// Droppable group for station editor
function StationEditorDroppableGroup({
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
    id: `station-editor-group-${groupId}`,
    data: { groupId, isPartner },
  });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border-2 p-2 transition-colors min-h-[50px] ${
        isOver
          ? isPartner ? 'border-purple-500 bg-purple-100' : 'border-blue-500 bg-blue-100'
          : isPartner ? 'border-purple-200 bg-white' : 'border-blue-200 bg-white'
      }`}
    >
      {children}
    </div>
  );
}

// Station Group Editor Component
interface StationGroupEditorProps {
  station: Station;
  stationIndex: number;
  stationGroups: Record<string, Group>;
  setStationGroups: React.Dispatch<React.SetStateAction<Record<string, Group>>>;
  effectiveGroups: Group[];
  players: Player[];
  onSave: (groups: Record<string, Group>) => void;
  onReset: () => void;
}

function StationGroupEditor({
  station,
  stationGroups,
  setStationGroups,
  effectiveGroups,
  players,
  onSave,
  onReset,
}: StationGroupEditorProps) {
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
      if (fromIsPartner === toIsPartner) {
        setStationGroups((prev) => {
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
    setStationGroups((prev) => ({
      ...prev,
      [groupId]: { ...prev[groupId], name: newName },
    }));
  };

  // Separate selected groups and partners
  const partnerIds = station.assignedGroupIds.filter(gId => effectiveGroups.find(g => g.id === gId)?.type === 'partner');
  const groupIds = station.assignedGroupIds.filter(gId => effectiveGroups.find(g => g.id === gId)?.type !== 'partner');

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="mt-3 space-y-3">
        {/* Groups Editor */}
        {groupIds.length > 0 && (
          <div className="border border-blue-200 rounded-lg p-2 bg-blue-50">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-medium text-blue-900">Edit Groups</h5>
              <button type="button" onClick={onReset} className="text-xs text-blue-600 hover:text-blue-800">
                Reset
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {groupIds.map((groupId) => {
                const grp = stationGroups[groupId];
                if (!grp) return null;
                const isOver = overGroupId === groupId;
                return (
                  <StationEditorDroppableGroup key={groupId} groupId={groupId} isPartner={false} isOver={isOver}>
                    <input
                      type="text"
                      value={grp.name}
                      onChange={(e) => handleRenameGroup(groupId, e.target.value)}
                      className="w-full text-xs font-medium text-blue-800 bg-transparent border-b border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none mb-1"
                    />
                    <div className="space-y-1 min-h-[25px]">
                      {grp.playerIds.map((playerId) => (
                        <StationEditorDraggablePlayer
                          key={playerId}
                          playerId={playerId}
                          playerName={getPlayerName(playerId)}
                          groupId={groupId}
                          isPartner={false}
                        />
                      ))}
                      {grp.playerIds.length === 0 && (
                        <p className="text-xs text-gray-400 italic">Drop here</p>
                      )}
                    </div>
                  </StationEditorDroppableGroup>
                );
              })}
            </div>
          </div>
        )}

        {/* Partners Editor */}
        {partnerIds.length > 0 && (
          <div className="border border-purple-200 rounded-lg p-2 bg-purple-50">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-medium text-purple-900">Edit Partners</h5>
              <button type="button" onClick={onReset} className="text-xs text-purple-600 hover:text-purple-800">
                Reset
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {partnerIds.map((groupId) => {
                const grp = stationGroups[groupId];
                if (!grp) return null;
                const isOver = overGroupId === groupId;
                return (
                  <StationEditorDroppableGroup key={groupId} groupId={groupId} isPartner={true} isOver={isOver}>
                    <input
                      type="text"
                      value={grp.name}
                      onChange={(e) => handleRenameGroup(groupId, e.target.value)}
                      className="w-full text-xs font-medium text-purple-800 bg-transparent border-b border-transparent hover:border-purple-300 focus:border-purple-500 focus:outline-none mb-1"
                    />
                    <div className="space-y-1 min-h-[25px]">
                      {grp.playerIds.map((playerId) => (
                        <StationEditorDraggablePlayer
                          key={playerId}
                          playerId={playerId}
                          playerName={getPlayerName(playerId)}
                          groupId={groupId}
                          isPartner={true}
                        />
                      ))}
                      {grp.playerIds.length === 0 && (
                        <p className="text-xs text-gray-400 italic">Drop here</p>
                      )}
                    </div>
                  </StationEditorDroppableGroup>
                );
              })}
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="secondary" onClick={onReset}>
            Reset
          </Button>
          <Button size="sm" onClick={() => onSave(stationGroups)}>
            Save Changes
          </Button>
        </div>
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

export default function RotationBuilder({
  isOpen,
  onClose,
  drills,
  coaches,
  groups,
  onSave,
  editingBlock,
}: RotationBuilderProps) {
  const { data: players } = useFirestoreCollection<Player>('players');
  const [rotationName, setRotationName] = useState('');
  const [stations, setStations] = useState<Station[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [showRotationPartnerEditor, setShowRotationPartnerEditor] = useState(false);
  const [drillCategoryFilter, setDrillCategoryFilter] = useState<string>('all');
  // Rotation-level partner groups - these override practice groups for this entire rotation
  const [rotationGroups, setRotationGroups] = useState<Record<string, Group>>({});
  // Simultaneous mode: all stations run at same time (time = max), vs rotation mode (time = sum)
  const [simultaneousStations, setSimultaneousStations] = useState(false);
  const groupArray = Object.values(groups);

  // Drag and drop state for partner editor
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);
  const [overGroupId, setOverGroupId] = useState<string | null>(null);

  // Per-station group editor state
  const [editingStationIndex, setEditingStationIndex] = useState<number>(-1);
  const [stationGroupsBeingEdited, setStationGroupsBeingEdited] = useState<Record<string, Group>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const playerId = active.data.current?.playerId;
    if (playerId) {
      setActivePlayerId(playerId);
    }
  };

  const handleDragOver = (event: { over: { data: { current?: { groupId?: string } } } | null }) => {
    const groupId = event.over?.data?.current?.groupId;
    setOverGroupId(groupId || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActivePlayerId(null);
    setOverGroupId(null);

    if (!over) return;

    const playerId = active.data.current?.playerId;
    const fromGroupId = active.data.current?.fromGroupId;
    const toGroupId = over.data.current?.groupId;

    if (playerId && fromGroupId && toGroupId && fromGroupId !== toGroupId) {
      handleMovePlayerToGroup(fromGroupId, toGroupId, playerId);
    }
  };

  // Check what types of groups/partners are available
  const hasGroups = groupArray.some((g) => g.type !== 'partner');
  const hasPartners = groupArray.some((g) => g.type === 'partner');

  // Helper to get player name
  const getPlayerName = (playerId: string) => {
    return players.find((p) => p.id === playerId)?.name || 'Unknown';
  };

  // Initialize state when editing an existing block
  React.useEffect(() => {
    if (isOpen && editingBlock && !initialized) {
      // Load data from the editing block
      setRotationName(editingBlock.notes || '');
      setSimultaneousStations(editingBlock.simultaneousStations || false);

      if (editingBlock.rotationDrills && editingBlock.rotationDrills.length > 0) {
        // Load rotation-level groups from the first station that has them
        // (they should be the same across all stations in a rotation)
        const firstWithGroups = editingBlock.rotationDrills.find(rd => rd.stationGroups);
        if (firstWithGroups?.stationGroups) {
          setRotationGroups(firstWithGroups.stationGroups);
        } else {
          // Initialize from practice groups
          const initialGroups: Record<string, Group> = {};
          Object.values(groups).forEach((g) => {
            initialGroups[g.id] = { ...g, playerIds: [...g.playerIds] };
          });
          setRotationGroups(initialGroups);
        }

        const loadedStations: Station[] = editingBlock.rotationDrills.map((rd, index) => {
          // Build drills array from drillIds or fall back to single drillId
          const drillIds = rd.drillIds || [rd.drillId];
          const drillDurations = rd.drillDurations || [rd.duration];

          const stationDrills: StationDrill[] = drillIds.map((dId, i) => ({
            id: uuidv4(),
            drillId: dId,
            duration: drillDurations[i] || drills.find(d => d.id === dId)?.baseDuration || 10,
          }));

          return {
            id: uuidv4(),
            name: rd.stationName || `Station ${index + 1}`,
            drills: stationDrills,
            coachIds: rd.coachIds || (rd.coachId ? [rd.coachId] : []),
            assignedGroupIds: rd.groupIds || [],
            stationGroups: rd.stationGroups,
          };
        });
        setStations(loadedStations);
      }
      setInitialized(true);
    } else if (!isOpen) {
      // Reset initialized flag when modal closes
      setInitialized(false);
      setRotationGroups({});
      setShowRotationPartnerEditor(false);
      setSimultaneousStations(false);
    }
  }, [isOpen, editingBlock, initialized, drills, groups]);

  const handleAddStation = () => {
    const filteredDrills = getFilteredDrills();
    if (filteredDrills.length === 0) return;
    setStations([
      ...stations,
      {
        id: uuidv4(),
        name: `Station ${stations.length + 1}`,
        drills: [
          {
            id: uuidv4(),
            drillId: filteredDrills[0].id,
            duration: filteredDrills[0].baseDuration,
          },
        ],
        coachIds: [],
        assignedGroupIds: [],
      },
    ]);
  };

  const handleRemoveStation = (stationIndex: number) => {
    setStations(stations.filter((_, i) => i !== stationIndex));
  };

  const handleStationNameChange = (stationIndex: number, name: string) => {
    const updated = [...stations];
    updated[stationIndex].name = name;
    setStations(updated);
  };

  // Add a drill to a station
  const handleAddDrillToStation = (stationIndex: number) => {
    const filteredDrills = getFilteredDrills();
    if (filteredDrills.length === 0) return;
    const updated = [...stations];
    updated[stationIndex].drills.push({
      id: uuidv4(),
      drillId: filteredDrills[0].id,
      duration: filteredDrills[0].baseDuration,
    });
    setStations(updated);
  };

  // Remove a drill from a station
  const handleRemoveDrillFromStation = (stationIndex: number, drillIndex: number) => {
    const updated = [...stations];
    if (updated[stationIndex].drills.length > 1) {
      updated[stationIndex].drills = updated[stationIndex].drills.filter((_, i) => i !== drillIndex);
      setStations(updated);
    }
  };

  // Update a drill within a station
  const handleDrillChange = (
    stationIndex: number,
    drillIndex: number,
    field: 'drillId' | 'duration',
    value: string | number
  ) => {
    const updated = [...stations];
    const stationDrill = updated[stationIndex].drills[drillIndex];

    if (field === 'drillId') {
      const drill = drills.find((d) => d.id === value);
      stationDrill.drillId = value as string;
      stationDrill.duration = drill?.baseDuration || stationDrill.duration;
    } else if (field === 'duration') {
      stationDrill.duration = value as number;
    }
    setStations(updated);
  };

  // Toggle coach for a station
  const handleToggleCoach = (stationIndex: number, coachId: string) => {
    const updated = [...stations];
    const station = updated[stationIndex];
    if (station.coachIds.includes(coachId)) {
      station.coachIds = station.coachIds.filter((id) => id !== coachId);
    } else {
      station.coachIds = [...station.coachIds, coachId];
    }
    setStations(updated);
  };

  // Toggle group for a station
  const handleToggleGroup = (stationIndex: number, groupId: string) => {
    const updated = [...stations];
    const station = updated[stationIndex];
    if (station.assignedGroupIds.includes(groupId)) {
      station.assignedGroupIds = station.assignedGroupIds.filter((id) => id !== groupId);
    } else {
      station.assignedGroupIds = [...station.assignedGroupIds, groupId];
    }
    setStations(updated);
  };

  // Initialize rotation groups from practice groups when opening
  const initializeRotationGroups = () => {
    if (Object.keys(rotationGroups).length === 0 && groupArray.length > 0) {
      const initialGroups: Record<string, Group> = {};
      groupArray.forEach((g) => {
        initialGroups[g.id] = { ...g, playerIds: [...g.playerIds] };
      });
      setRotationGroups(initialGroups);
    }
  };

  // Rotation-level partner editing functions
  const handleMovePlayerToGroup = (fromGroupId: string, toGroupId: string, playerId: string) => {
    setRotationGroups((prev) => {
      const updated = { ...prev };
      // Remove from old group
      if (updated[fromGroupId]) {
        updated[fromGroupId] = {
          ...updated[fromGroupId],
          playerIds: updated[fromGroupId].playerIds.filter((id) => id !== playerId),
        };
      }
      // Add to new group
      if (updated[toGroupId]) {
        updated[toGroupId] = {
          ...updated[toGroupId],
          playerIds: [...updated[toGroupId].playerIds, playerId],
        };
      }
      return updated;
    });
  };

  // Add a player to a rotation group
  const handleAddPlayerToGroup = (toGroupId: string, playerId: string) => {
    // Check if player already exists in any rotation group
    const alreadyInRotation = Object.values(rotationGroups).some(
      (g) => g.playerIds.includes(playerId)
    );
    if (alreadyInRotation) return;

    setRotationGroups((prev) => {
      const updated = { ...prev };
      if (updated[toGroupId]) {
        updated[toGroupId] = {
          ...updated[toGroupId],
          playerIds: [...updated[toGroupId].playerIds, playerId],
        };
      }
      return updated;
    });
  };

  // Remove a player from a rotation group
  const handleRemovePlayerFromGroup = (groupId: string, playerId: string) => {
    setRotationGroups((prev) => {
      const updated = { ...prev };
      if (updated[groupId]) {
        updated[groupId] = {
          ...updated[groupId],
          playerIds: updated[groupId].playerIds.filter((id) => id !== playerId),
        };
      }
      return updated;
    });
  };

  // Rename a rotation group
  const handleRenameRotationGroup = (groupId: string, newName: string) => {
    setRotationGroups((prev) => {
      const updated = { ...prev };
      if (updated[groupId]) {
        updated[groupId] = {
          ...updated[groupId],
          name: newName,
        };
      }
      return updated;
    });
  };

  // Get unassigned players (not in any rotation group)
  const getUnassignedPlayers = (): { playerId: string; originalGroupName: string }[] => {
    const playersInRotation = new Set(
      Object.values(rotationGroups).flatMap((g) => g.playerIds)
    );

    const unassignedPlayers: { playerId: string; originalGroupName: string }[] = [];
    groupArray.forEach((group) => {
      group.playerIds.forEach((playerId) => {
        if (!playersInRotation.has(playerId)) {
          unassignedPlayers.push({ playerId, originalGroupName: group.name });
        }
      });
    });

    return unassignedPlayers;
  };

  // Get count of all players in practice groups
  const getTotalPlayerCount = (): number => {
    const allPlayerIds = new Set(groupArray.flatMap((g) => g.playerIds));
    return allPlayerIds.size;
  };

  // Get count of players in rotation groups
  const getRotationPlayerCount = (): number => {
    const playersInRotation = new Set(
      Object.values(rotationGroups).flatMap((g) => g.playerIds)
    );
    return playersInRotation.size;
  };

  // Reset rotation groups to match practice groups
  const handleResetRotationGroups = () => {
    const resetGroups: Record<string, Group> = {};
    groupArray.forEach((g) => {
      resetGroups[g.id] = { ...g, playerIds: [...g.playerIds] };
    });
    setRotationGroups(resetGroups);
  };

  // Check if rotation groups have been modified from practice groups
  const hasModifiedPartners = (): boolean => {
    if (Object.keys(rotationGroups).length === 0) return false;
    return Object.keys(rotationGroups).some((gId) => {
      const practiceGroup = groups[gId];
      const rotationGroup = rotationGroups[gId];
      if (!practiceGroup || !rotationGroup) return true;
      // Check if player arrays differ
      if (JSON.stringify([...practiceGroup.playerIds].sort()) !==
          JSON.stringify([...rotationGroup.playerIds].sort())) {
        return true;
      }
      return false;
    });
  };

  // Get the effective groups for display (rotation groups if modified, otherwise practice groups)
  const getEffectiveGroups = (): Group[] => {
    if (Object.keys(rotationGroups).length > 0) {
      return Object.values(rotationGroups);
    }
    return groupArray;
  };

  const handleAutoAssignGroups = () => {
    const effectiveGroups = getEffectiveGroups();
    if (effectiveGroups.length === 0 || stations.length === 0) return;
    const updated = stations.map((station, index) => {
      const groupIndex = index % effectiveGroups.length;
      return {
        ...station,
        assignedGroupIds: [effectiveGroups[groupIndex].id],
      };
    });
    setStations(updated);
  };

  const handleAssignAllGroupsToAll = () => {
    const effectiveGroups = getEffectiveGroups();
    const updated = stations.map((station) => ({
      ...station,
      assignedGroupIds: effectiveGroups.map((g) => g.id),
    }));
    setStations(updated);
  };

  const handleSave = () => {
    if (stations.length === 0) {
      alert('Add at least one station to the rotation');
      return;
    }

    // Check if rotation groups have been modified
    const partnersModified = hasModifiedPartners();

    // Convert stations to RotationDrill format
    // Each station becomes one RotationDrill, with drillId being the first drill
    // and additional info stored in extended fields
    const rotationDrillsForSave: RotationDrill[] = stations.map((station) => {
      const totalDuration = station.drills.reduce((sum, d) => sum + d.duration, 0);
      // Build station-specific groups - prefer per-station groups over rotation groups
      // Only include the groups that are assigned to this station
      const hasStationGroups = station.stationGroups && Object.keys(station.stationGroups).length > 0;
      const stationGroupsToSave: Record<string, Group> | undefined = (hasStationGroups || partnersModified)
        ? Object.fromEntries(
            station.assignedGroupIds
              .filter((gId) => (station.stationGroups?.[gId] || rotationGroups[gId]))
              .map((gId) => [gId, station.stationGroups?.[gId] || rotationGroups[gId]])
          )
        : undefined;

      // Use effective groups for default group IDs
      const effectiveGroups = getEffectiveGroups();
      const rotationDrill: RotationDrill = {
        drillId: station.drills[0]?.drillId || '',
        drillIds: station.drills.map((d) => d.drillId), // All drills in this station
        drillDurations: station.drills.map((d) => d.duration), // Duration for each drill
        stationName: station.name,
        duration: totalDuration,
        coachId: station.coachIds[0] || '',
        coachIds: station.coachIds,
        groupIds: station.assignedGroupIds.length > 0 ? station.assignedGroupIds : effectiveGroups.map((g) => g.id),
        equipmentIds: [],
      };
      // Only include stationGroups if there are modified partners (Firestore doesn't allow undefined)
      if (stationGroupsToSave && Object.keys(stationGroupsToSave).length > 0) {
        rotationDrill.stationGroups = stationGroupsToSave;
      }
      return rotationDrill;
    });

    const block: SessionBlock = {
      id: editingBlock?.id || uuidv4(),
      type: 'rotation',
      order: editingBlock?.order || 0,
      notes: rotationName || 'Rotation',
      rotationDrills: rotationDrillsForSave,
    };
    // Only include simultaneousStations if true (Firestore doesn't allow undefined)
    if (simultaneousStations) {
      block.simultaneousStations = true;
    }

    onSave(block);
    setStations([]);
    setRotationName('');
    setRotationGroups({});
    setSimultaneousStations(false);
    onClose();
  };

  const handleCancel = () => {
    setStations([]);
    setRotationName('');
    onClose();
  };

  const getDrillTitle = (drillId: string) => {
    return drills.find((d) => d.id === drillId)?.title || 'Unknown';
  };

  // Get drills filtered by category
  const getFilteredDrills = () => {
    if (drillCategoryFilter === 'all') return drills;
    return drills.filter((d) => d.category === drillCategoryFilter);
  };

  const getCoachName = (coachId: string) => {
    return coaches.find((c) => c.id === coachId)?.name || '';
  };

  const getGroupName = (groupId: string) => {
    // Use rotation group name if modified, otherwise practice group name
    if (Object.keys(rotationGroups).length > 0 && rotationGroups[groupId]) {
      return rotationGroups[groupId].name;
    }
    return groups[groupId]?.name || 'Unknown';
  };

  // Calculate totals
  const stationTimes = stations.map(station =>
    station.drills.reduce((s, d) => s + d.duration, 0)
  );
  const totalTime = simultaneousStations
    ? Math.max(0, ...stationTimes) // Max station time when running simultaneously
    : stationTimes.reduce((sum, t) => sum + t, 0); // Sum of all stations when rotating
  const totalDrills = stations.reduce((sum, station) => sum + station.drills.length, 0);

  // Check if all stations have the same duration (needed for proper rotations)
  const allStationsSameDuration = stations.length <= 1 || stationTimes.every(t => t === stationTimes[0]);
  const maxStationTime = Math.max(0, ...stationTimes);

  // Sync all stations to a target duration
  const handleSyncStationDurations = (targetDuration: number) => {
    const updated = stations.map(station => {
      const currentTotal = station.drills.reduce((s, d) => s + d.duration, 0);
      if (currentTotal === targetDuration) return station;

      // Distribute the target duration across drills proportionally
      if (station.drills.length === 1) {
        return {
          ...station,
          drills: [{ ...station.drills[0], duration: targetDuration }],
        };
      }

      // For multiple drills, scale proportionally
      const scale = targetDuration / currentTotal;
      let remaining = targetDuration;
      const newDrills = station.drills.map((drill, i) => {
        if (i === station.drills.length - 1) {
          // Last drill gets the remainder to avoid rounding issues
          return { ...drill, duration: Math.max(1, remaining) };
        }
        const newDuration = Math.max(1, Math.round(drill.duration * scale));
        remaining -= newDuration;
        return { ...drill, duration: newDuration };
      });

      return { ...station, drills: newDrills };
    });
    setStations(updated);
  };

  const isEditing = !!editingBlock;

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title={isEditing ? "Edit Rotation Block" : "Build Rotation Block"} size="xl">
      <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
        {/* Rotation Name */}
        <Input
          id="rotationName"
          label="Rotation Name"
          value={rotationName}
          onChange={(e) => setRotationName(e.target.value)}
          placeholder="e.g., Hitting Stations, Fielding Circuit"
        />

        {/* Station Mode Toggle */}
        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Station Mode:</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSimultaneousStations(false)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                !simultaneousStations
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              Rotation
            </button>
            <button
              type="button"
              onClick={() => setSimultaneousStations(true)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                simultaneousStations
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              Simultaneous
            </button>
          </div>
          <span className="text-xs text-gray-500">
            {simultaneousStations
              ? 'All stations run at same time (time = longest station)'
              : 'Groups rotate through stations (time = all stations combined)'}
          </span>
        </div>

        {/* Warnings */}
        {groupArray.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Tip:</strong> Create groups first (check in players and click Auto-Assign in the Groups section).
            </p>
          </div>
        )}

        {coaches.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Tip:</strong> Add coaches in the Coaches page to assign them to stations.
            </p>
          </div>
        )}

        {drills.length === 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">
              <strong>Required:</strong> Add drills in the Drills page first.
            </p>
          </div>
        )}

        {/* Rotation-Level Group/Partner Editor */}
        {groupArray.length > 0 && (hasGroups || hasPartners) && (() => {
          // Determine label and colors based on what's available
          const editorLabel = hasGroups && hasPartners
            ? 'Edit Groups & Partners for this Rotation'
            : hasPartners
            ? 'Edit Partners for this Rotation'
            : 'Edit Groups for this Rotation';
          const resetLabel = hasGroups && hasPartners
            ? 'Reset to Practice Groups & Partners'
            : hasPartners
            ? 'Reset to Practice Partners'
            : 'Reset to Practice Groups';
          const countLabel = hasGroups && hasPartners
            ? `${groupArray.filter(g => g.type !== 'partner').length} groups, ${groupArray.filter(g => g.type === 'partner').length} partners`
            : hasPartners
            ? `${groupArray.length} partners`
            : `${groupArray.length} groups`;
          const borderColor = hasPartners && !hasGroups ? 'border-purple-200' : 'border-blue-200';
          const bgColor = hasPartners && !hasGroups ? 'bg-purple-50/50' : 'bg-blue-50/50';
          const iconColor = hasPartners && !hasGroups ? 'text-purple-600' : 'text-blue-600';
          const textColor = hasPartners && !hasGroups ? 'text-purple-900' : 'text-blue-900';
          const countColor = hasPartners && !hasGroups ? 'text-purple-600' : 'text-blue-600';

          return (
            <div className={`border ${borderColor} rounded-lg ${bgColor}`}>
              <button
                type="button"
                onClick={() => {
                  initializeRotationGroups();
                  setShowRotationPartnerEditor(!showRotationPartnerEditor);
                }}
                className="w-full flex items-center justify-between p-3 text-left"
              >
                <div className="flex items-center gap-2">
                  <svg className={`w-4 h-4 ${iconColor} transition-transform ${showRotationPartnerEditor ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className={`font-medium ${textColor}`}>{editorLabel}</span>
                  {hasModifiedPartners() && (
                    <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded">
                      ✎ modified
                    </span>
                  )}
                </div>
                <span className={`text-sm ${countColor}`}>{countLabel}</span>
              </button>

              {showRotationPartnerEditor && (
                <div className={`p-4 border-t ${borderColor}`}>
                  <div className="flex items-center justify-between mb-3">
                    <p className={`text-sm ${hasPartners && !hasGroups ? 'text-purple-700' : 'text-blue-700'}`}>
                      Customize player assignments for this rotation. Then assign to stations below.
                    </p>
                    <button
                      type="button"
                      onClick={handleResetRotationGroups}
                      className={`text-xs ${hasPartners && !hasGroups ? 'text-purple-600 hover:text-purple-800' : 'text-blue-600 hover:text-blue-800'}`}
                    >
                      {resetLabel}
                    </button>
                  </div>

                  {/* Player count indicator */}
                  {(() => {
                    const rotationCount = getRotationPlayerCount();
                    const totalCount = getTotalPlayerCount();
                    const unassigned = getUnassignedPlayers();
                    const isComplete = rotationCount === totalCount;
                    return (
                      <div className={`text-xs mb-3 px-2 py-1 rounded ${
                        isComplete ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {isComplete ? (
                          <span>✓ All {totalCount} players assigned</span>
                        ) : (
                          <span>⚠ {rotationCount} of {totalCount} players assigned ({unassigned.length} unassigned)</span>
                        )}
                      </div>
                    );
                  })()}

                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                  >
                    {/* Groups Section */}
                    {hasGroups && (
                      <div className="mb-4">
                        <h5 className="text-xs font-medium text-blue-900 mb-2">Groups</h5>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {Object.values(rotationGroups).filter(g => g.type !== 'partner').map((group) => {
                            const practiceGroup = groups[group.id];
                            const unassignedPlayers = getUnassignedPlayers();
                            const isGroupOver = overGroupId === group.id;

                            return (
                              <div
                                key={group.id}
                                className={`bg-white rounded-lg border-2 p-3 transition-colors ${
                                  isGroupOver ? 'border-blue-500 bg-blue-50' : 'border-blue-200'
                                }`}
                              >
                                <div className="flex items-center gap-1 mb-2">
                                  <input
                                    type="text"
                                    value={group.name}
                                    onChange={(e) => handleRenameRotationGroup(group.id, e.target.value)}
                                    className="flex-1 text-sm font-medium text-blue-800 bg-transparent border-b border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none px-0 py-0.5 min-w-0"
                                    title="Click to rename group"
                                  />
                                  <span className="text-xs text-blue-600">({group.playerIds.length})</span>
                                </div>
                                <div className="space-y-1 min-h-[40px]">
                                  {group.playerIds.map((playerId) => {
                                    const isFromOtherGroup = practiceGroup && !practiceGroup.playerIds.includes(playerId);
                                    return (
                                      <DraggablePlayer
                                        key={playerId}
                                        playerId={playerId}
                                        playerName={getPlayerName(playerId)}
                                        groupId={group.id}
                                        isFromOtherGroup={isFromOtherGroup}
                                        onRemove={() => handleRemovePlayerFromGroup(group.id, playerId)}
                                      />
                                    );
                                  })}
                                  {group.playerIds.length === 0 && (
                                    <p className="text-xs text-gray-400 italic px-2 py-2">Drop player here</p>
                                  )}
                                </div>

                                {unassignedPlayers.length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-blue-100">
                                    <select
                                      value=""
                                      onChange={(e) => {
                                        if (e.target.value) {
                                          handleAddPlayerToGroup(group.id, e.target.value);
                                        }
                                      }}
                                      className="w-full text-xs border border-blue-300 rounded px-2 py-1 bg-white text-blue-700"
                                    >
                                      <option value="">+ Add player...</option>
                                      {unassignedPlayers.map(({ playerId, originalGroupName }) => (
                                        <option key={playerId} value={playerId}>
                                          {getPlayerName(playerId)} ({originalGroupName})
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Partners Section */}
                    {hasPartners && (
                      <div>
                        <h5 className="text-xs font-medium text-purple-900 mb-2">Partners</h5>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {Object.values(rotationGroups).filter(g => g.type === 'partner').map((group) => {
                            const practiceGroup = groups[group.id];
                            const unassignedPlayers = getUnassignedPlayers();
                            const isGroupOver = overGroupId === group.id;

                            return (
                              <DroppableGroup key={group.id} group={group} isOver={isGroupOver}>
                                <div className="flex items-center gap-1 mb-2">
                                  <input
                                    type="text"
                                    value={group.name}
                                    onChange={(e) => handleRenameRotationGroup(group.id, e.target.value)}
                                    className="flex-1 text-sm font-medium text-purple-800 bg-transparent border-b border-transparent hover:border-purple-300 focus:border-purple-500 focus:outline-none px-0 py-0.5 min-w-0"
                                    title="Click to rename partner pair"
                                  />
                                  <span className="text-xs text-purple-600">({group.playerIds.length})</span>
                                </div>
                                <div className="space-y-1 min-h-[40px]">
                                  {group.playerIds.map((playerId) => {
                                    const isFromOtherGroup = practiceGroup && !practiceGroup.playerIds.includes(playerId);
                                    return (
                                      <DraggablePlayer
                                        key={playerId}
                                        playerId={playerId}
                                        playerName={getPlayerName(playerId)}
                                        groupId={group.id}
                                        isFromOtherGroup={isFromOtherGroup}
                                        onRemove={() => handleRemovePlayerFromGroup(group.id, playerId)}
                                      />
                                    );
                                  })}
                                  {group.playerIds.length === 0 && (
                                    <p className="text-xs text-gray-400 italic px-2 py-2">Drop player here</p>
                                  )}
                                </div>

                                {unassignedPlayers.length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-purple-100">
                                    <select
                                      value=""
                                      onChange={(e) => {
                                        if (e.target.value) {
                                          handleAddPlayerToGroup(group.id, e.target.value);
                                        }
                                      }}
                                      className="w-full text-xs border border-purple-300 rounded px-2 py-1 bg-white text-purple-700"
                                    >
                                      <option value="">+ Add player...</option>
                                      {unassignedPlayers.map(({ playerId, originalGroupName }) => (
                                        <option key={playerId} value={playerId}>
                                          {getPlayerName(playerId)} ({originalGroupName})
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}
                              </DroppableGroup>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Drag overlay */}
                    <DragOverlay>
                      {activePlayerId ? (
                        <div className="flex items-center gap-1.5 rounded px-2 py-1.5 text-xs bg-blue-100 border-2 border-blue-400 shadow-lg cursor-grabbing">
                          <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                          </svg>
                          <span className="text-blue-800 font-medium">
                            {getPlayerName(activePlayerId)}
                          </span>
                        </div>
                      ) : null}
                    </DragOverlay>
                  </DndContext>

                  {/* Unassigned players warning */}
                  {(() => {
                    const unassigned = getUnassignedPlayers();
                    if (unassigned.length === 0) return null;
                    return (
                      <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="text-xs font-medium text-amber-800 mb-1">
                          Unassigned Players ({unassigned.length}):
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {unassigned.map(({ playerId, originalGroupName }) => (
                            <span key={playerId} className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                              {getPlayerName(playerId)} <span className="text-amber-500">({originalGroupName})</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {hasModifiedPartners() && (
                    <p className={`mt-3 text-xs rounded px-2 py-1 ${
                      hasPartners && !hasGroups
                        ? 'text-purple-700 bg-purple-100'
                        : 'text-blue-700 bg-blue-100'
                    }`}>
                      ✓ {hasGroups && hasPartners ? 'Groups/Partners' : hasPartners ? 'Partners' : 'Groups'} modified for this rotation
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* Quick Actions */}
        {groupArray.length > 0 && stations.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Quick Actions:</span>
            <Button size="sm" variant="secondary" onClick={handleAutoAssignGroups}>
              Auto-Assign Groups
            </Button>
            <Button size="sm" variant="secondary" onClick={handleAssignAllGroupsToAll}>
              All Groups to All Stations
            </Button>
          </div>
        )}

        {/* Drill Category Filter */}
        {drills.length > 0 && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Filter Drills:</span>
              <span className="text-xs text-gray-500">
                {getFilteredDrills().length} drill{getFilteredDrills().length !== 1 ? 's' : ''} available
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'All' },
                { value: 'warmup', label: 'Warmup' },
                { value: 'hitting', label: 'Hitting' },
                { value: 'fielding', label: 'Fielding' },
                { value: 'pitching', label: 'Pitching' },
                { value: 'catching', label: 'Catching' },
                { value: 'iq', label: 'Game IQ' },
                { value: 'games', label: 'Games' },
              ].map((cat) => {
                const count = cat.value === 'all'
                  ? drills.length
                  : drills.filter(d => d.category === cat.value).length;
                const isSelected = drillCategoryFilter === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setDrillCategoryFilter(isSelected && cat.value !== 'all' ? 'all' : cat.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border-2 ${
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
          </div>
        )}

        {/* Stations */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Stations ({stations.length})</h4>
            <Button size="sm" onClick={handleAddStation} disabled={getFilteredDrills().length === 0}>
              + Add Station
            </Button>
          </div>

          {/* Duration mismatch warning */}
          {stations.length > 1 && !allStationsSameDuration && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-amber-800">Station durations don&apos;t match</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      For rotations to work smoothly, all stations should have the same duration.
                      Current: {stationTimes.map((t, i) => `${stations[i].name}: ${t}min`).join(', ')}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleSyncStationDurations(maxStationTime)}
                  className="flex-shrink-0"
                >
                  Sync All to {maxStationTime} min
                </Button>
              </div>
            </div>
          )}

          {stations.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <p className="text-gray-500 mb-2">No stations added yet</p>
              <p className="text-sm text-gray-400">
                Click &quot;+ Add Station&quot; to create stations. Each station can have multiple drills.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {stations.map((station, stationIndex) => (
                <Card key={station.id} padding="sm" className="border-2 border-blue-200 bg-blue-50/30">
                  <div className="space-y-4">
                    {/* Station Header */}
                    <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="info">Station {stationIndex + 1}</Badge>
                        <input
                          type="text"
                          value={station.name}
                          onChange={(e) => handleStationNameChange(stationIndex, e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm font-medium"
                          placeholder="Station name"
                        />
                        {station.stationGroups && Object.keys(station.stationGroups).length > 0 && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                            ✎ Groups modified
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveStation(stationIndex)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        Remove Station
                      </Button>
                    </div>

                    {/* Drills in this Station */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">
                          Drills in this Station ({station.drills.length})
                        </label>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAddDrillToStation(stationIndex)}
                          disabled={getFilteredDrills().length === 0}
                        >
                          + Add Drill
                        </Button>
                      </div>

                      <div className="space-y-2 bg-white rounded-lg p-2">
                        {station.drills.map((stationDrill, drillIndex) => {
                          const selectedDrill = drills.find(d => d.id === stationDrill.drillId);
                          return (
                            <div key={stationDrill.id} className="group/drill relative">
                              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                <span className="text-xs font-medium text-gray-500 w-4">
                                  {drillIndex + 1}.
                                </span>
                                <select
                                  value={stationDrill.drillId}
                                  onChange={(e) => handleDrillChange(stationIndex, drillIndex, 'drillId', e.target.value)}
                                  className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm"
                                >
                                  {/* Show selected drill even if it's filtered out */}
                                  {!getFilteredDrills().find(d => d.id === stationDrill.drillId) && drills.find(d => d.id === stationDrill.drillId) && (
                                    <option value={stationDrill.drillId}>
                                      {getDrillTitle(stationDrill.drillId)} ({drills.find(d => d.id === stationDrill.drillId)?.category}) ★
                                    </option>
                                  )}
                                  {getFilteredDrills().map((drill) => (
                                    <option key={drill.id} value={drill.id}>
                                      {drill.title} ({drill.category})
                                    </option>
                                  ))}
                                </select>
                                {selectedDrill?.videoUrl && (
                                  <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                )}
                                <input
                                  type="number"
                                  min="1"
                                  max="60"
                                  value={stationDrill.duration}
                                  onChange={(e) =>
                                    handleDrillChange(stationIndex, drillIndex, 'duration', parseInt(e.target.value) || 1)
                                  }
                                  className="w-16 px-2 py-1.5 border border-gray-300 rounded text-sm"
                                />
                                <span className="text-xs text-gray-500">min</span>
                                {station.drills.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveDrillFromStation(stationIndex, drillIndex)}
                                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                )}
                              </div>

                              {/* Hover Tooltip for selected drill */}
                              {selectedDrill && (
                                <div className="absolute left-0 right-0 top-full mt-1 z-50 hidden group-hover/drill:block">
                                  <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-3 text-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                        selectedDrill.category === 'warmup' ? 'bg-orange-100 text-orange-800' :
                                        selectedDrill.category === 'hitting' ? 'bg-red-100 text-red-800' :
                                        selectedDrill.category === 'fielding' ? 'bg-green-100 text-green-800' :
                                        selectedDrill.category === 'pitching' ? 'bg-blue-100 text-blue-800' :
                                        selectedDrill.category === 'catching' ? 'bg-purple-100 text-purple-800' :
                                        selectedDrill.category === 'iq' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-pink-100 text-pink-800'
                                      }`}>
                                        {selectedDrill.category}
                                      </span>
                                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                        selectedDrill.skillLevel === 'beginner' ? 'bg-green-100 text-green-800' :
                                        selectedDrill.skillLevel === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                      }`}>
                                        {selectedDrill.skillLevel}
                                      </span>
                                      <span className="text-xs text-gray-500">{selectedDrill.baseDuration} min</span>
                                    </div>
                                    <h4 className="font-semibold text-gray-900 mb-1">{selectedDrill.title}</h4>
                                    {selectedDrill.description && (
                                      <p className="text-gray-600 text-xs mb-2 line-clamp-3 whitespace-pre-wrap">{selectedDrill.description}</p>
                                    )}
                                    {selectedDrill.coachNotes && (
                                      <p className="text-gray-500 text-xs italic mb-2 line-clamp-2">
                                        <span className="font-medium not-italic">Coach notes:</span> {selectedDrill.coachNotes}
                                      </p>
                                    )}
                                    {selectedDrill.location && (
                                      <p className="text-gray-500 text-xs">
                                        <span className="font-medium">Location:</span> {selectedDrill.location.replace(/_/g, ' ')}
                                      </p>
                                    )}
                                    {selectedDrill.videoUrl && (
                                      <p className="text-blue-600 text-xs mt-2 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Has video
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Station total: {station.drills.reduce((sum, d) => sum + d.duration, 0)} minutes
                      </p>
                    </div>

                    {/* Coach Assignment */}
                    {coaches.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Coaches at this Station
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {coaches.map((coach) => (
                            <button
                              key={coach.id}
                              type="button"
                              onClick={() => handleToggleCoach(stationIndex, coach.id)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border-2 ${
                                station.coachIds.includes(coach.id)
                                  ? 'bg-green-100 border-green-500 text-green-800'
                                  : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                              }`}
                            >
                              {coach.name}
                              {station.coachIds.includes(coach.id) && ' ✓'}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Group/Partner Assignment */}
                    {groupArray.length > 0 && (
                      <div className="space-y-3">
                        {/* Groups */}
                        {getEffectiveGroups().filter(g => g.type !== 'partner').length > 0 && (
                          <div className="border border-blue-200 rounded-lg p-2 bg-blue-50/50">
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-sm font-medium text-blue-900">
                                Groups
                              </label>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const groupIds = getEffectiveGroups().filter(g => g.type !== 'partner').map(g => g.id);
                                    const updated = [...stations];
                                    updated[stationIndex].assignedGroupIds = [...new Set([...station.assignedGroupIds, ...groupIds])];
                                    setStations(updated);
                                  }}
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  All
                                </button>
                                <span className="text-gray-300">|</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const groupIds = getEffectiveGroups().filter(g => g.type !== 'partner').map(g => g.id);
                                    const updated = [...stations];
                                    updated[stationIndex].assignedGroupIds = station.assignedGroupIds.filter(id => !groupIds.includes(id));
                                    setStations(updated);
                                  }}
                                  className="text-xs text-gray-500 hover:underline"
                                >
                                  Clear
                                </button>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {getEffectiveGroups().filter(g => g.type !== 'partner').map((group) => (
                                <button
                                  key={group.id}
                                  type="button"
                                  onClick={() => handleToggleGroup(stationIndex, group.id)}
                                  className={`px-2 py-1 rounded text-xs font-medium transition-colors border ${
                                    station.assignedGroupIds.includes(group.id)
                                      ? 'bg-blue-100 border-blue-500 text-blue-800'
                                      : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                                  }`}
                                >
                                  {group.name} ({group.playerIds.length})
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Partners */}
                        {getEffectiveGroups().filter(g => g.type === 'partner').length > 0 && (
                          <div className="border border-purple-200 rounded-lg p-2 bg-purple-50/50">
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-sm font-medium text-purple-900">
                                Partners
                                {hasModifiedPartners() && (
                                  <span className="ml-2 text-xs text-purple-600 font-normal">(modified)</span>
                                )}
                              </label>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const partnerIds = getEffectiveGroups().filter(g => g.type === 'partner').map(g => g.id);
                                    const updated = [...stations];
                                    updated[stationIndex].assignedGroupIds = [...new Set([...station.assignedGroupIds, ...partnerIds])];
                                    setStations(updated);
                                  }}
                                  className="text-xs text-purple-600 hover:underline"
                                >
                                  All
                                </button>
                                <span className="text-gray-300">|</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const partnerIds = getEffectiveGroups().filter(g => g.type === 'partner').map(g => g.id);
                                    const updated = [...stations];
                                    updated[stationIndex].assignedGroupIds = station.assignedGroupIds.filter(id => !partnerIds.includes(id));
                                    setStations(updated);
                                  }}
                                  className="text-xs text-gray-500 hover:underline"
                                >
                                  Clear
                                </button>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {getEffectiveGroups().filter(g => g.type === 'partner').map((group) => (
                                <button
                                  key={group.id}
                                  type="button"
                                  onClick={() => handleToggleGroup(stationIndex, group.id)}
                                  className={`px-2 py-1 rounded text-xs font-medium transition-colors border ${
                                    station.assignedGroupIds.includes(group.id)
                                      ? 'bg-purple-100 border-purple-500 text-purple-800'
                                      : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                                  }`}
                                >
                                  {group.name}
                                  {group.playerIds.length === 3 && ' (trio)'}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {station.assignedGroupIds.length === 0 && (
                          <p className="text-xs text-orange-500">
                            No groups/partners selected - all will rotate through this station
                          </p>
                        )}

                        {/* Edit Groups/Partners Button */}
                        {station.assignedGroupIds.length > 0 && (() => {
                          const hasGroups = station.assignedGroupIds.some(id => getEffectiveGroups().find(g => g.id === id)?.type !== 'partner');
                          const hasPartners = station.assignedGroupIds.some(id => getEffectiveGroups().find(g => g.id === id)?.type === 'partner');
                          const buttonText = hasGroups && hasPartners
                            ? 'Edit Groups & Partners'
                            : hasPartners
                            ? 'Edit Partners'
                            : 'Edit Groups';
                          const buttonColor = hasPartners && !hasGroups ? 'text-purple-600 hover:text-purple-800' : 'text-blue-600 hover:text-blue-800';
                          const isEditing = editingStationIndex === stationIndex;

                          return (
                            <div className="mt-2">
                              <button
                                type="button"
                                onClick={() => {
                                  if (!isEditing) {
                                    // Initialize station groups from effective groups
                                    const stationGrps: Record<string, Group> = station.stationGroups ? { ...station.stationGroups } : {};
                                    station.assignedGroupIds.forEach((gId) => {
                                      const effectiveGroup = getEffectiveGroups().find(g => g.id === gId);
                                      if (effectiveGroup && !stationGrps[gId]) {
                                        stationGrps[gId] = { ...effectiveGroup, playerIds: [...effectiveGroup.playerIds] };
                                      }
                                    });
                                    setStationGroupsBeingEdited(stationGrps);
                                    setEditingStationIndex(stationIndex);
                                  } else {
                                    setEditingStationIndex(-1);
                                  }
                                }}
                                className={`text-xs ${buttonColor} flex items-center gap-1`}
                              >
                                <svg className={`w-3 h-3 transition-transform ${isEditing ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                {isEditing ? `Hide ${buttonText}` : `${buttonText} for this Station`}
                              </button>
                            </div>
                          );
                        })()}

                        {/* Station Group Editor */}
                        {editingStationIndex === stationIndex && station.assignedGroupIds.length > 0 && (
                          <StationGroupEditor
                            station={station}
                            stationIndex={stationIndex}
                            stationGroups={stationGroupsBeingEdited}
                            setStationGroups={setStationGroupsBeingEdited}
                            effectiveGroups={getEffectiveGroups()}
                            players={players}
                            onSave={(updatedGroups) => {
                              const updated = [...stations];
                              updated[stationIndex].stationGroups = updatedGroups;
                              setStations(updated);
                              setEditingStationIndex(-1);
                            }}
                            onReset={() => {
                              // Reset to effective groups
                              const resetGroups: Record<string, Group> = {};
                              station.assignedGroupIds.forEach((gId) => {
                                const effectiveGroup = getEffectiveGroups().find(g => g.id === gId);
                                if (effectiveGroup) {
                                  resetGroups[gId] = { ...effectiveGroup, playerIds: [...effectiveGroup.playerIds] };
                                }
                              });
                              setStationGroupsBeingEdited(resetGroups);
                              const updated = [...stations];
                              updated[stationIndex].stationGroups = undefined;
                              setStations(updated);
                            }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        {stations.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-blue-900">Rotation Summary</h4>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                simultaneousStations
                  ? 'bg-green-100 text-green-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {simultaneousStations ? 'Simultaneous' : 'Rotation'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stations.length}</div>
                <div className="text-xs text-blue-700">Stations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totalDrills}</div>
                <div className="text-xs text-blue-700">Total Drills</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totalTime} min</div>
                <div className="text-xs text-blue-700">
                  {simultaneousStations ? 'Duration' : 'Total Time'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {new Set(stations.flatMap((s) => s.assignedGroupIds)).size}
                </div>
                <div className="text-xs text-blue-700">Groups</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {new Set(stations.flatMap((s) => s.coachIds)).size}
                </div>
                <div className="text-xs text-blue-700">Coaches</div>
              </div>
            </div>

            {/* Station Overview */}
            <div className="space-y-2">
              {stations.map((station, index) => {
                const stationTime = station.drills.reduce((sum, d) => sum + d.duration, 0);
                return (
                  <div
                    key={station.id}
                    className="text-sm bg-white rounded p-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="info">#{index + 1}</Badge>
                        <span className="font-medium">{station.name}</span>
                        <span className="text-gray-500">({stationTime} min)</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {station.coachIds.map((cId) => (
                          <span key={cId} className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                            {getCoachName(cId)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 ml-8">
                      Drills: {station.drills.map((d) => getDrillTitle(d.drillId)).join(' → ')}
                    </div>
                    <div className="text-xs text-gray-500 ml-8 mt-1">
                      Groups: {station.assignedGroupIds.length > 0
                        ? station.assignedGroupIds.map((id) => getGroupName(id)).join(', ')
                        : 'All groups'}
                      {station.stationGroups && Object.keys(station.stationGroups).length > 0 && (
                        <span className="ml-1 text-amber-600">(✎ modified)</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t bg-white sticky bottom-0">
          <Button variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={stations.length === 0}>
            {isEditing ? 'Save Changes' : 'Add Rotation to Practice'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
