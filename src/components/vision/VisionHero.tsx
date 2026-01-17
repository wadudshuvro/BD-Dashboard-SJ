import { Sparkles, Target } from "lucide-react";

const VisionHero = () => {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-accent to-primary p-8 md:p-12 text-primary-foreground">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-6 w-6" />
          <span className="text-sm font-medium uppercase tracking-wider opacity-90">
            Vision 2025
          </span>
        </div>
        
        <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
          BD AI Portal
        </h1>
        
        <p className="text-xl md:text-2xl font-medium opacity-90 mb-8 max-w-2xl">
          Orchestrating intelligent business development at startup velocity
        </p>
        
        <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-6 max-w-xl">
          <Target className="h-8 w-8 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-lg mb-2">Strategic North Star</h3>
            <p className="opacity-90 leading-relaxed">
              Grow qualified pipeline by 30%, shorten deal-cycle by 20%, and keep 
              audit-ready transparency for investors. Achieve with fewer keystrokes 
              and zero context-switching.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VisionHero;
