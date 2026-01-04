import type { Attribute, Task, AttributeType } from '@/types';

export const INITIAL_ATTRS: Record<AttributeType, Attribute> = {
  strength: { level: 1, currentXP: 0, xpToNextLevel: 100 },
  intellect: { level: 1, currentXP: 0, xpToNextLevel: 100 },
  create:    { level: 1, currentXP: 0, xpToNextLevel: 100 },
  mind:      { level: 1, currentXP: 0, xpToNextLevel: 100 },
  work:      { level: 1, currentXP: 0, xpToNextLevel: 100 },
  others:    { level: 1, currentXP: 0, xpToNextLevel: 100 },
};

// Default Iron Rules (2.5 XP each)
export const DEFAULT_IRON_RULES: Task[] = [
  { id: 'iron-1', text: 'Sleep 6hr+', type: 'strength', xpValue: 2.5, completed: false, isSystem: true },
  { id: 'iron-2', text: 'Drink 3L Water', type: 'strength', xpValue: 2.5, completed: false, isSystem: true },
  { id: 'iron-3', text: 'Clean Room', type: 'mind', xpValue: 2.5, completed: false, isSystem: true },
  { id: 'iron-4', text: 'Shower / Groom', type: 'strength', xpValue: 2.5, completed: false, isSystem: true },
];

