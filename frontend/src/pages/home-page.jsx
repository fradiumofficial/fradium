import { ChevronDown, Grid3X3, Star, Trophy, ArrowRight, Wallet, BadgeDollarSign, PercentCircle, Info, HelpCircle, Sparkles } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { motion, useScroll, useTransform } from "framer-motion";

import { Button } from "@/core/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/components/ui/tabs";
import { SakuraAnimation } from "@/core/components/sakura-animation";
import NFTRewardsSection from "../core/components/nft/nft-rewards-section";
import { ProjectCard } from "@/core/components/project/project-card";
import { EmptyState } from "../core/components/ui/empty-state";
import { Badge } from "@/core/components/ui/badge";
import { Progress } from "@/core/components/ui/progress";
import { Separator } from "@/core/components/ui/seperator";
import { backend } from "declarations/backend";
import { toast } from "react-toastify";

const levels = [
  {
    name: "Bronze",
    value: "bronze",
    color: "bg-amber-700",
    textColor: "text-white",
    borderColor: "",
    holdingRequirement: "0 - 100 LUM",
    maxReward: "100 LUM",
    fee: "5%",
    benefits: ["Create basic community challenges", "Earn organizer fees on completed actions", "Access to community dashboard"],
  },
  {
    name: "Silver",
    value: "silver",
    color: "bg-slate-400",
    textColor: "text-slate-300",
    borderColor: "",
    holdingRequirement: "100 - 500 LUM",
    maxReward: "500 LUM",
    fee: "10%",
    benefits: ["All Bronze benefits", "Create advanced challenges with milestones", "Access to basic analytics", "Featured in community section (limited)"],
  },
  {
    name: "Gold",
    value: "gold",
    color: "bg-amber-500",
    textColor: "text-amber-400",
    borderColor: "",
    holdingRequirement: "500 - 2000 LUM",
    maxReward: "2000 LUM",
    fee: "15%",
    benefits: ["All Silver benefits", "Create multi-stage projects", "Advanced analytics and reporting", "Priority verification for submissions", "Featured in community section"],
  },
  {
    name: "Diamond",
    value: "diamond",
    color: "bg-sky-400",
    textColor: "text-sky-300",
    borderColor: "",
    holdingRequirement: "2000 - 5000 LUM",
    maxReward: "5000 LUM",
    fee: "20%",
    benefits: ["All Gold benefits", "Create ecosystem-level initiatives", "Full analytics suite with export options", "Priority support and verification", "Featured on homepage and community section", "Access to exclusive organizer events"],
  },
];

export default function Home() {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLevel, setUserLevel] = useState("bronze");
  const [lumHolding, setLumHolding] = useState(75);

  // Calculate progress percentage for the current level
  const getProgressPercentage = () => {
    switch (userLevel) {
      case "bronze":
        return Math.min((lumHolding / 100) * 100, 100);
      case "silver":
        return Math.min(((lumHolding - 100) / 400) * 100, 100);
      case "gold":
        return Math.min(((lumHolding - 500) / 1500) * 100, 100);
      case "diamond":
        return Math.min(((lumHolding - 2000) / 3000) * 100, 100);
      default:
        return 0;
    }
  };

  // Get next level requirements
  const getNextLevelRequirement = () => {
    switch (userLevel) {
      case "bronze":
        return 100 - lumHolding;
      case "silver":
        return 500 - lumHolding;
      case "gold":
        return 2000 - lumHolding;
      case "diamond":
        return "Maximum level reached";
      default:
        return 0;
    }
  };

  // Fetch projects from backend
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const result = await backend.getProjects();
        if ("Ok" in result) {
          // Sort projects by createdAt in descending order and take the latest 4
          const sortedProjects = result.Ok.sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
            .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
            .slice(0, 4);
          setProjects(sortedProjects);
        } else {
          setError(result.Err);
        }
      } catch (err) {
        toast.error(err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Scroll animations
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);

  const cardVariants = {
    initial: { scale: 1 },
    hover: {
      scale: 1.02,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  };

  const imageVariants = {
    initial: { scale: 1 },
    hover: {
      scale: 1.1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const contentVariants = {
    initial: { y: 0 },
    hover: {
      y: -5,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  };

  return (
    <main>
      <section ref={heroRef} className="relative h-screen flex items-center justify-center overflow-hidden">
        <motion.div className="absolute inset-0 z-0" style={{ scale: heroScale }}>
          <div className="absolute inset-0 bg-black/20 z-10"></div>
          <img
            src="/images/hero-tree.png"
            alt="Pixel art cherry blossom tree on a hill"
            className="w-full h-full object-cover object-center min-h-full min-w-full"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              minWidth: "100%",
              minHeight: "100%",
              maxWidth: "100%",
              maxHeight: "100%",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/90" />
        </motion.div>

        <SakuraAnimation />

        <motion.div className="container relative z-20 px-4 mx-auto text-center" style={{ y: heroY, opacity: heroOpacity }}>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8 }} className="text-5xl md:text-7xl font-bold mb-6 text-white drop-shadow-[0_0_15px_rgba(236,234,227,0.5)]">
            <span className="text-beige-200">LUMORA</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.8 }} className="text-xl md:text-2xl text-beige-100 max-w-3xl mx-auto mb-10">
            Earn rewards for real-world eco-friendly actions through our decentralized, community-driven platform
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.8 }} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => navigate("/projects")} className="bg-black/40 backdrop-blur-lg hover:bg-black/60 px-8 py-6 rounded-xl text-lg font-medium">
              Contribute <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button className="px-8 bg-transparent hover:bg-transparent py-6 rounded-xl text-lg font-medium" onClick={() => navigate("/resources")}>
              Learn More
            </Button>
          </motion.div>
          <div className="mb-28"></div>
        </motion.div>

        <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }} className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20 text-beige-200">
          <ChevronDown className="h-8 w-8 animate-bounce" />
        </motion.div>
      </section>

      {/* Featured Projects */}
      <section className="py-12 border-b">
        <div className="container">
          <Tabs defaultValue="trending">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold mb-8">Latest Impact Projects</h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="hidden md:flex items-center gap-1" onClick={() => navigate("/projects")}>
                  <Grid3X3 className="h-4 w-4" />
                  View All
                </Button>
              </div>
            </div>

            <TabsContent value="trending" className="mt-0">
              {loading ? (
                <div className="text-center py-8">Loading projects...</div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">Error: {error}</div>
              ) : projects.length === 0 ? (
                <EmptyState variant="projects" title="No projects yet" description="No projects to display at the moment." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {projects.map((project, index) => (
                    <motion.div key={index} variants={cardVariants} initial="initial" whileHover="hover" className="cursor-pointer" onClick={() => navigate(`/projects/${project.id}`)}>
                      <ProjectCard project={project} />
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="top" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    id: "top-1",
                    title: "Solar Panel Collective",
                    impact: "125 MWh generated",
                    reward: 32500,
                    participants: [1, 2, 3, 4, 5], // Dummy array for length
                    maxParticipants: 1000,
                    status: 1,
                    image: null,
                  },
                  {
                    id: "top-2",
                    title: "Sustainable Transport",
                    impact: "45 tons CO₂ saved",
                    reward: 28700,
                    participants: [1, 2, 3], // Dummy array for length
                    maxParticipants: 500,
                    status: 1,
                    image: null,
                  },
                  {
                    id: "top-3",
                    title: "Water Conservation",
                    impact: "1.2M gallons saved",
                    reward: 24300,
                    participants: [1, 2], // Dummy array for length
                    maxParticipants: 300,
                    status: 1,
                    image: null,
                  },
                  {
                    id: "top-4",
                    title: "Zero Waste Challenge",
                    impact: "18.5 tons diverted",
                    reward: 21800,
                    participants: [1, 2, 3, 4], // Dummy array for length
                    maxParticipants: 400,
                    status: 1,
                    image: null,
                  },
                ].map((project) => (
                  <ProjectCard key={project.id} project={project} onClick={() => {}} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="watchlist" className="mt-0">
              <div className="flex flex-col items-center justify-center py-12">
                <div className="text-center max-w-md">
                  <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-medium mb-2">No projects in your watchlist</h3>
                  <p className="text-muted-foreground mb-6">Add projects to your watchlist to track initiatives you're interested in supporting.</p>
                  <Button className="bg-emerald-600 hover:bg-emerald-700">Explore Projects</Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <NFTRewardsSection />

      {/* Resources */}
      <section className="py-12 border-t">
        <div className="container">
          <h2 className="text-2xl font-bold mb-8">Resources for getting started</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <motion.div variants={cardVariants} initial="initial" whileHover="hover" className="cursor-pointer" onClick={() => navigate("/resources")}>
              <Card className="bg-card border-border/40 overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="relative aspect-video overflow-hidden">
                  <motion.img src="/images/hero-tree.png" alt="Lumora Basics" variants={imageVariants} className="object-cover w-full h-full" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                </div>
                <motion.div variants={contentVariants}>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-medium mb-2">Learn the basics of Lumora</h3>
                    <p className="text-muted-foreground mb-4">Everything you need to know to get started with eco-friendly actions and token rewards.</p>
                    <Button variant="outline" className="border-emerald-600 text-emerald-500">
                      Learn More
                    </Button>
                  </CardContent>
                </motion.div>
              </Card>
            </motion.div>

            <motion.div variants={cardVariants} initial="initial" whileHover="hover" className="cursor-pointer" onClick={() => navigate("/resources")}>
              <Card className="bg-card border-border/40 overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="relative aspect-video overflow-hidden">
                  <motion.img src="/images/track.png" alt="Track Actions" variants={imageVariants} className="object-cover w-full h-full" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                </div>
                <motion.div variants={contentVariants}>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-medium mb-2">Track your eco-friendly actions</h3>
                    <p className="text-muted-foreground mb-4">Step-by-step guide to logging your sustainability efforts and earning rewards.</p>
                    <Button variant="outline" className="border-emerald-600 text-emerald-500">
                      Start Tracking
                    </Button>
                  </CardContent>
                </motion.div>
              </Card>
            </motion.div>

            <motion.div variants={cardVariants} initial="initial" whileHover="hover" className="cursor-pointer" onClick={() => navigate("/resources#community")}>
              <Card className="bg-card border-border/40 overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="relative aspect-video overflow-hidden">
                  <motion.img src="/images/white-paper.png" alt="ICP Wallet" variants={imageVariants} className="object-cover w-full h-full" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                </div>
                <motion.div variants={contentVariants}>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-medium mb-2">How Communities Work in Lumora</h3>
                    <p className="text-muted-foreground mb-4">Learn how to create and manage a thriving community as an organizer on the Lumora platform.</p>
                    <Button variant="outline" className="border-emerald-600 text-emerald-500">
                      Learn More
                    </Button>
                  </CardContent>
                </motion.div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}
