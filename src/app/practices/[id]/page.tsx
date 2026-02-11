'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { v4 as uuidv4 } from 'uuid';
import { Button, Input, Card } from '@/components/ui';
import { useFirestoreCollection } from '@/hooks/useFirestore';
import { Practice, Player, Drill, Equipment, Coach, SessionBlock, Group } from '@/types';
import TimeEngineDisplay from '@/components/practices/TimeEngine';
import AttendanceCheckIn from '@/components/practices/AttendanceCheckIn';
import GroupManager from '@/components/practices/GroupManager';
import DrillSequencer from '@/components/practices/DrillSequencer';
import RotationBuilder from '@/components/practices/RotationBuilder';
import AuthGuard from '@/components/auth/AuthGuard';

interface PracticePageProps {
  params: Promise<{ id: string }>;
}

export default function PracticePage({ params }: PracticePageProps) {
  const { id } = use(params);

  return (
    <AuthGuard>
      <PracticePageContent id={id} />
    </AuthGuard>
  );
}

function PracticePageContent({ id }: { id: string }) {
  const router = useRouter();

  const { data: players } = useFirestoreCollection<Player>('players');
  const { data: drills } = useFirestoreCollection<Drill>('drills');
  const { data: equipment } = useFirestoreCollection<Equipment>('equipment');
  const { data: coaches } = useFirestoreCollection<Coach>('coaches');

  const [practice, setPractice] = useState<Practice | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [date, setDate] = useState('');
  const [totalMinutes, setTotalMinutes] = useState(120);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [groups, setGroups] = useState<Record<string, Group>>({});
  const [sessionBlocks, setSessionBlocks] = useState<SessionBlock[]>([]);
  const [status, setStatus] = useState<'draft' | 'active' | 'completed'>('draft');
  const [showRotationBuilder, setShowRotationBuilder] = useState(false);
  const [editingBlock, setEditingBlock] = useState<SessionBlock | undefined>(undefined);

  useEffect(() => {
    const fetchPractice = async () => {
      try {
        const docRef = doc(db, 'practices', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const practiceData: Practice = {
            id: docSnap.id,
            date: data.date?.toDate() || new Date(),
            totalMinutes: data.totalMinutes || 120,
            attendance: data.attendance || {},
            groups: data.groups || {},
            sessionBlocks: data.sessionBlocks || [],
            postPracticeNotes: data.postPracticeNotes || '',
            drillRatings: data.drillRatings || {},
            status: data.status || 'draft',
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          };

          setPractice(practiceData);
          setDate(practiceData.date.toISOString().split('T')[0]);
          setTotalMinutes(practiceData.totalMinutes);
          setAttendance(practiceData.attendance);
          setGroups(practiceData.groups);
          setSessionBlocks(practiceData.sessionBlocks);
          setStatus(practiceData.status);
        } else {
          router.push('/practices');
        }
      } catch (error) {
        console.error('Error fetching practice:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPractice();
  }, [id, router]);

  const handleToggleAttendance = (playerId: string) => {
    setAttendance((prev) => ({
      ...prev,
      [playerId]: !prev[playerId],
    }));
  };

  const handleSave = async (newStatus?: 'draft' | 'active' | 'completed') => {
    setSaving(true);
    try {
      const docRef = doc(db, 'practices', id);
      await updateDoc(docRef, {
        date: Timestamp.fromDate(new Date(date)),
        totalMinutes,
        attendance,
        groups,
        sessionBlocks,
        status: newStatus || status,
        updatedAt: Timestamp.now(),
      });

      if (newStatus) {
        setStatus(newStatus);
      }

      alert('Practice saved successfully!');
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

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading practice...</p>
      </div>
    );
  }

  if (!practice) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Practice not found</p>
        <Button className="mt-4" onClick={() => router.push('/practices')}>
          Back to Practices
        </Button>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Practice: {formatDate(date)}
          </h1>
          <p className="text-gray-600 capitalize">Status: {status}</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            onClick={() => {
              const shareUrl = `${window.location.origin}/practices/${id}/coach-view`;
              navigator.clipboard.writeText(shareUrl);
              alert('Share link copied to clipboard!');
            }}
            className="text-blue-600 hover:bg-blue-50"
          >
            <svg className="w-4 h-4 mr-1.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.open(`/practices/${id}/coach-view`, '_blank')}
          >
            View Schedule
          </Button>
          <Button variant="secondary" onClick={() => router.push('/practices')} disabled={saving}>
            Back
          </Button>
          {status !== 'completed' && (
            <>
              <Button variant="secondary" onClick={() => handleSave()} disabled={saving}>
                Save
              </Button>
              {status === 'draft' && (
                <Button onClick={() => handleSave('active')} disabled={saving}>
                  Activate
                </Button>
              )}
              {status === 'active' && (
                <Button onClick={() => handleSave('completed')} disabled={saving}>
                  Mark Complete
                </Button>
              )}
            </>
          )}
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
              disabled={status === 'completed'}
            />
            <Input
              id="totalMinutes"
              label="Total Time (minutes)"
              type="number"
              min="30"
              max="300"
              value={totalMinutes}
              onChange={(e) => setTotalMinutes(parseInt(e.target.value) || 120)}
              disabled={status === 'completed'}
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
          onToggle={status === 'completed' ? () => {} : handleToggleAttendance}
        />
      </div>

      {/* Groups */}
      <div className="mb-6">
        <GroupManager
          players={players}
          attendance={attendance}
          groups={groups}
          onGroupsChange={status === 'completed' ? () => {} : setGroups}
        />
      </div>

      {/* Drill Sequencer */}
      {status !== 'completed' ? (
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
      ) : (
        <Card>
          <h3 className="font-medium text-gray-900 mb-3">Practice Schedule</h3>
          <div className="space-y-2">
            {sessionBlocks.map((block, index) => {
              const drill = block.drillId ? drills.find((d) => d.id === block.drillId) : undefined;
              const isWaterBreak = block.notes === 'Water Break';
              return (
                <div key={block.id} className={`p-3 rounded-lg ${isWaterBreak ? 'bg-blue-50' : 'bg-gray-50'}`}>
                  <span className="text-gray-500 mr-2">{index + 1}.</span>
                  <span className="font-medium">
                    {isWaterBreak ? '💧 Water Break' : block.type === 'rotation' ? 'Rotation' : drill?.title || 'Unknown'}
                  </span>
                  <span className="text-gray-500 ml-2">({block.duration || 0} min)</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

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
