'use client';

import { useState } from 'react';
import { Button, Modal, Input, Card } from '@/components/ui';
import { useFirestoreCollection } from '@/hooks/useFirestore';
import { Coach } from '@/types';

export default function CoachesPage() {
  const { data: coaches, loading, error, add, update, remove } = useFirestoreCollection<Coach>('coaches', {
    orderByField: 'name',
    orderDirection: 'asc',
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoach, setEditingCoach] = useState<Coach | undefined>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleAdd = () => {
    setEditingCoach(undefined);
    setName('');
    setEmail('');
    setIsModalOpen(true);
  };

  const handleEdit = (coach: Coach) => {
    setEditingCoach(coach);
    setName(coach.name);
    setEmail(coach.email || '');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this coach?')) {
      await remove(id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCoach) {
      await update(editingCoach.id, { name, email });
    } else {
      await add({ name, email });
    }
    setIsModalOpen(false);
    setEditingCoach(undefined);
    setName('');
    setEmail('');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coaches</h1>
          <p className="text-gray-600">{coaches.length} coaches</p>
        </div>
        <Button onClick={handleAdd}>Add Coach</Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading coaches...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500">Error loading coaches: {error.message}</p>
        </div>
      ) : coaches.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-500">No coaches added yet. Add your coaching staff!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coaches.map((coach) => (
            <Card key={coach.id}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{coach.name}</h3>
                  {coach.email && (
                    <p className="text-sm text-gray-500">{coach.email}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(coach)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(coach.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCoach ? 'Edit Coach' : 'Add Coach'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="name"
            label="Coach Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g., Coach Smith"
          />

          <Input
            id="email"
            label="Email (optional)"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="coach@example.com"
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingCoach ? 'Update' : 'Add'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
