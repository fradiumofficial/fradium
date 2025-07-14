import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, RefreshCcw, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/core/lib/utils";
import { Skeleton } from "@/core/components/ui/skeleton";

/**
 * LoadingState - A versatile, animated loading component
 *
 * @param {Object} props
 * @param {string} props.type - Type of loading animation: "spinner", "progress", "skeleton", "dots", "pulse"
 * @param {string} props.size - Size of the loading animation: "xs", "sm", "md", "lg", "xl"
 * @param {string} props.color - Color theme: "default", "primary", "secondary", "success", "warning", "danger"
 * @param {string} props.text - Optional text to display with the loading animation
 * @param {string} props.status - Loading status: "loading", "success", "error", "idle"
 * @param {number} props.progress - Progress value (0-100) for progress bar type
 * @param {number} props.count - Number of skeleton items to display
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.fullPage - Whether to display as a full page overlay
 * @param {React.ReactNode} props.children - Content to display when not loading (for skeleton type)
 */
export function LoadingState({ type = "spinner", size = "md", color = "default", text, status = "loading", progress = 0, count = 3, className, fullPage = false, children, ...props }) {
  const [progressValue, setProgressValue] = useState(progress);

  // Auto-increment progress for demo purposes
  useEffect(() => {
    if (type === "progress" && status === "loading" && progressValue < 100) {
      const timer = setTimeout(() => {
        setProgressValue((prev) => Math.min(prev + Math.random() * 15, 100));
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [progressValue, type, status]);

  // Size mappings
  const sizeMap = {
    xs: "h-4 w-4",
    sm: "h-5 w-5",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  // Text size mappings
  const textSizeMap = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  };

  // Color mappings
  const colorMap = {
    default: "text-gray-500 dark:text-gray-400",
    primary: "text-emerald-500",
    secondary: "text-purple-500",
    success: "text-green-500",
    warning: "text-amber-500",
    danger: "text-red-500",
  };

  // Background color mappings for progress bar
  const bgColorMap = {
    default: "bg-gray-200 dark:bg-gray-700",
    primary: "bg-emerald-100 dark:bg-emerald-900/30",
    secondary: "bg-purple-100 dark:bg-purple-900/30",
    success: "bg-green-100 dark:bg-green-900/30",
    warning: "bg-amber-100 dark:bg-amber-900/30",
    danger: "bg-red-100 dark:bg-red-900/30",
  };

  // Fill color mappings for progress bar
  const fillColorMap = {
    default: "bg-gray-500 dark:bg-gray-400",
    primary: "bg-emerald-500",
    secondary: "bg-purple-500",
    success: "bg-green-500",
    warning: "bg-amber-500",
    danger: "bg-red-500",
  };

  // Status icon mappings
  const statusIconMap = {
    loading: <Loader2 className={cn(sizeMap[size], "animate-spin")} />,
    success: <CheckCircle className={cn(sizeMap[size])} />,
    error: <AlertCircle className={cn(sizeMap[size])} />,
    idle: <RefreshCcw className={cn(sizeMap[size])} />,
  };

  // Render spinner loading type
  const renderSpinner = () => (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)} {...props}>
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className={cn(colorMap[color])}>
        {statusIconMap[status]}
      </motion.div>
      {text && (
        <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ delay: 0.1 }} className={cn(textSizeMap[size], colorMap[color])}>
          {text}
        </motion.p>
      )}
    </div>
  );

  // Render progress bar loading type
  const renderProgress = () => (
    <div className={cn("flex flex-col gap-2 w-full max-w-md", className)} {...props}>
      <div className="flex justify-between items-center">
        {text && <p className={cn(textSizeMap[size], colorMap[color])}>{text}</p>}
        <p className={cn(textSizeMap.xs, colorMap[color])}>{Math.round(progressValue)}%</p>
      </div>
      <div className={cn("w-full h-2 rounded-full overflow-hidden", bgColorMap[color])}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${progressValue}%` }} transition={{ type: "spring", stiffness: 50, damping: 10 }} className={cn("h-full rounded-full", fillColorMap[color])} />
      </div>
    </div>
  );

  // Render skeleton loading type
  const renderSkeleton = () => (
    <div className={cn("w-full space-y-4", className)} {...props}>
      <AnimatePresence mode="wait">
        {status === "loading" ? (
          <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {text && (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            )}
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full max-w-[250px]" />
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // Render dots loading type
  const renderDots = () => (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)} {...props}>
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: [0, -10, 0] }}
            transition={{
              y: {
                duration: 0.6,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "loop",
                delay: i * 0.2,
              },
            }}
            className={cn("rounded-full", sizeMap.xs.replace("h-4 w-4", "h-3 w-3"), fillColorMap[color])}
          />
        ))}
      </div>
      {text && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cn(textSizeMap[size], colorMap[color])}>
          {text}
        </motion.p>
      )}
    </div>
  );

  // Render pulse loading type
  const renderPulse = () => (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)} {...props}>
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "loop",
        }}
        className={cn("rounded-full", sizeMap[size], fillColorMap[color])}
      />
      {text && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cn(textSizeMap[size], colorMap[color])}>
          {text}
        </motion.p>
      )}
    </div>
  );

  // Full page overlay wrapper
  const renderFullPage = (content) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
      {content}
    </motion.div>
  );

  // Render the appropriate loading type
  const renderLoading = () => {
    switch (type) {
      case "spinner":
        return renderSpinner();
      case "progress":
        return renderProgress();
      case "skeleton":
        return renderSkeleton();
      case "dots":
        return renderDots();
      case "pulse":
        return renderPulse();
      default:
        return renderSpinner();
    }
  };

  return fullPage ? renderFullPage(renderLoading()) : renderLoading();
}
