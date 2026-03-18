import { motion } from "framer-motion";

const Index = () => {
  return (
    <div className="min-h-svh w-full bg-canvas flex items-center justify-center relative overflow-hidden">
      {/* Subtle Grain Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* The Focus Point */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center gap-4"
      >
        {/* Minimalist Cursor Indicator */}
        <motion.div
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="w-[1px] h-6 bg-accent"
        />

        {/* Subtle Status */}
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Ready to build
        </span>
      </motion.div>

      {/* Decorative Frame */}
      <div className="absolute top-8 left-8 right-8 bottom-8 border border-border pointer-events-none" />

      <div className="absolute bottom-6 right-8">
        <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
          001 // EMPTY_STATE
        </span>
      </div>
    </div>
  );
};

export default Index;
