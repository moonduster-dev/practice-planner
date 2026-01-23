import { Player, Group, RotationDrill, GroupAssignment } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const GROUP_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

/**
 * Creates groups from present players
 * Distributes players as evenly as possible across groups
 */
export function createGroups(
  presentPlayers: Player[],
  numberOfGroups: number
): Group[] {
  if (numberOfGroups <= 0 || presentPlayers.length === 0) {
    return [];
  }

  // Cap the number of groups to the number of players
  const actualGroups = Math.min(numberOfGroups, presentPlayers.length);

  // Shuffle players for random distribution
  const shuffled = [...presentPlayers].sort(() => Math.random() - 0.5);

  // Initialize groups
  const groups: Group[] = Array.from({ length: actualGroups }, (_, i) => ({
    id: uuidv4(),
    name: `Group ${GROUP_NAMES[i] || i + 1}`,
    playerIds: [],
  }));

  // Distribute players round-robin style
  shuffled.forEach((player, index) => {
    const groupIndex = index % actualGroups;
    groups[groupIndex].playerIds.push(player.id);
  });

  return groups;
}

/**
 * Creates partner pairs from present players
 * Groups of 2, with one group of 3 if odd number of players
 */
export function createPartners(presentPlayers: Player[]): Group[] {
  if (presentPlayers.length === 0) {
    return [];
  }

  // Shuffle players for random pairing
  const shuffled = [...presentPlayers].sort(() => Math.random() - 0.5);

  const partners: Group[] = [];
  const isOdd = shuffled.length % 2 === 1;

  // Create pairs of 2
  for (let i = 0; i < shuffled.length; i += 2) {
    // Skip last player if odd - they'll be added to the last pair
    if (isOdd && i === shuffled.length - 1) {
      break;
    }

    const playerIds: string[] = [shuffled[i].id];

    // Add second player
    if (i + 1 < shuffled.length) {
      playerIds.push(shuffled[i + 1].id);
    }

    partners.push({
      id: uuidv4(),
      name: `Partners ${partners.length + 1}`,
      playerIds,
    });
  }

  // If odd number, add the last player to the last pair (making it a trio)
  if (isOdd && partners.length > 0) {
    partners[partners.length - 1].playerIds.push(shuffled[shuffled.length - 1].id);
  }

  return partners;
}

/**
 * Gets present players from attendance record
 */
export function getPresentPlayers(
  allPlayers: Player[],
  attendance: Record<string, boolean>
): Player[] {
  return allPlayers.filter(
    (player) => attendance[player.id] === true && player.status === 'active'
  );
}

/**
 * Assigns groups to drills in a rotation
 * Each group starts at a different drill and rotates through all
 */
export function assignGroupsToDrills(
  groups: Group[],
  rotationDrills: RotationDrill[]
): GroupAssignment[] {
  const assignments: GroupAssignment[] = [];

  groups.forEach((group, groupIndex) => {
    rotationDrills.forEach((drill, drillIndex) => {
      // Calculate rotation order - each group starts at a different drill
      const rotationOrder = (drillIndex - groupIndex + rotationDrills.length) % rotationDrills.length;

      assignments.push({
        groupId: group.id,
        drillId: drill.drillId,
        rotationOrder,
      });
    });
  });

  return assignments;
}

/**
 * Balances groups by player count
 * Moves players from larger groups to smaller ones
 */
export function balanceGroups(groups: Group[]): Group[] {
  const totalPlayers = groups.reduce((sum, g) => sum + g.playerIds.length, 0);
  const targetSize = Math.floor(totalPlayers / groups.length);
  const remainder = totalPlayers % groups.length;

  // Sort groups by size (largest first)
  const sorted = [...groups].sort((a, b) => b.playerIds.length - a.playerIds.length);

  // Collect all player IDs
  const allPlayerIds = sorted.flatMap((g) => g.playerIds);

  // Redistribute
  let playerIndex = 0;
  return sorted.map((group, index) => {
    const size = index < remainder ? targetSize + 1 : targetSize;
    const playerIds = allPlayerIds.slice(playerIndex, playerIndex + size);
    playerIndex += size;

    return {
      ...group,
      playerIds,
    };
  });
}

/**
 * Suggests optimal number of groups based on player count and drill count
 */
export function suggestGroupCount(
  playerCount: number,
  drillCount: number
): number {
  if (playerCount === 0) return 0;
  if (drillCount === 0) return 1;

  // Ideal group size is 3-5 players
  const minGroupSize = 3;
  const maxGroupSize = 5;

  // Calculate possible group counts
  const minGroups = Math.ceil(playerCount / maxGroupSize);
  const maxGroups = Math.floor(playerCount / minGroupSize);

  // Prefer number of groups that matches drill count
  if (drillCount >= minGroups && drillCount <= maxGroups) {
    return drillCount;
  }

  // Otherwise, aim for 4-player groups
  return Math.max(1, Math.round(playerCount / 4));
}

/**
 * Gets group statistics
 */
export function getGroupStats(groups: Group[]): {
  totalPlayers: number;
  averageSize: number;
  minSize: number;
  maxSize: number;
} {
  if (groups.length === 0) {
    return { totalPlayers: 0, averageSize: 0, minSize: 0, maxSize: 0 };
  }

  const sizes = groups.map((g) => g.playerIds.length);
  const totalPlayers = sizes.reduce((sum, s) => sum + s, 0);

  return {
    totalPlayers,
    averageSize: totalPlayers / groups.length,
    minSize: Math.min(...sizes),
    maxSize: Math.max(...sizes),
  };
}

/**
 * Moves a player from one group to another
 */
export function movePlayerBetweenGroups(
  groups: Group[],
  playerId: string,
  fromGroupId: string,
  toGroupId: string
): Group[] {
  return groups.map((group) => {
    if (group.id === fromGroupId) {
      return {
        ...group,
        playerIds: group.playerIds.filter((id) => id !== playerId),
      };
    }
    if (group.id === toGroupId) {
      return {
        ...group,
        playerIds: [...group.playerIds, playerId],
      };
    }
    return group;
  });
}
