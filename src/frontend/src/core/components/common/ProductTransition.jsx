import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProductTransition({ isVisible, productName, onComplete }) {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    if (isVisible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(() => {
          onComplete();
        }, 500); // Wait longer for exit animation
      }, 8000); // Extended to 8 seconds for maximum text visibility

      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <AnimatePresence onExitComplete={() => setShow(false)}>
      {show && (
        <motion.div
          className="fixed inset-0 z-[99999] flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #0F1219 0%, #1A1F2E 50%, #0F1219 100%)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }} // Slower transition
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-br from-[#9BE4A0]/20 via-transparent to-[#9BE4A0]/10"></div>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#9BE4A0]/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#9BE4A0]/5 rounded-full blur-3xl"></div>
          </div>

          {/* Main Content */}
          <div className="relative z-10 text-center">
            {/* Product Name */}
            <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4, duration: 0.6 }} className="mb-4">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{productName}</h1>
              <div className="w-24 h-1 bg-gradient-to-r from-[#9BE4A0] to-[#7DD3FC] mx-auto rounded-full"></div>
            </motion.div>

            {/* Subtitle */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7, duration: 0.5 }}>
              <p className="text-lg text-white/70 font-medium">Switching to {productName.toLowerCase()}</p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
