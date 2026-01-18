'use client';

import { Player } from '@/types';
import { Badge } from '@/components/ui';

interface AttendanceCheckInProps {
  players: Player[];
  attendance: Record<string, boolean>;
  onToggle: (playerId: string) => void;
}

export default function AttendanceCheckIn({
  players,
  attendance,
  onToggle,
}: AttendanceCheckInProps) {
  const activePlayers = players.filter((p) => p.status === 'active');
  const presentCount = Object.values(attendance).filter(Boolean).length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Attendance</h3>
        <Badge variant={presentCount > 0 ? 'success' : 'default'}>
          {presentCount}/{activePlayers.length} present
        </Badge>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {activePlayers.map((player) => {
          const isPresent = attendance[player.id] || false;

          return (
            <button
              key={player.id}
              onClick={() => onToggle(player.id)}
              className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                isPresent
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    isPresent ? 'bg-green-500 border-green-500' : 'border-gray-300'
                  }`}
                >
                  {isPresent && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-900">{player.name}</span>
              </div>
              {player.jerseyNumber && (
                <span className="text-xs text-gray-500">#{player.jerseyNumber}</span>
              )}
            </button>
          );
        })}
      </div>

      {players.filter((p) => p.status === 'injured').length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">Injured (cannot attend):</p>
          <div className="flex flex-wrap gap-1">
            {players
              .filter((p) => p.status === 'injured')
              .map((player) => (
                <span
                  key={player.id}
                  className="px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded text-xs"
                >
                  {player.name}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
