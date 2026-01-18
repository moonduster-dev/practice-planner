'use client';

import { Drill, Equipment } from '@/types';
import { Button, Card, Badge } from '@/components/ui';

interface DrillCardProps {
  drill: Drill;
  equipment: Equipment[];
  onEdit: (drill: Drill) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}

const categoryColors: Record<string, string> = {
  warmup: 'bg-orange-100 text-orange-800',
  hitting: 'bg-red-100 text-red-800',
  fielding: 'bg-green-100 text-green-800',
  pitching: 'bg-blue-100 text-blue-800',
  catching: 'bg-purple-100 text-purple-800',
  iq: 'bg-yellow-100 text-yellow-800',
  games: 'bg-pink-100 text-pink-800',
};

export default function DrillCard({
  drill,
  equipment,
  onEdit,
  onDelete,
  compact = false,
}: DrillCardProps) {
  const drillEquipment = equipment.filter((e) => drill.equipmentIds.includes(e.id));

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center space-x-3">
          <span className={`px-2 py-1 rounded text-xs font-medium ${categoryColors[drill.category]}`}>
            {drill.category}
          </span>
          <span className="font-medium text-gray-900">{drill.title}</span>
          <span className="text-sm text-gray-500">{drill.baseDuration}m</span>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${categoryColors[drill.category]}`}>
              {drill.category}
            </span>
            <Badge variant="default">{drill.baseDuration} min</Badge>
            <Badge variant={
              drill.skillLevel === 'beginner' ? 'success' :
              drill.skillLevel === 'intermediate' ? 'warning' : 'danger'
            }>
              {drill.skillLevel}
            </Badge>
          </div>

          <h3 className="text-lg font-semibold text-gray-900">{drill.title}</h3>

          {drill.description && (
            <p className="text-gray-600 mt-1 text-sm">{drill.description}</p>
          )}

          {drill.coachNotes && (
            <p className="text-gray-500 mt-2 text-sm italic">
              Coach notes: {drill.coachNotes}
            </p>
          )}

          {drill.location && (
            <p className="text-gray-500 mt-1 text-sm">
              Location: {drill.location.replace(/_/g, ' ')}
            </p>
          )}

          {drillEquipment.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {drillEquipment.map((item) => (
                <span
                  key={item.id}
                  className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600"
                >
                  {item.name}
                </span>
              ))}
            </div>
          )}

          {drill.videoUrl && (
            <a
              href={drill.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center mt-3 text-sm text-blue-600 hover:text-blue-800"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Watch Video
            </a>
          )}

          {drill.usageCount > 0 && (
            <p className="text-gray-400 mt-2 text-xs">
              Used {drill.usageCount} times
              {drill.averageRating > 0 && ` | Avg rating: ${drill.averageRating.toFixed(1)}/5`}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-2 ml-4">
          <Button variant="ghost" size="sm" onClick={() => onEdit(drill)}>
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(drill.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
}
