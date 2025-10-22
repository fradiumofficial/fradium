

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { CheckCircle, Leaf, Recycle, Bike, TreePine } from "lucide-react"

export default function TrackingAnimation() {
  const [currentAction, setCurrentAction] = useState(0)

  const actions = [
    {
      icon: Recycle,
      text: "Recycling",
      color: "bg-blue-100 dark:bg-blue-900/50",
      iconColor: "text-blue-600 dark:text-blue-400",
      points: "+5 points",
    },
    {
      icon: Bike,
      text: "Biking",
      color: "bg-green-100 dark:bg-green-900/50",
      iconColor: "text-green-600 dark:text-green-400",
      points: "+8 points",
    },
    {
      icon: Leaf,
      text: "Composting",
      color: "bg-amber-100 dark:bg-amber-900/50",
      iconColor: "text-amber-600 dark:text-amber-400",
      points: "+6 points",
    },
    {
      icon: TreePine,
      text: "Tree Planting",
      color: "bg-emerald-100 dark:bg-emerald-900/50",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      points: "+15 points",
    },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAction((prev) => (prev + 1) % actions.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [actions.length])

  return (
    <div className="h-[300px] rounded-lg overflow-hidden border bg-card flex items-center justify-center relative">
      <div className="absolute top-0 left-0 w-full h-2 bg-muted overflow-hidden">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        />
      </div>

      <div className="max-w-xs mx-auto">
        <div className="mb-8 text-center">
          <h3 className="text-xl font-semibold mb-2">Track Your Actions</h3>
          <p className="text-muted-foreground text-sm">Record your eco-friendly activities and earn impact points</p>
        </div>

        <div className="relative h-32">
          {actions.map((action, index) => (
            <motion.div
              key={index}
              className="absolute top-0 left-0 w-full flex items-center p-4 rounded-lg border"
              initial={{ opacity: 0, x: 50 }}
              animate={{
                opacity: currentAction === index ? 1 : 0,
                x: currentAction === index ? 0 : 50,
              }}
              transition={{ duration: 0.5 }}
            >
              <div className={`${action.color} p-3 rounded-full mr-4`}>
                <action.icon className={`h-6 w-6 ${action.iconColor}`} />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{action.text}</h4>
                <p className="text-sm text-muted-foreground">Tracked activity</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-green-600 dark:text-green-400">{action.points}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-8 flex items-center justify-center gap-2 p-3 rounded-lg bg-primary/10"
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        >
          <CheckCircle className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Verification Complete</span>
        </motion.div>
      </div>
    </div>
  )
}
