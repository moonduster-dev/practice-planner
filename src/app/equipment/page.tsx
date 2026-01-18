'use client';

import { useState } from 'react';
import { Button, Modal, Input, Card } from '@/components/ui';
import { useFirestoreCollection } from '@/hooks/useFirestore';
import { Equipment } from '@/types';

export default function EquipmentPage() {
  const { data: equipment, loading, error, add, update, remove } = useFirestoreCollection<Equipment>('equipment', {
    orderByField: 'name',
    orderDirection: 'asc',
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipment | undefined>();
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);

  const handleAdd = () => {
    setEditingItem(undefined);
    setName('');
    setQuantity(1);
    setIsModalOpen(true);
  };

  const handleEdit = (item: Equipment) => {
    setEditingItem(item);
    setName(item.name);
    setQuantity(item.quantity);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this equipment?')) {
      await remove(id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      await update(editingItem.id, { name, quantity });
    } else {
      await add({ name, quantity });
    }
    setIsModalOpen(false);
    setEditingItem(undefined);
    setName('');
    setQuantity(1);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipment</h1>
          <p className="text-gray-600">{equipment.length} items in inventory</p>
        </div>
        <Button onClick={handleAdd}>Add Equipment</Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading equipment...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500">Error loading equipment: {error.message}</p>
        </div>
      ) : equipment.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-500">No equipment added yet. Add your first item!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipment.map((item) => (
            <Card key={item.id}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
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
        title={editingItem ? 'Edit Equipment' : 'Add Equipment'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="name"
            label="Equipment Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g., Batting Tee"
          />

          <Input
            id="quantity"
            label="Quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            required
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingItem ? 'Update' : 'Add'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
