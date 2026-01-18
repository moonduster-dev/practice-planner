'use client';

import { useState } from 'react';
import { Button, Input, Select } from '@/components/ui';
import { Player, PlayerStatus } from '@/types';

interface PlayerFormProps {
  player?: Player;
  onSubmit: (data: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'injured', label: 'Injured' },
];

const positionOptions = [
  { value: '', label: 'Select Position' },
  { value: 'P', label: 'Pitcher' },
  { value: 'C', label: 'Catcher' },
  { value: '1B', label: 'First Base' },
  { value: '2B', label: 'Second Base' },
  { value: 'SS', label: 'Shortstop' },
  { value: '3B', label: 'Third Base' },
  { value: 'LF', label: 'Left Field' },
  { value: 'CF', label: 'Center Field' },
  { value: 'RF', label: 'Right Field' },
  { value: 'UTIL', label: 'Utility' },
];

export default function PlayerForm({ player, onSubmit, onCancel }: PlayerFormProps) {
  const [name, setName] = useState(player?.name || '');
  const [jerseyNumber, setJerseyNumber] = useState(player?.jerseyNumber || '');
  const [position, setPosition] = useState(player?.position || '');
  const [status, setStatus] = useState<PlayerStatus>(player?.status || 'active');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      jerseyNumber,
      position,
      status,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="name"
        label="Player Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        placeholder="Enter player name"
      />

      <Input
        id="jerseyNumber"
        label="Jersey Number"
        value={jerseyNumber}
        onChange={(e) => setJerseyNumber(e.target.value)}
        placeholder="e.g., 12"
      />

      <Select
        id="position"
        label="Position"
        value={position}
        onChange={(e) => setPosition(e.target.value)}
        options={positionOptions}
      />

      <Select
        id="status"
        label="Status"
        value={status}
        onChange={(e) => setStatus(e.target.value as PlayerStatus)}
        options={statusOptions}
      />

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{player ? 'Update' : 'Add'} Player</Button>
      </div>
    </form>
  );
}
