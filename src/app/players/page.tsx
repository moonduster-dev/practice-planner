'use client';

import { useState } from 'react';
import { Button, Modal } from '@/components/ui';
import PlayerList from '@/components/players/PlayerList';
import PlayerForm from '@/components/players/PlayerForm';
import { useFirestoreCollection } from '@/hooks/useFirestore';
import { Player } from '@/types';
import AuthGuard from '@/components/auth/AuthGuard';

export default function PlayersPage() {
  return (
    <AuthGuard>
      <PlayersPageContent />
    </AuthGuard>
  );
}

function PlayersPageContent() {
  const { data: players, loading, error, add, update, remove } = useFirestoreCollection<Player>('players', {
    orderByField: 'name',
    orderDirection: 'asc',
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | undefined>();

  const handleAdd = () => {
    setEditingPlayer(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (player: Player) => {
    setEditingPlayer(player);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this player?')) {
      await remove(id);
    }
  };

  const handleSubmit = async (data: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingPlayer) {
      await update(editingPlayer.id, data);
    } else {
      await add(data);
    }
    setIsModalOpen(false);
    setEditingPlayer(undefined);
  };

  const activeCount = players.filter((p) => p.status === 'active').length;
  const injuredCount = players.filter((p) => p.status === 'injured').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Players</h1>
          <p className="text-gray-600">
            {players.length} players ({activeCount} active, {injuredCount} injured)
          </p>
        </div>
        <Button onClick={handleAdd}>Add Player</Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading players...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500">Error loading players: {error.message}</p>
        </div>
      ) : (
        <PlayerList players={players} onEdit={handleEdit} onDelete={handleDelete} />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPlayer ? 'Edit Player' : 'Add Player'}
      >
        <PlayerForm
          player={editingPlayer}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
