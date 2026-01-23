// Player Types
export type PlayerStatus = 'active' | 'injured';

export interface Player {
  id: string;
  name: string;
  jerseyNumber: string;
  position: string;
  status: PlayerStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Drill Types
export type DrillCategory = 'warmup' | 'hitting' | 'fielding' | 'pitching' | 'catching' | 'iq' | 'games';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export interface Drill {
  id: string;
  title: string;
  category: DrillCategory;
  description: string;
  coachNotes: string;
  videoUrl: string;
  equipmentIds: string[];
  baseDuration: number; // minutes
  location: string;
  skillLevel: SkillLevel;
  usageCount: number;
  averageRating: number;
  createdAt: Date;
  updatedAt: Date;
}

// Equipment Types
export interface Equipment {
  id: string;
  name: string;
  quantity: number;
  createdAt: Date;
}

// Coach Types
export interface Coach {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

// Practice Types
export type PracticeStatus = 'draft' | 'active' | 'completed';
export type SessionBlockType = 'single' | 'rotation';

export interface Group {
  id: string;
  name: string;
  playerIds: string[];
}

export interface RotationDrill {
  drillId: string; // Primary drill (for backwards compatibility)
  drillIds?: string[]; // All drills in this station
  drillDurations?: number[]; // Duration for each drill
  stationName?: string; // Custom name for the station
  duration: number; // Total duration for this station
  coachId: string; // Primary coach (for backwards compatibility)
  coachIds?: string[]; // All coaches assigned to this station
  groupIds: string[];
  equipmentIds: string[];
  stationGroups?: Record<string, Group>; // Per-station group overrides (different partner compositions)
}

export interface SessionBlock {
  id: string;
  type: SessionBlockType;
  order: number;
  // For single drill
  drillId?: string;
  duration?: number;
  coachId?: string;
  coachIds?: string[]; // Multiple coaches for single drill
  equipmentIds?: string[];
  notes?: string;
  groupIds?: string[]; // Groups/partners assigned to this drill
  drillGroups?: Record<string, Group>; // Per-drill group overrides (different partner compositions)
  // For rotation
  rotationDrills?: RotationDrill[];
  simultaneousStations?: boolean; // If true, all stations run at same time (time = max station). If false, groups rotate through (time = sum of stations)
}

export interface DrillRating {
  rating: number;
  notes: string;
}

export interface Practice {
  id: string;
  date: Date;
  totalMinutes: number;
  attendance: Record<string, boolean>;
  groups: Record<string, Group>;
  sessionBlocks: SessionBlock[];
  postPracticeNotes: string;
  drillRatings: Record<string, DrillRating>;
  status: PracticeStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Drill Metrics Types
export interface DrillUsageEntry {
  practiceId: string;
  date: Date;
  rating: number;
  notes: string;
}

export interface DrillMetrics {
  drillId: string;
  totalUsageCount: number;
  usageHistory: DrillUsageEntry[];
}

// Time Engine Types
export interface TimeEngineResult {
  totalMinutes: number;
  usedMinutes: number;
  remainingMinutes: number;
  isOverLimit: boolean;
  waterBreaksInserted: number;
}

// Rotation Calculator Types
export interface RotationSlot {
  groupId: string;
  drillId: string;
  startTime: number;
  endTime: number;
  coachId: string;
}

export interface RotationResult {
  totalSessionTime: number;
  timePerGroup: number;
  rotationSchedule: RotationSlot[];
}

// Group Assignment Types
export interface GroupAssignment {
  groupId: string;
  drillId: string;
  rotationOrder: number;
}
