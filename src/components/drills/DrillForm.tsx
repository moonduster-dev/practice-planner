'use client';

import { useState } from 'react';
import { Button, Input, Select } from '@/components/ui';
import { Drill, DrillCategory, SkillLevel, Equipment } from '@/types';

interface DrillFormProps {
  drill?: Drill;
  equipment: Equipment[];
  onSubmit: (data: Omit<Drill, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'averageRating'>) => void;
  onCancel: () => void;
}

const categoryOptions = [
  { value: 'warmup', label: 'Warmup' },
  { value: 'hitting', label: 'Hitting' },
  { value: 'fielding', label: 'Fielding' },
  { value: 'pitching', label: 'Pitching' },
  { value: 'catching', label: 'Catching' },
  { value: 'iq', label: 'Game IQ' },
  { value: 'games', label: 'Games' },
];

const skillLevelOptions = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const locationOptions = [
  { value: '', label: 'Select Location' },
  { value: 'home_plate', label: 'Home Plate' },
  { value: 'pitching_rubber', label: 'Pitching Rubber' },
  { value: '1b', label: 'First Base' },
  { value: '2b', label: 'Second Base' },
  { value: '3b', label: 'Third Base' },
  { value: 'ss', label: 'Shortstop' },
  { value: 'lf', label: 'Left Field' },
  { value: 'cf', label: 'Center Field' },
  { value: 'rf', label: 'Right Field' },
  { value: 'cage_1', label: 'Batting Cage 1' },
  { value: 'cage_2', label: 'Batting Cage 2' },
  { value: 'bullpen', label: 'Bullpen' },
  { value: 'outfield_grass', label: 'Outfield Grass' },
  { value: 'infield', label: 'Infield' },
];

export default function DrillForm({ drill, equipment, onSubmit, onCancel }: DrillFormProps) {
  const [title, setTitle] = useState(drill?.title || '');
  const [category, setCategory] = useState<DrillCategory>(drill?.category || 'warmup');
  const [description, setDescription] = useState(drill?.description || '');
  const [coachNotes, setCoachNotes] = useState(drill?.coachNotes || '');
  const [videoUrl, setVideoUrl] = useState(drill?.videoUrl || '');
  const [baseDuration, setBaseDuration] = useState(drill?.baseDuration || 10);
  const [location, setLocation] = useState(drill?.location || '');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>(drill?.skillLevel || 'beginner');
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(drill?.equipmentIds || []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      category,
      description,
      coachNotes,
      videoUrl,
      baseDuration,
      location,
      skillLevel,
      equipmentIds: selectedEquipment,
    });
  };

  const toggleEquipment = (id: string) => {
    setSelectedEquipment((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="title"
        label="Drill Name"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        placeholder="e.g., Dynamic Stretching"
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          id="category"
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value as DrillCategory)}
          options={categoryOptions}
        />

        <Input
          id="baseDuration"
          label="Duration (minutes)"
          type="number"
          min="1"
          max="120"
          value={baseDuration}
          onChange={(e) => setBaseDuration(parseInt(e.target.value) || 0)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          id="skillLevel"
          label="Skill Level"
          value={skillLevel}
          onChange={(e) => setSkillLevel(e.target.value as SkillLevel)}
          options={skillLevelOptions}
        />

        <Select
          id="location"
          label="Field Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          options={locationOptions}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Describe the drill..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Coach Notes
        </label>
        <textarea
          value={coachNotes}
          onChange={(e) => setCoachNotes(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Tips for running this drill..."
        />
      </div>

      <Input
        id="videoUrl"
        label="Video Link (Google Drive)"
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
        placeholder="https://drive.google.com/..."
      />

      {equipment.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Equipment Needed
          </label>
          <div className="flex flex-wrap gap-2">
            {equipment.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleEquipment(item.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedEquipment.includes(item.id)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{drill ? 'Update' : 'Add'} Drill</Button>
      </div>
    </form>
  );
}
