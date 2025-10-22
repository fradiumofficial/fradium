

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Wallet, Shield, Key, LockKeyhole } from "lucide-react"

export default function WalletAnimation() {
  const [step, setStep] = useState(0)
  const totalSteps = 4

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % totalSteps)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const steps = [
    {
      icon: Wallet,
      title: "Create Wallet",
      description: "Set up your secure ICP wallet",
      color: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      icon: Key,
      title: "Secure Keys",
      description: "Store your recovery phrase safely",
      color: "bg-amber-100 dark:bg-amber-900/30",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
    {
      icon: LockKeyhole,
      title: "Connect to Lumora",
      description: "Link your wallet to the platform",
      color: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
    },
    {
      icon: Shield,
      title: "Start Earning",
      description: "Receive rewards for eco-actions",
      color: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
  ]

  return (
    <div className="h-[300px] rounded-lg overflow-hidden border bg-card flex items-center justify-center relative">
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
        {steps.map((_, index) => (
          <motion.div
            key={index}
            className="h-2 w-2 rounded-full bg-muted"
            animate={{
              backgroundColor: step === index ? "var(--primary)" : "var(--muted)",
            }}
          />
        ))}
      </div>

      <div className="max-w-xs mx-auto px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <motion.div
              className={`${steps[step].color} mx-auto rounded-full p-4 w-20 h-20 flex items-center justify-center mb-6`}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
            >
              {(() => {
                const IconComponent = steps[step].icon
                return <IconComponent className={`h-10 w-10 ${steps[step].iconColor}`} />
              })()}
            </motion.div>

            <h3 className="text-xl font-semibold mb-2">{steps[step].title}</h3>
            <p className="text-muted-foreground">{steps[step].description}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Decorative elements */}
      <motion.div
        className="absolute -top-10 -left-10 w-20 h-20 rounded-full bg-primary/5"
        animate={{ scale: [1, 1.2, 1], rotate: [0, 45, 0] }}
        transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-10 -right-10 w-20 h-20 rounded-full bg-primary/5"
        animate={{ scale: [1, 1.2, 1], rotate: [0, -45, 0] }}
        transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 1 }}
      />
    </div>
  )
}
