import { Group, RotationDrill, RotationResult, RotationSlot } from '@/types';

/**
 * Calculates rotation timing and scheduling
 *
 * Example: 5 drills at 2 minutes each for 4 groups
 * - Time per group = 5 drills × 2 mins = 10 mins
 * - Total session time = 10 mins (all groups rotate simultaneously)
 * - Each group goes through all 5 drills
 */
export function calculateRotation(
  drills: RotationDrill[],
  groups: Group[]
): RotationResult {
  if (drills.length === 0 || groups.length === 0) {
    return {
      totalSessionTime: 0,
      timePerGroup: 0,
      rotationSchedule: [],
    };
  }

  // Calculate time per group (sum of all drill durations)
  const timePerGroup = drills.reduce((sum, drill) => sum + drill.duration, 0);

  // Total session time equals time per group since all rotate simultaneously
  const totalSessionTime = timePerGroup;

  // Generate the rotation schedule
  const rotationSchedule: RotationSlot[] = [];

  // For each group, create their rotation through all drills
  groups.forEach((group, groupIndex) => {
    let currentTime = 0;

    drills.forEach((drill, drillIndex) => {
      // Calculate which drill this group starts at (offset by group index)
      const startingDrillIndex = (drillIndex + groupIndex) % drills.length;
      const actualDrill = drills[startingDrillIndex];

      rotationSchedule.push({
        groupId: group.id,
        drillId: actualDrill.drillId,
        startTime: currentTime,
        endTime: currentTime + drill.duration,
        coachId: actualDrill.coachId,
      });

      currentTime += drill.duration;
    });
  });

  return {
    totalSessionTime,
    timePerGroup,
    rotationSchedule,
  };
}

/**
 * Gets what each group is doing at a specific time
 */
export function getGroupsAtTime(
  rotationSchedule: RotationSlot[],
  timeMinutes: number
): Map<string, RotationSlot> {
  const groupActivities = new Map<string, RotationSlot>();

  rotationSchedule.forEach((slot) => {
    if (timeMinutes >= slot.startTime && timeMinutes < slot.endTime) {
      groupActivities.set(slot.groupId, slot);
    }
  });

  return groupActivities;
}

/**
 * Validates a rotation setup
 * Returns array of issues found
 */
export function validateRotation(
  drills: RotationDrill[],
  groups: Group[]
): string[] {
  const issues: string[] = [];

  if (drills.length === 0) {
    issues.push('No drills assigned to rotation');
  }

  if (groups.length === 0) {
    issues.push('No groups created for rotation');
  }

  // Check if there are enough drills for the number of groups
  if (drills.length < groups.length) {
    issues.push(`Not enough drills (${drills.length}) for groups (${groups.length}). Add more drills or reduce groups.`);
  }

  // Check for drills without coaches
  const drillsWithoutCoach = drills.filter((d) => !d.coachId);
  if (drillsWithoutCoach.length > 0) {
    issues.push(`${drillsWithoutCoach.length} drill(s) have no coach assigned`);
  }

  // Check for drills with 0 duration
  const zeroDurationDrills = drills.filter((d) => d.duration <= 0);
  if (zeroDurationDrills.length > 0) {
    issues.push(`${zeroDurationDrills.length} drill(s) have no duration set`);
  }

  return issues;
}

/**
 * Generates a printable rotation matrix
 * Rows = time slots, Columns = groups
 */
export function generateRotationMatrix(
  drills: RotationDrill[],
  groups: Group[],
  drillTitles: Map<string, string>
): string[][] {
  const result = calculateRotation(drills, groups);
  const matrix: string[][] = [];

  // Header row with group names
  const headerRow = ['Time', ...groups.map((g) => g.name)];
  matrix.push(headerRow);

  // Create time slots
  let currentTime = 0;
  drills.forEach((drill) => {
    const row: string[] = [`${currentTime}-${currentTime + drill.duration}m`];

    groups.forEach((group) => {
      const slot = result.rotationSchedule.find(
        (s) => s.groupId === group.id && s.startTime === currentTime
      );
      if (slot) {
        row.push(drillTitles.get(slot.drillId) || 'Unknown');
      } else {
        row.push('-');
      }
    });

    matrix.push(row);
    currentTime += drill.duration;
  });

  return matrix;
}
