

import { motion } from "framer-motion"
import { Leaf } from "lucide-react"

export default function ResourcesHeader() {
  return (
    <motion.div
      className="text-center py-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div className="inline-block p-3 bg-green-100 rounded-full mb-4" whileHover={{ scale: 1.05, rotate: 5 }}>
        <Leaf className="h-10 w-10 text-green-600" />
      </motion.div>
      <h1 className="text-4xl md:text-5xl font-bold mb-4">Lumora Resources</h1>
      <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
        Everything you need to know about using Lumora, tracking your eco-friendly actions, and setting up your ICP
        wallet.
      </p>
    </motion.div>
  )
}
