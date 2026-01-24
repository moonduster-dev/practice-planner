'use client';

import { useState, useMemo } from 'react';
import { Button, Modal, Select, Input, Card } from '@/components/ui';
import DrillCard from '@/components/drills/DrillCard';
import DrillForm from '@/components/drills/DrillForm';
import { useFirestoreCollection } from '@/hooks/useFirestore';
import { Drill, DrillCategory, Equipment } from '@/types';

const categoryFilterOptions = [
  { value: 'all', label: 'All Categories' },
  { value: 'warmup', label: 'Warmup' },
  { value: 'hitting', label: 'Hitting' },
  { value: 'fielding', label: 'Fielding' },
  { value: 'pitching', label: 'Pitching' },
  { value: 'catching', label: 'Catching' },
  { value: 'iq', label: 'Game IQ' },
  { value: 'games', label: 'Games' },
];

export default function DrillsPage() {
  const { data: drills, loading, error, add, update, remove } = useFirestoreCollection<Drill>('drills', {
    orderByField: 'title',
    orderDirection: 'asc',
  });
  const { data: equipment } = useFirestoreCollection<Equipment>('equipment');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDrill, setEditingDrill] = useState<Drill | undefined>();
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDrills = useMemo(() => {
    return drills.filter((drill) => {
      const matchesCategory = categoryFilter === 'all' || drill.category === categoryFilter;
      const matchesSearch =
        searchQuery === '' ||
        drill.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        drill.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [drills, categoryFilter, searchQuery]);

  const handleAdd = () => {
    setEditingDrill(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (drill: Drill) => {
    setEditingDrill(drill);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this drill?')) {
      await remove(id);
    }
  };

  const handleSubmit = async (data: Omit<Drill, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'averageRating'>) => {
    if (editingDrill) {
      await update(editingDrill.id, data);
    } else {
      await add({ ...data, usageCount: 0, averageRating: 0 });
    }
    setIsModalOpen(false);
    setEditingDrill(undefined);
  };

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    drills.forEach((drill) => {
      counts[drill.category] = (counts[drill.category] || 0) + 1;
    });
    return counts;
  }, [drills]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Drill Library</h1>
          <p className="text-gray-600">{drills.length} drills total</p>
        </div>
        <Button onClick={handleAdd}>Add Drill</Button>
      </div>

      {/* Category Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-6">
        {categoryFilterOptions.slice(1).map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategoryFilter(cat.value === categoryFilter ? 'all' : cat.value)}
            className={`p-3 rounded-lg text-center transition-colors ${
              cat.value === categoryFilter
                ? 'bg-gold-100 border-2 border-gold-500'
                : 'bg-white border border-gray-200 hover:bg-navy-50'
            }`}
          >
            <div className={`text-lg font-bold ${cat.value === categoryFilter ? 'text-navy-900' : 'text-gray-900'}`}>
              {categoryCounts[cat.value] || 0}
            </div>
            <div className="text-xs text-gray-500">{cat.label}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search drills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={categoryFilterOptions}
            />
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading drills...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500">Error loading drills: {error.message}</p>
        </div>
      ) : filteredDrills.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-500">
            {drills.length === 0
              ? 'No drills added yet. Add your first drill!'
              : 'No drills match your filters.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDrills.map((drill) => (
            <DrillCard
              key={drill.id}
              drill={drill}
              equipment={equipment}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDrill ? 'Edit Drill' : 'Add Drill'}
        size="lg"
      >
        <DrillForm
          drill={editingDrill}
          equipment={equipment}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
