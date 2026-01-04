import { motion } from 'framer-motion';

import { useVectorStore } from '@/store/useVectorStore';

export function Nexus() {
  const { evolutionStage, integrity } = useVectorStore();

  // Color changes based on Integrity (Health)
  const getStatusColor = () => {
    if (integrity > 80) return 'hsl(var(--primary))'; // Healthy (Blue/White)
    if (integrity > 40) return '#eab308'; // Warning (Yellow)
    return '#ef4444'; // Critical (Red)
  };

  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      {/* Outer Ring - Breathing Effect */}
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-full h-full rounded-full border border-primary/30"
      />

      {/* The Core - Shape changes based on Evolution Stage */}
      <motion.div
        className="w-16 h-16 border-2 flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)] backdrop-blur-sm"
        style={{ borderColor: getStatusColor(), boxShadow: `0 0 20px ${getStatusColor()}40` }}
        animate={{ 
          rotate: 360,
          borderRadius: evolutionStage > 5 ? ["20%", "50%", "20%"] : "0%"
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        {/* Inner Core */}
        <motion.div 
            className="w-8 h-8 opacity-80"
            style={{ backgroundColor: getStatusColor() }}
            animate={{ scale: [0.8, 1.2, 0.8], rotate: -360 }}
            transition={{ duration: 10, repeat: Infinity }}
        />
      </motion.div>

      {/* Stage Indicator */}
      <div className="absolute -bottom-8 font-mono text-xs text-muted-foreground tracking-widest">
        STAGE {evolutionStage}
      </div>
    </div>
  );
}