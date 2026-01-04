import type { Achievement, AchievementType, AttributeType, DailySnapshot, Statistics } from '@/types';

export function calculateStatistics(snapshots: DailySnapshot[]): Statistics {
  if (snapshots.length === 0) {
    return {
      totalDays: 0,
      currentStreak: 0,
      longestStreak: 0,
      averageIntegrity: 0,
      averageEnergy: 0,
      totalTasksCompleted: 0,
      attributeGrowth: {
        strength: 0,
        intellect: 0,
        create: 0,
        mind: 0,
        work: 0,
        others: 0,
      },
    };
  }

  const sortedSnapshots = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  const firstSnapshot = sortedSnapshots[0];
  const latestSnapshot = sortedSnapshots[sortedSnapshots.length - 1];

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  for (let i = sortedSnapshots.length - 1; i >= 0; i--) {
    const snapshot = sortedSnapshots[i];
    const completionRate = snapshot.tasksTotal > 0 ? snapshot.tasksCompleted / snapshot.tasksTotal : 0;
    
    if (completionRate >= 0.8) {
      if (i === sortedSnapshots.length - 1) {
        currentStreak++;
      }
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  const totalIntegrity = sortedSnapshots.reduce((sum, s) => sum + s.integrity, 0);
  const totalEnergy = sortedSnapshots.reduce((sum, s) => sum + s.energy, 0);
  const totalTasksCompleted = sortedSnapshots.reduce((sum, s) => sum + s.tasksCompleted, 0);

  const bestDay = sortedSnapshots.reduce((best, current) => {
    return current.tasksCompleted > (best?.tasksCompleted || 0) ? current : best;
  }, sortedSnapshots[0]);

  const attributeGrowth: Record<AttributeType, number> = {
    strength: Math.max(0, (latestSnapshot.attributes.strength?.level || 0) - (firstSnapshot.attributes.strength?.level || 0)),
    intellect: Math.max(0, (latestSnapshot.attributes.intellect?.level || 0) - (firstSnapshot.attributes.intellect?.level || 0)),
    create: Math.max(0, (latestSnapshot.attributes.create?.level || 0) - (firstSnapshot.attributes.create?.level || 0)),
    mind: Math.max(0, (latestSnapshot.attributes.mind?.level || 0) - (firstSnapshot.attributes.mind?.level || 0)),
    work: Math.max(0, (latestSnapshot.attributes.work?.level || 0) - (firstSnapshot.attributes.work?.level || 0)),
    others: Math.max(0, (latestSnapshot.attributes.others?.level || 0) - (firstSnapshot.attributes.others?.level || 0)),
  };

  return {
    totalDays: sortedSnapshots.length,
    currentStreak,
    longestStreak,
    averageIntegrity: totalIntegrity / sortedSnapshots.length,
    averageEnergy: totalEnergy / sortedSnapshots.length,
    totalTasksCompleted,
    bestDay: bestDay ? {
      date: bestDay.date,
      tasksCompleted: bestDay.tasksCompleted,
    } : undefined,
    attributeGrowth,
  };
}

export function calculateAchievements(
  snapshots: DailySnapshot[],
  currentEvolutionStage: number,
  currentAttributes: Record<AttributeType, { level: number }>
): Achievement[] {
  const stats = calculateStatistics(snapshots);
  const achievements: Achievement[] = [];

  const achievementDefinitions: Record<AchievementType, Omit<Achievement, 'unlocked' | 'unlockedAt'>> = {
    first_day: {
      id: 'first_day',
      name: 'First Steps',
      description: 'Complete your first day',
    },
    week_streak: {
      id: 'week_streak',
      name: 'Week Warrior',
      description: 'Maintain a 7-day streak',
    },
    month_streak: {
      id: 'month_streak',
      name: 'Month Master',
      description: 'Maintain a 30-day streak',
    },
    level_10: {
      id: 'level_10',
      name: 'Decade',
      description: 'Reach level 10 in any attribute',
    },
    level_25: {
      id: 'level_25',
      name: 'Quarter Century',
      description: 'Reach level 25 in any attribute',
    },
    level_50: {
      id: 'level_50',
      name: 'Half Century',
      description: 'Reach level 50 in any attribute',
    },
    level_100: {
      id: 'level_100',
      name: 'Centurion',
      description: 'Reach level 100 in any attribute',
    },
    perfectionist: {
      id: 'perfectionist',
      name: 'Perfectionist',
      description: 'Complete all tasks in a day',
    },
    task_master: {
      id: 'task_master',
      name: 'Task Master',
      description: 'Complete 1000 tasks total',
    },
    evolution_5: {
      id: 'evolution_5',
      name: 'Evolved',
      description: 'Reach Evolution Stage 5',
    },
    evolution_10: {
      id: 'evolution_10',
      name: 'Transcendent',
      description: 'Reach Evolution Stage 10',
    },
  };

  Object.values(achievementDefinitions).forEach((def) => {
    let unlocked = false;
    let unlockedAt: string | undefined;

    switch (def.id) {
      case 'first_day':
        unlocked = stats.totalDays >= 1;
        if (unlocked && snapshots.length > 0) {
          unlockedAt = snapshots[0].date;
        }
        break;
      case 'week_streak':
        unlocked = stats.longestStreak >= 7;
        break;
      case 'month_streak':
        unlocked = stats.longestStreak >= 30;
        break;
      case 'level_10':
        unlocked = Object.values(currentAttributes).some(attr => attr.level >= 10);
        break;
      case 'level_25':
        unlocked = Object.values(currentAttributes).some(attr => attr.level >= 25);
        break;
      case 'level_50':
        unlocked = Object.values(currentAttributes).some(attr => attr.level >= 50);
        break;
      case 'level_100':
        unlocked = Object.values(currentAttributes).some(attr => attr.level >= 100);
        break;
      case 'perfectionist':
        unlocked = snapshots.some(s => s.tasksTotal > 0 && s.tasksCompleted === s.tasksTotal);
        if (unlocked) {
          const perfectDay = snapshots.find(s => s.tasksTotal > 0 && s.tasksCompleted === s.tasksTotal);
          unlockedAt = perfectDay?.date;
        }
        break;
      case 'task_master':
        unlocked = stats.totalTasksCompleted >= 1000;
        break;
      case 'evolution_5':
        unlocked = currentEvolutionStage >= 5;
        break;
      case 'evolution_10':
        unlocked = currentEvolutionStage >= 10;
        break;
    }

    achievements.push({
      ...def,
      unlocked,
      unlockedAt,
    });
  });

  return achievements.sort((a, b) => {
    if (a.unlocked && !b.unlocked) return -1;
    if (!a.unlocked && b.unlocked) return 1;
    return 0;
  });
}

