import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

export default function ProductTransition({ isVisible, productName, onComplete }) {
  const [show, setShow] = React.useState(false);

  // Map product names to their logo files and theme colors
  const getProductLogo = (productName) => {
    const logoMap = {
      "Fradium Wallet": "/assets/logo/fradium-wallet.svg",
      "Fradium Escrow": "/assets/logo/fradium-escrow.svg",
      "Fradium Paylink": "/assets/logo/fradium-paylink.svg",
      "Fradium Extension": "/assets/logo/fradium-extension.svg",
    };
    return logoMap[productName] || "/assets/logo/fradium.svg";
  };

  // Get theme colors for each product
  const getProductTheme = (productName) => {
    const themeMap = {
      "Fradium Wallet": {
        primary: "#9BE4A0", // Green
        secondary: "#7DD3FC", // Light blue
        bgGradient: "linear-gradient(135deg, #0F1219 0%, #1A2B1A 50%, #0F1219 100%)",
        accentGradient: "from-[#9BE4A0]/15 via-transparent to-[#9BE4A0]/8",
        glowColor: "#9BE4A0",
      },
      "Fradium Escrow": {
        primary: "#7C72FE", // Purple
        secondary: "#A78BFA", // Light purple
        bgGradient: "linear-gradient(135deg, #0F1219 0%, #2A1A3A 50%, #0F1219 100%)",
        accentGradient: "from-[#7C72FE]/15 via-transparent to-[#7C72FE]/8",
        glowColor: "#7C72FE",
      },
      "Fradium Paylink": {
        primary: "#C6A960", // Golden yellow
        secondary: "#D4B76E", // Light golden
        bgGradient: "linear-gradient(135deg, #0F1219 0%, #3A2A1A 50%, #0F1219 100%)",
        accentGradient: "from-[#C6A960]/15 via-transparent to-[#C6A960]/8",
        glowColor: "#C6A960",
      },
      "Fradium Extension": {
        primary: "#9BE4A0", // Default green
        secondary: "#7DD3FC", // Light blue
        bgGradient: "linear-gradient(135deg, #0F1219 0%, #1A2B1A 50%, #0F1219 100%)",
        accentGradient: "from-[#9BE4A0]/15 via-transparent to-[#9BE4A0]/8",
        glowColor: "#9BE4A0",
      },
    };
    return themeMap[productName] || themeMap["Fradium Wallet"];
  };

  React.useEffect(() => {
    if (isVisible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(() => {
          onComplete();
        }, 500); // Wait longer for exit animation
      }, 3000); // Reduced to 3 seconds since we're showing logo instead of text

      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  const theme = getProductTheme(productName);

  // Render to document body using portal to ensure it's always on top
  return createPortal(
    <>
      {/* Global styles to ensure ProductTransition is always on top */}
      <style>{`
        .product-transition-portal {
          z-index: 2147483647 !important; /* Maximum z-index value */
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          pointer-events: auto !important;
        }
      `}</style>
      <AnimatePresence onExitComplete={() => setShow(false)}>
        {show && (
          <motion.div
            className="product-transition-portal fixed inset-0 flex items-center justify-center"
            style={{
              background: theme.bgGradient,
              zIndex: 2147483647, // Maximum z-index value
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100vw",
              height: "100vh",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className={`absolute inset-0 bg-gradient-to-br ${theme.accentGradient}`}></div>
              <div className={`absolute top-1/4 left-1/4 w-96 h-96 ${theme.glowColor}/5 rounded-full blur-3xl`}></div>
              <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 ${theme.glowColor}/5 rounded-full blur-3xl`}></div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 text-center -mt-[15rem]">
              {/* Product Logo */}
              <motion.div initial={{ y: 30, opacity: 0, scale: 0.8 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ delay: 0.4, duration: 0.8, type: "spring", stiffness: 100 }}>
                <img src={getProductLogo(productName)} alt={productName} className="w-56 h-56 md:w-64 md:h-64 lg:w-72 lg:h-72 xl:w-80 xl:h-80 mx-auto drop-shadow-2xl" />
              </motion.div>

              {/* Subtitle */}
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8, duration: 0.5 }} className="-mt-[3rem]">
                <p className="text-lg text-white/70 font-medium">Switching to {productName.toLowerCase()}</p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body
  );
}
