import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LightButton from "@/core/components/ui/LightButton.jsx";

const OverviewPage = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  const handleCreateToken = () => {
    navigate("/developer/access-token");
  };

  const handleViewDocs = () => {
    navigate("/developer/api-documentation");
  };

  return (
    <div className="min-h-screen bg-transparent">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
        {/* Welcome Banner */}
        <motion.div variants={itemVariants} className="text-center mt-20">
          <h1 className="text-4xl font-semibold text-slate-900 mb-4">Welcome to Fradium API</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">Create your API token to start analyzing cryptocurrency addresses. View our documentation for integration guides and examples.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <LightButton variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />} onClick={handleCreateToken}>
              Create API Token
            </LightButton>
            <LightButton variant="ghost" size="lg" onClick={handleViewDocs}>
              View Documentation
            </LightButton>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default OverviewPage;
