'use client';

import { useState } from 'react';
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
import { Player, Group } from '@/types';
import { Button } from '@/components/ui';
import { createGroups, createPartners, getPresentPlayers, balanceGroups, suggestGroupCount } from '@/lib/groupingUtils';

interface GroupManagerProps {
  players: Player[];
  attendance: Record<string, boolean>;
  groups: Record<string, Group>;
  drillCount: number;
  onGroupsChange: (groups: Record<string, Group>) => void;
}

// Draggable player component
function DraggablePlayer({
  playerId,
  playerName,
  groupId,
  isPartner,
  onRemove,
}: {
  playerId: string;
  playerName: string;
  groupId: string;
  isPartner: boolean;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `player-${groupId}-${playerId}`,
    data: { playerId, fromGroupId: groupId, isPartner },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between rounded px-2 py-1 text-xs cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50' : ''
      } ${isPartner ? 'bg-purple-100' : 'bg-blue-100'}`}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-center gap-1">
        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
        <span className="text-gray-700">{playerName}</span>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="p-0.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
        title="Remove"
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
  isPartner,
  isOver,
  children,
}: {
  group: Group;
  isPartner: boolean;
  isOver: boolean;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({
    id: `group-${group.id}`,
    data: { groupId: group.id, isPartner },
  });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border-2 p-2 transition-colors min-h-[60px] ${
        isOver
          ? isPartner
            ? 'border-purple-500 bg-purple-100'
            : 'border-blue-500 bg-blue-100'
          : isPartner
          ? 'border-purple-200 bg-purple-50'
          : 'border-blue-200 bg-blue-50'
      }`}
    >
      {children}
    </div>
  );
}

export default function GroupManager({
  players,
  attendance,
  groups,
  drillCount,
  onGroupsChange,
}: GroupManagerProps) {
  const presentPlayers = getPresentPlayers(players, attendance);
  const groupArray = Object.values(groups);
  const suggestedCount = suggestGroupCount(presentPlayers.length, drillCount);

  // Separate groups and partners
  const existingGroups = groupArray.filter(g => g.type !== 'partner');
  const existingPartners = groupArray.filter(g => g.type === 'partner');

  const [numberOfGroups, setNumberOfGroups] = useState(existingGroups.length || 2);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Drag state
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);
  const [activePlayerName, setActivePlayerName] = useState<string>('');
  const [activeIsPartner, setActiveIsPartner] = useState<boolean>(false);
  const [overGroupId, setOverGroupId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  // Calculate partner count
  const partnerCount = Math.floor(presentPlayers.length / 2);

  // Get unassigned players
  const assignedToGroups = new Set(existingGroups.flatMap((g) => g.playerIds));
  const assignedToPartners = new Set(existingPartners.flatMap((g) => g.playerIds));
  const unassignedForGroups = presentPlayers.filter((p) => !assignedToGroups.has(p.id));
  const unassignedForPartners = presentPlayers.filter((p) => !assignedToPartners.has(p.id));

  const getPlayerName = (playerId: string) => {
    return players.find((p) => p.id === playerId)?.name || 'Unknown';
  };

  // Drag handlers
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

    if (playerId && fromGroupId && toGroupId && fromGroupId !== toGroupId) {
      // Only allow moves within same type (groups to groups, partners to partners)
      const fromGroup = groups[fromGroupId];
      const toGroup = groups[toGroupId];
      if (fromGroup && toGroup && fromGroup.type === toGroup.type) {
        handleMovePlayer(fromGroupId, toGroupId, playerId);
      }
    }
  };

  const handleMovePlayer = (fromGroupId: string, toGroupId: string, playerId: string) => {
    const updatedGroups = { ...groups };
    // Remove from old group
    if (updatedGroups[fromGroupId]) {
      updatedGroups[fromGroupId] = {
        ...updatedGroups[fromGroupId],
        playerIds: updatedGroups[fromGroupId].playerIds.filter((id) => id !== playerId),
      };
    }
    // Add to new group
    if (updatedGroups[toGroupId]) {
      updatedGroups[toGroupId] = {
        ...updatedGroups[toGroupId],
        playerIds: [...updatedGroups[toGroupId].playerIds, playerId],
      };
    }
    onGroupsChange(updatedGroups);
  };

  const handleCreateGroups = () => {
    const newGroups = createGroups(presentPlayers, numberOfGroups);
    const taggedGroups = newGroups.map(g => ({ ...g, type: 'group' as const }));
    const groupsRecord: Record<string, Group> = {};
    existingPartners.forEach((p) => { groupsRecord[p.id] = p; });
    taggedGroups.forEach((group) => { groupsRecord[group.id] = group; });
    onGroupsChange(groupsRecord);
  };

  const handleCreatePartners = () => {
    const newPartners = createPartners(presentPlayers);
    const taggedPartners = newPartners.map(g => ({ ...g, type: 'partner' as const }));
    const groupsRecord: Record<string, Group> = {};
    existingGroups.forEach((g) => { groupsRecord[g.id] = g; });
    taggedPartners.forEach((partner) => { groupsRecord[partner.id] = partner; });
    onGroupsChange(groupsRecord);
  };

  const handleBalanceGroups = () => {
    const balanced = balanceGroups(existingGroups);
    const groupsRecord: Record<string, Group> = {};
    existingPartners.forEach((p) => { groupsRecord[p.id] = p; });
    balanced.forEach((group) => { groupsRecord[group.id] = { ...group, type: 'group' }; });
    onGroupsChange(groupsRecord);
  };

  const handleClearGroups = () => {
    const groupsRecord: Record<string, Group> = {};
    existingPartners.forEach((p) => { groupsRecord[p.id] = p; });
    onGroupsChange(groupsRecord);
  };

  const handleClearPartners = () => {
    const groupsRecord: Record<string, Group> = {};
    existingGroups.forEach((g) => { groupsRecord[g.id] = g; });
    onGroupsChange(groupsRecord);
  };

  const handleClearAll = () => {
    onGroupsChange({});
  };

  const handleStartEditName = (group: Group) => {
    setEditingGroupId(group.id);
    setEditingName(group.name);
  };

  const handleSaveName = (groupId: string) => {
    if (editingName.trim()) {
      const updatedGroups = { ...groups };
      updatedGroups[groupId] = { ...updatedGroups[groupId], name: editingName.trim() };
      onGroupsChange(updatedGroups);
    }
    setEditingGroupId(null);
    setEditingName('');
  };

  const handleCancelEdit = () => {
    setEditingGroupId(null);
    setEditingName('');
  };

  const handleAddPlayerToGroup = (groupId: string, playerId: string) => {
    if (!playerId) return;
    const updatedGroups = { ...groups };
    updatedGroups[groupId] = {
      ...updatedGroups[groupId],
      playerIds: [...updatedGroups[groupId].playerIds, playerId],
    };
    onGroupsChange(updatedGroups);
  };

  const handleRemovePlayerFromGroup = (groupId: string, playerId: string) => {
    const updatedGroups = { ...groups };
    updatedGroups[groupId] = {
      ...updatedGroups[groupId],
      playerIds: updatedGroups[groupId].playerIds.filter((id) => id !== playerId),
    };
    onGroupsChange(updatedGroups);
  };

  // Render a group/partner card with drag and drop
  const renderGroupCard = (group: Group, isPartner: boolean, unassigned: Player[]) => {
    const isOver = overGroupId === group.id;

    return (
      <DroppableGroup key={group.id} group={group} isPartner={isPartner} isOver={isOver}>
        {/* Editable Name */}
        {editingGroupId === group.id ? (
          <div className="flex items-center gap-1 mb-2">
            <input
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveName(group.id);
                if (e.key === 'Escape') handleCancelEdit();
              }}
              className="flex-1 px-2 py-0.5 text-xs border border-gray-300 rounded"
              autoFocus
            />
            <button onClick={() => handleSaveName(group.id)} className="p-0.5 text-green-600 hover:bg-green-50 rounded">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <button onClick={handleCancelEdit} className="p-0.5 text-gray-500 hover:bg-gray-100 rounded">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-2">
            <h4
              className={`font-medium text-xs cursor-pointer hover:underline ${isPartner ? 'text-purple-900' : 'text-blue-900'}`}
              onClick={() => handleStartEditName(group)}
              title="Click to edit"
            >
              {group.name}
              {isPartner && group.playerIds.length === 3 && <span className="ml-1 text-purple-600">(trio)</span>}
              {!isPartner && <span className="ml-1 text-gray-500">({group.playerIds.length})</span>}
            </h4>
          </div>
        )}

        {/* Player List - Draggable */}
        <div className="space-y-1 min-h-[30px]">
          {group.playerIds.map((playerId) => (
            <DraggablePlayer
              key={playerId}
              playerId={playerId}
              playerName={getPlayerName(playerId)}
              groupId={group.id}
              isPartner={isPartner}
              onRemove={() => handleRemovePlayerFromGroup(group.id, playerId)}
            />
          ))}
          {group.playerIds.length === 0 && (
            <p className="text-xs text-gray-400 italic py-1">Drop player here</p>
          )}
        </div>

        {/* Add Player Dropdown */}
        {unassigned.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <select
              className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded bg-white"
              value=""
              onChange={(e) => handleAddPlayerToGroup(group.id, e.target.value)}
            >
              <option value="">+ Add...</option>
              {unassigned.map((player) => (
                <option key={player.id} value={player.id}>{player.name}</option>
              ))}
            </select>
          </div>
        )}
      </DroppableGroup>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Groups & Partners</h3>
        {groupArray.length > 0 && (
          <button type="button" onClick={handleClearAll} className="text-xs text-red-600 hover:text-red-800">
            Clear All
          </button>
        )}
      </div>

      {presentPlayers.length === 0 ? (
        <p className="text-sm text-gray-500">Check in players to create groups</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-4">
            {/* Groups Section */}
            <div className="border border-blue-200 rounded-lg p-3 bg-blue-50/30">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm text-blue-900">Groups</h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-blue-600">{existingGroups.length} groups</span>
                  {existingGroups.length > 0 && (
                    <button type="button" onClick={handleClearGroups} className="text-xs text-blue-600 hover:text-blue-800">Clear</button>
                  )}
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-2 mb-2">
                <div className="flex items-center gap-1">
                  <label className="text-xs text-gray-600">#:</label>
                  <input
                    type="number"
                    min="1"
                    max={presentPlayers.length}
                    value={numberOfGroups}
                    onChange={(e) => setNumberOfGroups(parseInt(e.target.value) || 1)}
                    className="w-12 px-1 py-0.5 border border-gray-300 rounded text-xs"
                  />
                </div>
                <Button size="sm" onClick={handleCreateGroups}>Create</Button>
                {existingGroups.length > 0 && (
                  <Button size="sm" variant="secondary" onClick={handleBalanceGroups}>Balance</Button>
                )}
              </div>

              {suggestedCount > 0 && suggestedCount !== numberOfGroups && (
                <p className="text-xs text-blue-600 mb-2">Suggested: {suggestedCount} groups</p>
              )}

              {existingGroups.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {existingGroups.map((group) => renderGroupCard(group, false, unassignedForGroups))}
                </div>
              ) : (
                <p className="text-xs text-gray-500">Click &quot;Create&quot; to divide players into groups</p>
              )}
            </div>

            {/* Partners Section */}
            <div className="border border-purple-200 rounded-lg p-3 bg-purple-50/30">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm text-purple-900">Partners</h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-purple-600">
                    {existingPartners.length} pairs{presentPlayers.length % 2 === 1 && existingPartners.length > 0 ? ' + trio' : ''}
                  </span>
                  {existingPartners.length > 0 && (
                    <button type="button" onClick={handleClearPartners} className="text-xs text-purple-600 hover:text-purple-800">Clear</button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <Button size="sm" onClick={handleCreatePartners}>Create</Button>
                <span className="text-xs text-gray-500">({partnerCount} pairs{presentPlayers.length % 2 === 1 ? ' + trio' : ''})</span>
              </div>

              {existingPartners.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {existingPartners.map((partner) => renderGroupCard(partner, true, unassignedForPartners))}
                </div>
              ) : (
                <p className="text-xs text-gray-500">Click &quot;Create&quot; to pair up players</p>
              )}
            </div>
          </div>

          {/* Drag Overlay */}
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
      )}
    </div>
  );
}
