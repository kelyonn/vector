import { useVectorStore, type AttributeType } from '../store/useVectorStore';
import { motion } from 'framer-motion';

export function AttributeCards() {
  const { attributes } = useVectorStore();
  const keys = Object.keys(attributes) as AttributeType[];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {keys.map((key) => {
            const attr = attributes[key];
            const percent = Math.min(100, (attr.currentXP / attr.xpToNextLevel) * 100);
            
            return (
                <div key={key} className="p-3 rounded-lg border border-border bg-card/50">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold tracking-wider uppercase">{key}</span>
                        <span className="text-[10px] font-mono text-primary">LVL {attr.level}</span>
                    </div>
                    <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                        <motion.div 
                            className="bg-primary h-full" 
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ type: "spring", stiffness: 60 }}
                        />
                    </div>
                    <div className="mt-1 text-[9px] text-right text-muted-foreground font-mono">
                        {attr.currentXP} / {attr.xpToNextLevel} XP
                    </div>
                </div>
            );
        })}
    </div>
  );
}