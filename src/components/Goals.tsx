import { useState, useEffect } from 'react';
import { Target, Plus, X, CheckCircle2, Circle, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { haptics } from '@/lib/haptics';
import { useVectorStore } from '@/store/useVectorStore';
import type { AttributeType, GoalType, GoalTargetType } from '@/types';

export function Goals() {
  const { goals, addGoal, removeGoal, updateGoalProgress, attributes, integrity, evolutionStage } = useVectorStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'daily' as GoalType,
    targetType: 'attribute_level' as GoalTargetType,
    targetValue: 10,
    attributeType: 'strength' as AttributeType,
  });

  useEffect(() => {
    updateGoalProgress();
  }, [attributes, integrity, evolutionStage, updateGoalProgress]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const today = new Date();
    let endDate: string | undefined;

    if (formData.type === 'daily') {
      endDate = new Date(today.setHours(23, 59, 59, 999)).toISOString();
    } else if (formData.type === 'weekly') {
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() + (7 - today.getDay()));
      endDate = new Date(weekEnd.setHours(23, 59, 59, 999)).toISOString();
    } else if (formData.type === 'monthly') {
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endDate = new Date(monthEnd.setHours(23, 59, 59, 999)).toISOString();
    }

    addGoal({
      title: formData.title,
      description: formData.description,
      type: formData.type,
      targetType: formData.targetType,
      targetValue: formData.targetValue,
      attributeType: formData.targetType === 'attribute_level' ? formData.attributeType : undefined,
      startDate: new Date().toISOString(),
      endDate,
    });

    haptics.medium();
    setFormData({
      title: '',
      description: '',
      type: 'daily',
      targetType: 'attribute_level',
      targetValue: 10,
      attributeType: 'strength',
    });
    setShowAddForm(false);
  };

  const getGoalTypeLabel = (type: GoalType) => {
    switch (type) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
    }
  };

  const getTargetTypeLabel = (type: GoalTargetType) => {
    switch (type) {
      case 'attribute_level': return 'Attribute Level';
      case 'tasks_completed': return 'Tasks Completed';
      case 'integrity': return 'Integrity';
      case 'evolution_stage': return 'Evolution Stage';
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight mb-1">Goals</h2>
          <p className="text-xs text-muted-foreground">Set and track your objectives</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="bg-secondary/50 border border-border rounded-lg p-4 space-y-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Reach STRENGTH level 20"
                  className="w-full bg-background border border-border rounded p-2 text-sm focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as GoalType })}
                    className="w-full bg-background border border-border rounded p-2 text-sm focus:outline-none focus:border-primary"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                    Target Type
                  </label>
                  <select
                    value={formData.targetType}
                    onChange={(e) => setFormData({ ...formData, targetType: e.target.value as GoalTargetType })}
                    className="w-full bg-background border border-border rounded p-2 text-sm focus:outline-none focus:border-primary"
                  >
                    <option value="attribute_level">Attribute Level</option>
                    <option value="tasks_completed">Tasks Completed</option>
                    <option value="integrity">Integrity</option>
                    <option value="evolution_stage">Evolution Stage</option>
                  </select>
                </div>
              </div>

              {formData.targetType === 'attribute_level' && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                    Attribute
                  </label>
                  <select
                    value={formData.attributeType}
                    onChange={(e) => setFormData({ ...formData, attributeType: e.target.value as AttributeType })}
                    className="w-full bg-background border border-border rounded p-2 text-sm focus:outline-none focus:border-primary"
                  >
                    {['strength', 'intellect', 'create', 'mind', 'work', 'others'].map(attr => (
                      <option key={attr} value={attr}>{attr.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                  Target Value
                </label>
                <input
                  type="number"
                  value={formData.targetValue}
                  onChange={(e) => setFormData({ ...formData, targetValue: Number(e.target.value) })}
                  min="1"
                  className="w-full bg-background border border-border rounded p-2 text-sm focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  Add Goal
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {goals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No goals set. Create one to get started!</p>
          </div>
        ) : (
          goals.map((goal) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg border transition-all ${
                goal.completed
                  ? 'bg-primary/5 border-primary/20'
                  : 'bg-card border-border'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {goal.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground" />
                    )}
                    <h3 className={`font-bold text-sm ${goal.completed ? 'text-primary line-through' : ''}`}>
                      {goal.title}
                    </h3>
                  </div>
                  {goal.description && (
                    <p className="text-xs text-muted-foreground mb-2">{goal.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {getGoalTypeLabel(goal.type)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {getTargetTypeLabel(goal.targetType)}
                      {goal.attributeType && ` (${goal.attributeType.toUpperCase()})`}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    removeGoal(goal.id);
                    haptics.light();
                  }}
                  className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-muted-foreground">
                    {Math.round(goal.progress)}% Complete
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">
                    {goal.completed ? 'Achieved!' : `${goal.progress.toFixed(0)}%`}
                  </span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${goal.completed ? 'bg-primary' : 'bg-primary/60'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${goal.progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
