'use client';

import { useState } from 'react';
import { Player, Group } from '@/types';
import { Button, Card } from '@/components/ui';
import { createGroups, getPresentPlayers, balanceGroups, suggestGroupCount } from '@/lib/groupingUtils';

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

  const [numberOfGroups, setNumberOfGroups] = useState(groupArray.length || suggestedCount || 2);

  const handleAutoAssign = () => {
    const newGroups = createGroups(presentPlayers, numberOfGroups);
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

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Groups</h3>

      {presentPlayers.length === 0 ? (
        <p className="text-sm text-gray-500">
          Check in players to create groups
        </p>
      ) : (
        <>
          {/* Controls */}
          <div className="flex items-center space-x-3 mb-4">
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
            <Button size="sm" onClick={handleAutoAssign}>
              Auto-Assign
            </Button>
            {groupArray.length > 0 && (
              <>
                <Button size="sm" variant="secondary" onClick={handleBalance}>
                  Balance
                </Button>
                <Button size="sm" variant="ghost" onClick={handleClear}>
                  Clear
                </Button>
              </>
            )}
          </div>

          {/* Suggestion */}
          {suggestedCount > 0 && suggestedCount !== numberOfGroups && (
            <p className="text-xs text-blue-600 mb-3">
              Suggested: {suggestedCount} groups for {presentPlayers.length} players
              {drillCount > 0 && ` and ${drillCount} drills`}
            </p>
          )}

          {/* Groups Display */}
          {groupArray.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {groupArray.map((group) => (
                <Card key={group.id} padding="sm" className="bg-gray-50">
                  <h4 className="font-medium text-gray-900 text-sm mb-2">
                    {group.name}
                  </h4>
                  <div className="space-y-1">
                    {group.playerIds.map((playerId) => (
                      <div
                        key={playerId}
                        className="text-xs text-gray-600 py-0.5"
                      >
                        {getPlayerName(playerId)}
                      </div>
                    ))}
                    {group.playerIds.length === 0 && (
                      <p className="text-xs text-gray-400 italic">Empty</p>
                    )}
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <span className="text-xs text-gray-500">
                      {group.playerIds.length} players
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Click &quot;Auto-Assign&quot; to create groups from {presentPlayers.length} present players
            </p>
          )}
        </>
      )}
    </div>
  );
}
