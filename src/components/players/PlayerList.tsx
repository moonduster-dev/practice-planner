'use client';

import { Player } from '@/types';
import { Button, Card, Badge } from '@/components/ui';

interface PlayerListProps {
  players: Player[];
  onEdit: (player: Player) => void;
  onDelete: (id: string) => void;
}

export default function PlayerList({ players, onEdit, onDelete }: PlayerListProps) {
  if (players.length === 0) {
    return (
      <Card className="text-center py-12">
        <p className="text-gray-500">No players added yet. Add your first player!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {players.map((player) => (
        <Card key={player.id} className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-700 font-bold text-sm">
                {player.jerseyNumber || '#'}
              </span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{player.name}</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                {player.position && <span>{player.position}</span>}
                <Badge variant={player.status === 'active' ? 'success' : 'warning'}>
                  {player.status}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(player)}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(player.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Delete
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
