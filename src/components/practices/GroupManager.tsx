'use client';

import { useState } from 'react';
import { Player, Group } from '@/types';
import { Button, Card } from '@/components/ui';
import { createGroups, createPartners, getPresentPlayers, balanceGroups, suggestGroupCount } from '@/lib/groupingUtils';

type GroupingMode = 'groups' | 'partners';

interface GroupManagerProps {
  players: Player[];
  attendance: Record<string, boolean>;
  groups: Record<string, Group>;
  drillCount: number;
  onGroupsChange: (groups: Record<string, Group>) => void;
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

  const [groupingMode, setGroupingMode] = useState<GroupingMode>('groups');
  const [numberOfGroups, setNumberOfGroups] = useState(groupArray.length || suggestedCount || 2);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Calculate partner count (pairs of 2, with one trio if odd)
  // E.g., 9 players = 4 partner groups (3 pairs + 1 trio)
  const partnerCount = Math.floor(presentPlayers.length / 2);

  // Get all assigned player IDs
  const assignedPlayerIds = new Set(groupArray.flatMap((g) => g.playerIds));

  // Get unassigned present players
  const unassignedPlayers = presentPlayers.filter((p) => !assignedPlayerIds.has(p.id));

  const handleAutoAssign = () => {
    let newGroups: Group[];

    if (groupingMode === 'partners') {
      newGroups = createPartners(presentPlayers);
    } else {
      newGroups = createGroups(presentPlayers, numberOfGroups);
    }

    const groupsRecord: Record<string, Group> = {};
    newGroups.forEach((group) => {
      groupsRecord[group.id] = group;
    });
    onGroupsChange(groupsRecord);
  };

  const handleBalance = () => {
    const balanced = balanceGroups(groupArray);
    const groupsRecord: Record<string, Group> = {};
    balanced.forEach((group) => {
      groupsRecord[group.id] = group;
    });
    onGroupsChange(groupsRecord);
  };

  const handleClear = () => {
    onGroupsChange({});
  };

  const getPlayerName = (playerId: string) => {
    return players.find((p) => p.id === playerId)?.name || 'Unknown';
  };

  const handleStartEditName = (group: Group) => {
    setEditingGroupId(group.id);
    setEditingName(group.name);
  };

  const handleSaveName = (groupId: string) => {
    if (editingName.trim()) {
      const updatedGroups = { ...groups };
      updatedGroups[groupId] = {
        ...updatedGroups[groupId],
        name: editingName.trim(),
      };
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

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Groups</h3>

      {presentPlayers.length === 0 ? (
        <p className="text-sm text-gray-500">
          Check in players to create groups
        </p>
      ) : (
        <>
          {/* Grouping Mode Toggle */}
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-sm text-gray-600">Mode:</span>
            <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                type="button"
                onClick={() => setGroupingMode('groups')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  groupingMode === 'groups'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Groups
              </button>
              <button
                type="button"
                onClick={() => setGroupingMode('partners')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors border-l border-gray-300 ${
                  groupingMode === 'partners'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Partners
              </button>
            </div>
            <span className="text-xs text-gray-500">
              {groupingMode === 'partners'
                ? `(${partnerCount} pairs${presentPlayers.length % 2 === 1 ? ' + 1 trio' : ''})`
                : ''}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-3 mb-4">
            {groupingMode === 'groups' && (
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600"># Groups:</label>
                <input
                  type="number"
                  min="1"
                  max={presentPlayers.length}
                  value={numberOfGroups}
                  onChange={(e) => setNumberOfGroups(parseInt(e.target.value) || 1)}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            )}
            <Button size="sm" onClick={handleAutoAssign}>
              {groupingMode === 'partners' ? 'Assign Partners' : 'Auto-Assign'}
            </Button>
            {groupArray.length > 0 && (
              <>
                {groupingMode === 'groups' && (
                  <Button size="sm" variant="secondary" onClick={handleBalance}>
                    Balance
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={handleClear}>
                  Clear
                </Button>
              </>
            )}
          </div>

          {/* Suggestion */}
          {groupingMode === 'groups' && suggestedCount > 0 && suggestedCount !== numberOfGroups && (
            <p className="text-xs text-blue-600 mb-3">
              Suggested: {suggestedCount} groups for {presentPlayers.length} players
              {drillCount > 0 && ` and ${drillCount} drills`}
            </p>
          )}

          {/* Groups Display */}
          {groupArray.length > 0 ? (
            <div className={`grid gap-3 ${
              groupingMode === 'partners'
                ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                : 'grid-cols-2'
            }`}>
              {groupArray.map((group) => (
                <Card
                  key={group.id}
                  padding="sm"
                  className={`${
                    groupingMode === 'partners'
                      ? 'bg-purple-50 border-purple-200'
                      : 'bg-gray-50'
                  }`}
                >
                  {/* Editable Group Name */}
                  {editingGroupId === group.id ? (
                    <div className="flex items-center space-x-1 mb-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveName(group.id);
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveName(group.id)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                        title="Save"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                        title="Cancel"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mb-2">
                      <h4
                        className={`font-medium text-sm cursor-pointer hover:underline ${
                          groupingMode === 'partners' ? 'text-purple-900' : 'text-gray-900'
                        }`}
                        onClick={() => handleStartEditName(group)}
                        title="Click to edit name"
                      >
                        {group.name}
                        {groupingMode === 'partners' && group.playerIds.length === 3 && (
                          <span className="ml-1 text-xs text-purple-600">(trio)</span>
                        )}
                      </h4>
                      <button
                        onClick={() => handleStartEditName(group)}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                        title="Edit name"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Player List with Remove Buttons */}
                  <div className="space-y-1">
                    {group.playerIds.map((playerId) => (
                      <div
                        key={playerId}
                        className="flex items-center justify-between text-xs text-gray-600 py-0.5 group/player"
                      >
                        <span>{getPlayerName(playerId)}</span>
                        <button
                          onClick={() => handleRemovePlayerFromGroup(group.id, playerId)}
                          className="opacity-0 group-hover/player:opacity-100 p-0.5 text-red-500 hover:bg-red-50 rounded transition-opacity"
                          title="Remove from group"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    {group.playerIds.length === 0 && (
                      <p className="text-xs text-gray-400 italic">Empty</p>
                    )}
                  </div>

                  {/* Add Player Dropdown */}
                  {unassignedPlayers.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <select
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white"
                        value=""
                        onChange={(e) => handleAddPlayerToGroup(group.id, e.target.value)}
                      >
                        <option value="">+ Add player...</option>
                        {unassignedPlayers.map((player) => (
                          <option key={player.id} value={player.id}>
                            {player.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {groupingMode !== 'partners' && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <span className="text-xs text-gray-500">
                        {group.playerIds.length} players
                      </span>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              {groupingMode === 'partners'
                ? `Click "Assign Partners" to pair up ${presentPlayers.length} present players`
                : `Click "Auto-Assign" to create groups from ${presentPlayers.length} present players`
              }
            </p>
          )}

          {/* Unassigned Players Section */}
          {groupArray.length > 0 && unassignedPlayers.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">
                Unassigned Players ({unassignedPlayers.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {unassignedPlayers.map((player) => (
                  <span
                    key={player.id}
                    className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded"
                  >
                    {player.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
