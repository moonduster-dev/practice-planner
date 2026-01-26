'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/navigation';
import { Button, Input, Card } from '@/components/ui';
import { useFirestoreCollection } from '@/hooks/useFirestore';
import { Practice, Player, Drill, Equipment, Coach, SessionBlock, Group } from '@/types';
import TimeEngineDisplay from '@/components/practices/TimeEngine';
import AttendanceCheckIn from '@/components/practices/AttendanceCheckIn';
import GroupManager from '@/components/practices/GroupManager';
import DrillSequencer from '@/components/practices/DrillSequencer';
import RotationBuilder from '@/components/practices/RotationBuilder';
import AuthGuard from '@/components/auth/AuthGuard';

export default function NewPracticePage() {
  return (
    <AuthGuard>
      <NewPracticePageContent />
    </AuthGuard>
  );
}

function NewPracticePageContent() {
  const router = useRouter();

  const { add: addPractice } = useFirestoreCollection<Practice>('practices');
  const { data: players } = useFirestoreCollection<Player>('players');
  const { data: drills } = useFirestoreCollection<Drill>('drills');
  const { data: equipment } = useFirestoreCollection<Equipment>('equipment');
  const { data: coaches } = useFirestoreCollection<Coach>('coaches');

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalMinutes, setTotalMinutes] = useState(120);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [groups, setGroups] = useState<Record<string, Group>>({});
  const [sessionBlocks, setSessionBlocks] = useState<SessionBlock[]>([]);
  const [saving, setSaving] = useState(false);
  const [showRotationBuilder, setShowRotationBuilder] = useState(false);
  const [editingBlock, setEditingBlock] = useState<SessionBlock | undefined>(undefined);

  const handleToggleAttendance = (playerId: string) => {
    setAttendance((prev) => ({
      ...prev,
      [playerId]: !prev[playerId],
    }));
  };

  const handleSave = async (status: 'draft' | 'active') => {
    setSaving(true);
    try {
      const practiceData = {
        date: new Date(date),
        totalMinutes,
        attendance,
        groups,
        sessionBlocks,
        postPracticeNotes: '',
        drillRatings: {},
        status,
      };

      const id = await addPractice(practiceData);
      router.push(`/practices/${id}`);
    } catch (error) {
      console.error('Error saving practice:', error);
      alert('Failed to save practice');
    } finally {
      setSaving(false);
    }
  };

  const handleAddRotation = () => {
    setEditingBlock(undefined);
    setShowRotationBuilder(true);
  };

  const handleEditRotation = (block: SessionBlock) => {
    setEditingBlock(block);
    setShowRotationBuilder(true);
  };

  const handleSaveRotation = (block: SessionBlock) => {
    if (editingBlock) {
      // Update existing block
      setSessionBlocks(
        sessionBlocks.map((b) => (b.id === block.id ? { ...block, order: b.order } : b))
      );
    } else {
      // Add new block
      setSessionBlocks([...sessionBlocks, { ...block, order: sessionBlocks.length }]);
    }
    setEditingBlock(undefined);
  };

  const handleCloseRotationBuilder = () => {
    setShowRotationBuilder(false);
    setEditingBlock(undefined);
  };

  const handleAddWaterBreak = () => {
    const waterBreakBlock: SessionBlock = {
      id: uuidv4(),
      type: 'single',
      order: sessionBlocks.length,
      drillId: '', // No drill ID for water break
      duration: 5,
      notes: 'Water Break',
    };
    setSessionBlocks([...sessionBlocks, waterBreakBlock]);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Practice</h1>
          <p className="text-gray-600">Plan your practice session</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="secondary" onClick={() => router.back()} disabled={saving}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={() => handleSave('draft')} disabled={saving}>
            Save Draft
          </Button>
          <Button onClick={() => handleSave('active')} disabled={saving}>
            {saving ? 'Saving...' : 'Save & Activate'}
          </Button>
        </div>
      </div>

      {/* Practice Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <h3 className="font-medium text-gray-900 mb-3">Practice Details</h3>
          <div className="space-y-4">
            <Input
              id="date"
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <Input
              id="totalMinutes"
              label="Total Time (minutes)"
              type="number"
              min="30"
              max="300"
              value={totalMinutes}
              onChange={(e) => setTotalMinutes(parseInt(e.target.value) || 120)}
            />
          </div>
        </Card>

        <TimeEngineDisplay
          totalMinutes={totalMinutes}
          sessionBlocks={sessionBlocks}
          autoWaterBreaks={true}
        />

        <AttendanceCheckIn
          players={players}
          attendance={attendance}
          onToggle={handleToggleAttendance}
        />
      </div>

      {/* Groups */}
      <div className="mb-6">
        <GroupManager
          players={players}
          attendance={attendance}
          groups={groups}
          drillCount={sessionBlocks.filter((b) => b.type === 'rotation').length}
          onGroupsChange={setGroups}
        />
      </div>

      {/* Drill Sequencer */}
      <DrillSequencer
        sessionBlocks={sessionBlocks}
        drills={drills}
        coaches={coaches}
        equipment={equipment}
        groups={groups}
        attendance={attendance}
        onBlocksChange={setSessionBlocks}
        onAddRotation={handleAddRotation}
        onEditRotation={handleEditRotation}
        onAddWaterBreak={handleAddWaterBreak}
      />

      {/* Rotation Builder Modal */}
      <RotationBuilder
        isOpen={showRotationBuilder}
        onClose={handleCloseRotationBuilder}
        drills={drills}
        coaches={coaches}
        groups={groups}
        onSave={handleSaveRotation}
        editingBlock={editingBlock}
      />
    </div>
  );
}
