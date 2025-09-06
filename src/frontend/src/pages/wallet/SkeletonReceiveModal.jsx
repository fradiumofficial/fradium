// React
import React from "react";

// Framer Motion
import { motion } from "framer-motion";

const SkeletonReceiveModal = () => (
  <motion.div className="flex flex-col gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
    <motion.div className="w-full h-8 bg-gradient-to-r from-[#393E4B] via-[#4A4F58] to-[#393E4B] rounded" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} />
    <motion.div className="w-full h-6 bg-gradient-to-r from-[#393E4B] via-[#4A4F58] to-[#393E4B] rounded" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }} />
    <motion.div className="w-full h-6 bg-gradient-to-r from-[#393E4B] via-[#4A4F58] to-[#393E4B] rounded" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }} />
  </motion.div>
);

export default SkeletonReceiveModal;
