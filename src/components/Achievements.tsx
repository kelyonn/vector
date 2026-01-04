import { useMemo } from 'react';
import { Award, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

import { calculateAchievements } from '@/lib/statistics';
import { useVectorStore } from '@/store/useVectorStore';

export function Achievements() {
  const { snapshots, evolutionStage, attributes } = useVectorStore();
  
  const achievements = useMemo(() => 
    calculateAchievements(snapshots, evolutionStage, attributes),
    [snapshots, evolutionStage, attributes]
  );

  const unlocked = achievements.filter(a => a.unlocked).length;
  const total = achievements.length;

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold tracking-tight mb-1">Achievements</h2>
          <p className="text-xs text-muted-foreground">
            {unlocked} / {total} unlocked
          </p>
        </div>
        <div className="text-2xl font-mono font-bold text-primary">{Math.round((unlocked / total) * 100)}%</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {achievements.map((achievement) => (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg border transition-all ${
              achievement.unlocked
                ? 'bg-primary/5 border-primary/20'
                : 'bg-secondary/20 border-border opacity-60'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={achievement.unlocked ? 'text-primary' : 'text-muted-foreground'}>
                {achievement.unlocked ? <Award className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`font-bold text-sm ${achievement.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {achievement.name}
                  </h3>
                  {achievement.unlocked && (
                    <span className="text-[10px] text-primary font-mono">
                      ✓
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{achievement.description}</p>
                {achievement.unlocked && achievement.unlockedAt && (
                  <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                    Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

