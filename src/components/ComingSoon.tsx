import { motion } from "framer-motion";
import { ArrowLeft, Construction, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ComingSoonProps {
  toolName: string;
  description?: string;
  category?: string;
  onBack: () => void;
}

export function ComingSoon({ toolName, description, category, onBack }: ComingSoonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-full flex items-center justify-center"
    >
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-16 text-center">
        {/* Back */}
        <div className="flex justify-start mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to Dashboard
          </Button>
        </div>

        {/* Icon */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, type: "spring" }}
          className="flex size-20 items-center justify-center rounded-2xl bg-amber/10 mx-auto mb-6"
        >
          <Construction className="size-10 text-amber" />
        </motion.div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
          {toolName}
        </h1>

        {/* Badge */}
        <Badge
          variant="outline"
          className="mb-4 border-amber/40 text-amber gap-1.5"
        >
          <Clock className="size-3" />
          Coming Soon
        </Badge>

        {/* Description */}
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          {description || "This tool is currently under development and will be available in a future update."}
        </p>

        {/* Category */}
        {category && (
          <p className="text-xs text-muted-foreground mb-8">
            Category: <span className="text-foreground">{category}</span>
          </p>
        )}

        {/* Info */}
        <div className="glass-card rounded-xl p-4 border border-amber/20">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Zap className="size-4 text-amber" />
            <span>This tool is being built and will be functional in an upcoming release.</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
