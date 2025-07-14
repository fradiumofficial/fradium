import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/core/components/ui/button";
import { cn } from "@/core/lib/utils";
import { FileQuestion, Inbox, Search, ImageIcon, Package, Sparkles, Leaf, AlertCircle, Plus } from "lucide-react";

const iconVariants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.5,
      delay: 0.2,
    },
  },
  hover: {
    scale: 1.1,
    transition: {
      duration: 0.3,
      yoyo: Number.POSITIVE_INFINITY,
      repeatDelay: 0.5,
    },
  },
};

const textVariants = {
  initial: { y: 20, opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      delay: 0.4,
    },
  },
};

const buttonVariants = {
  initial: { y: 20, opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      delay: 0.6,
    },
  },
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.2,
    },
  },
};

const particleVariants = {
  initial: { opacity: 0, scale: 0 },
  animate: {
    opacity: [0, 1, 0],
    scale: [0, 1, 0],
    transition: {
      duration: 2,
      repeat: Number.POSITIVE_INFINITY,
      repeatDelay: 0.5,
    },
  },
};

const EmptyState = ({ title = "No items found", description = "There are no items to display at the moment.", icon, actionLabel, actionHref, onAction, variant = "default", className, particles = true, animated = true }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine the icon based on variant if not provided
  const IconComponent =
    icon ||
    {
      default: FileQuestion,
      projects: Package,
      nfts: Sparkles,
      collections: ImageIcon,
      search: Search,
      inbox: Inbox,
      eco: Leaf,
      error: AlertCircle,
    }[variant] ||
    FileQuestion;

  // Determine background and accent colors based on variant
  const getVariantStyles = () => {
    const styles = {
      default: {
        bgClass: "",
        accentClass: "text-muted-foreground",
        buttonClass: "bg-primary hover:bg-primary/90",
      },
      projects: {
        bgClass: "",
        accentClass: "text-blue-400",
        buttonClass: "bg-blue-600 hover:bg-blue-700 text-white",
      },
      nfts: {
        bgClass: "",
        accentClass: "text-purple-400",
        buttonClass: "bg-purple-600 hover:bg-purple-700 text-white",
      },
      collections: {
        bgClass: "",
        accentClass: "text-amber-400",
        buttonClass: "bg-amber-600 hover:bg-amber-700 text-white",
      },
      search: {
        bgClass: "",
        accentClass: "text-slate-400",
        buttonClass: "bg-slate-600 hover:bg-slate-700 text-white",
      },
      inbox: {
        bgClass: "",
        accentClass: "text-green-400",
        buttonClass: "bg-green-600 hover:bg-green-700 text-white",
      },
      eco: {
        bgClass: "",
        accentClass: "text-emerald-400",
        buttonClass: "bg-emerald-600 hover:bg-emerald-700 text-white",
      },
      error: {
        bgClass: "",
        accentClass: "text-red-400",
        buttonClass: "bg-red-600 hover:bg-red-700 text-white",
      },
    };

    return styles[variant] || styles.default;
  };

  const { bgClass, accentClass, buttonClass } = getVariantStyles();

  // Generate random positions for particles
  const generateParticles = (count = 8) => {
    return Array.from({ length: count }).map((_, i) => {
      const size = Math.floor(Math.random() * 6) + 4; // 4-10px
      const delay = Math.random() * 2;
      const duration = Math.random() * 3 + 2; // 2-5s
      const x = Math.random() * 200 - 100; // -100 to 100
      const y = Math.random() * 200 - 100; // -100 to 100

      return (
        <motion.div
          key={i}
          className={`absolute rounded-full ${accentClass} bg-current`}
          style={{
            width: size,
            height: size,
            x: x,
            y: y,
          }}
          variants={particleVariants}
          initial="initial"
          animate="animate"
          custom={i}
          transition={{
            delay: delay,
            duration: duration,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "loop",
          }}
        />
      );
    });
  };

  // If not mounted yet and animation is enabled, return null to prevent SSR issues
  if (!mounted && animated) return null;

  const MotionComponent = animated ? motion.div : "div";
  const motionProps = animated
    ? {
        variants: iconVariants,
        initial: "initial",
        animate: "animate",
        whileHover: "hover",
      }
    : {};

  return (
    <div className={cn("flex flex-col items-center justify-center p-8 rounded-lg text-center", bgClass, className)}>
      <div className="relative">
        {particles && animated && <div className="absolute inset-0 flex items-center justify-center">{generateParticles()}</div>}

        <MotionComponent className={cn("w-16 h-16 mb-4 rounded-full flex items-center justify-center", accentClass)} {...motionProps}>
          <IconComponent className="w-8 h-8" />
        </MotionComponent>
      </div>

      <motion.h3 className="text-xl font-semibold mt-4 mb-2" variants={animated ? textVariants : {}} initial={animated ? "initial" : false} animate={animated ? "animate" : false}>
        {title}
      </motion.h3>

      <motion.p className="text-muted-foreground mb-6 max-w-md" variants={animated ? textVariants : {}} initial={animated ? "initial" : false} animate={animated ? "animate" : false}>
        {description}
      </motion.p>

      {actionLabel && (
        <motion.div variants={animated ? buttonVariants : {}} initial={animated ? "initial" : false} animate={animated ? "animate" : false} whileHover={animated ? "hover" : false}>
          {actionHref ? (
            <Button asChild className={buttonClass}>
              <a href={actionHref}>
                {variant === "default" && <Plus className="mr-2 h-4 w-4" />}
                {actionLabel}
              </a>
            </Button>
          ) : (
            <Button onClick={onAction} className={buttonClass}>
              {variant === "default" && <Plus className="mr-2 h-4 w-4" />}
              {actionLabel}
            </Button>
          )}
        </motion.div>
      )}
    </div>
  );
};

export { EmptyState };
