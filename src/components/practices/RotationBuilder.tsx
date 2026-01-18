'use client';

import { useState } from 'react';
import { Button, Card, Select, Badge, Modal } from '@/components/ui';
import { Drill, Coach, Group, RotationDrill, SessionBlock } from '@/types';
import { calculateRotation, validateRotation, generateRotationMatrix } from '@/lib/rotationCalculator';
import { v4 as uuidv4 } from 'uuid';

interface RotationBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  drills: Drill[];
  coaches: Coach[];
  groups: Record<string, Group>;
  onSave: (block: SessionBlock) => void;
}

interface RotationDrillEntry {
  drillId: string;
  duration: number;
  coachId: string;
}

export default function RotationBuilder({
  isOpen,
  onClose,
  drills,
  coaches,
  groups,
  onSave,
}: RotationBuilderProps) {
  const [rotationDrills, setRotationDrills] = useState<RotationDrillEntry[]>([]);
  const groupArray = Object.values(groups);

  const handleAddDrill = () => {
    if (drills.length === 0) return;
    setRotationDrills([
      ...rotationDrills,
      {
        drillId: drills[0].id,
        duration: drills[0].baseDuration,
        coachId: coaches[0]?.id || '',
      },
    ]);
  };

  const handleRemoveDrill = (index: number) => {
    setRotationDrills(rotationDrills.filter((_, i) => i !== index));
  };

  const handleDrillChange = (index: number, field: keyof RotationDrillEntry, value: string | number) => {
    const updated = [...rotationDrills];
    if (field === 'drillId') {
      const drill = drills.find((d) => d.id === value);
      updated[index] = {
        ...updated[index],
        drillId: value as string,
        duration: drill?.baseDuration || updated[index].duration,
      };
    } else if (field === 'duration') {
      updated[index] = { ...updated[index], duration: value as number };
    } else {
      updated[index] = { ...updated[index], coachId: value as string };
    }
    setRotationDrills(updated);
  };

  const rotationDrillsForCalc: RotationDrill[] = rotationDrills.map((rd) => ({
    drillId: rd.drillId,
    duration: rd.duration,
    coachId: rd.coachId,
    groupIds: groupArray.map((g) => g.id),
    equipmentIds: [],
  }));

  const validationIssues = validateRotation(rotationDrillsForCalc, groupArray);
  const rotationResult = calculateRotation(rotationDrillsForCalc, groupArray);

  const drillTitles = new Map(drills.map((d) => [d.id, d.title]));
  const rotationMatrix = generateRotationMatrix(rotationDrillsForCalc, groupArray, drillTitles);

  const handleSave = () => {
    if (validationIssues.length > 0) {
      alert('Please fix validation issues before saving');
      return;
    }

    const block: SessionBlock = {
      id: uuidv4(),
      type: 'rotation',
      order: 0,
      rotationDrills: rotationDrillsForCalc,
    };

    onSave(block);
    setRotationDrills([]);
    onClose();
  };

  const handleCancel = () => {
    setRotationDrills([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title="Build Rotation" size="xl">
      <div className="space-y-6">
        {/* Info */}
        {groupArray.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              Create groups first (in the Groups section) before building a rotation.
            </p>
          </div>
        )}

        {/* Drills in Rotation */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Drills in Rotation</h4>
            <Button size="sm" onClick={handleAddDrill} disabled={drills.length === 0}>
              + Add Drill
            </Button>
          </div>

          {rotationDrills.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No drills added. Click &quot;Add Drill&quot; to start building.
            </p>
          ) : (
            <div className="space-y-3">
              {rotationDrills.map((rd, index) => (
                <Card key={index} padding="sm" className="bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-500 w-6">
                      {index + 1}.
                    </span>

                    <select
                      value={rd.drillId}
                      onChange={(e) => handleDrillChange(index, 'drillId', e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm"
                    >
                      {drills.map((drill) => (
                        <option key={drill.id} value={drill.id}>
                          {drill.title} ({drill.category})
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={rd.duration}
                      onChange={(e) => handleDrillChange(index, 'duration', parseInt(e.target.value) || 1)}
                      className="w-16 px-2 py-1.5 border border-gray-300 rounded text-sm"
                    />
                    <span className="text-xs text-gray-500">min</span>

                    <select
                      value={rd.coachId}
                      onChange={(e) => handleDrillChange(index, 'coachId', e.target.value)}
                      className="w-32 px-2 py-1.5 border border-gray-300 rounded text-sm"
                    >
                      <option value="">No Coach</option>
                      {coaches.map((coach) => (
                        <option key={coach.id} value={coach.id}>
                          {coach.name}
                        </option>
                      ))}
                    </select>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveDrill(index)}
                      className="text-red-600"
                    >
                      Remove
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Validation Issues */}
        {validationIssues.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <h4 className="font-medium text-red-800 mb-2">Issues to fix:</h4>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
              {validationIssues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Rotation Summary */}
        {rotationDrills.length > 0 && groupArray.length > 0 && validationIssues.length === 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Rotation Preview</h4>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <Card padding="sm">
                <div className="text-2xl font-bold text-blue-600">
                  {rotationResult.totalSessionTime} min
                </div>
                <div className="text-sm text-gray-500">Total Session Time</div>
              </Card>
              <Card padding="sm">
                <div className="text-2xl font-bold text-green-600">
                  {rotationResult.timePerGroup} min
                </div>
                <div className="text-sm text-gray-500">Time Per Group</div>
              </Card>
            </div>

            {/* Rotation Matrix */}
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    {rotationMatrix[0]?.map((header, index) => (
                      <th
                        key={index}
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {rotationMatrix.slice(1).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className={`px-3 py-2 text-sm ${
                            cellIndex === 0 ? 'font-medium text-gray-900' : 'text-gray-600'
                          }`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={rotationDrills.length === 0 || validationIssues.length > 0}
          >
            Add Rotation to Practice
          </Button>
        </div>
      </div>
    </Modal>
  );
}
