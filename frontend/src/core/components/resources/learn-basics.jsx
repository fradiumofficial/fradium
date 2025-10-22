import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card";
import { BookOpen, Lightbulb, Users, Leaf, Award } from "lucide-react";
import PlatformAnimation from "@/core/components/resources/animations/platform-animation";

export default function LearnBasics() {
  const [activeTab, setActiveTab] = useState("what-is-lumora");

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center mb-6">
          <BookOpen className="h-8 w-8 mr-3 text-primary" />
          <h2 className="text-3xl font-bold">Learn the Basics of Lumora</h2>
        </div>
        <p className="text-lg text-muted-foreground mb-8">Discover how Lumora works and how you can use it to make a positive impact on the environment.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div>
          <PlatformAnimation />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>What is Lumora?</CardTitle>
            <CardDescription>Lumora is a platform that rewards users for eco-friendly actions while building a sustainable community.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">At its core, Lumora connects individuals, communities, and organizations committed to environmental sustainability. Through our platform, you can:</p>
            <ul className="space-y-3">
              <li className="flex items-start">
                <Leaf className="h-5 w-5 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Track and verify your eco-friendly actions</span>
              </li>
              <li className="flex items-start">
                <Award className="h-5 w-5 mr-2 text-amber-500 mt-0.5 flex-shrink-0" />
                <span>Earn rewards for your positive environmental impact</span>
              </li>
              <li className="flex items-start">
                <Users className="h-5 w-5 mr-2 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>Connect with like-minded individuals and organizations</span>
              </li>
              <li className="flex items-start">
                <Lightbulb className="h-5 w-5 mr-2 text-purple-500 mt-0.5 flex-shrink-0" />
                <span>Learn about new ways to reduce your environmental footprint</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="what-is-lumora" value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="what-is-lumora">Core Concepts</TabsTrigger>
          <TabsTrigger value="how-it-works">How It Works</TabsTrigger>
          <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
        </TabsList>

        <TabsContent value="what-is-lumora">
          <Card>
            <CardHeader>
              <CardTitle>Core Concepts</CardTitle>
              <CardDescription>Understanding the fundamental principles of Lumora</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-lg mb-2">Eco-Actions</h4>
                <p>Eco-Actions are verifiable activities that have a positive impact on the environment. These can range from reducing energy consumption to participating in community clean-ups.</p>
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-2">Impact Points</h4>
                <p>Each Eco-Action earns you Impact Points, which quantify your environmental contribution. These points reflect the significance and consistency of your actions.</p>
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-2">Community Challenges</h4>
                <p>Join forces with others in Community Challenges to amplify your impact. Collaborative efforts often yield greater rewards and foster a sense of shared purpose.</p>
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-2">Rewards System</h4>
                <p>Your Impact Points can be exchanged for various rewards, including digital assets, exclusive access to sustainable products, and community recognition.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="how-it-works">
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
              <CardDescription>The process of using Lumora from registration to rewards</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-6 relative before:absolute before:left-3 before:top-2 before:h-[calc(100%-16px)] before:w-[1px] before:bg-border">
                <li className="pl-10 relative">
                  <div className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">1</div>
                  <h4 className="font-semibold text-lg mb-1">Create Your Account</h4>
                  <p className="text-muted-foreground">Sign up with your email or connect your social accounts to create your Lumora profile.</p>
                </li>
                <li className="pl-10 relative">
                  <div className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">2</div>
                  <h4 className="font-semibold text-lg mb-1">Set Up Your Internet Identity</h4>
                  <p className="text-muted-foreground">Connect or create an Internet Computer Protocol wallet to store your digital assets.</p>
                </li>
                <li className="pl-10 relative">
                  <div className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">3</div>
                  <h4 className="font-semibold text-lg mb-1">Perform Eco-Actions</h4>
                  <p className="text-muted-foreground">Complete eco-friendly activities and log them in your Lumora account.</p>
                </li>
                <li className="pl-10 relative">
                  <div className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">4</div>
                  <h4 className="font-semibold text-lg mb-1">Verify Your Actions</h4>
                  <p className="text-muted-foreground">Submit evidence of your eco-actions for verification through our transparent process.</p>
                </li>
                <li className="pl-10 relative">
                  <div className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">5</div>
                  <h4 className="font-semibold text-lg mb-1">Earn Impact Points</h4>
                  <p className="text-muted-foreground">Receive Impact Points based on the verified environmental impact of your actions.</p>
                </li>
                <li className="pl-10 relative">
                  <div className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">6</div>
                  <h4 className="font-semibold text-lg mb-1">Redeem Rewards</h4>
                  <p className="text-muted-foreground">Exchange your Impact Points for rewards or contribute to community initiatives.</p>
                </li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="getting-started">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>Your first steps with Lumora</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold text-lg mb-2">Complete Your Profile</h4>
                <p className="mb-2">Add your information, interests, and environmental goals to personalize your experience.</p>
                <ul className="list-disc pl-5 text-muted-foreground">
                  <li>Upload a profile picture</li>
                  <li>Set your location to find local initiatives</li>
                  <li>Select your areas of environmental interest</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-lg mb-2">Join Your First Challenge</h4>
                <p className="mb-2">Browse available challenges and join one that aligns with your interests and capabilities.</p>
                <ul className="list-disc pl-5 text-muted-foreground">
                  <li>Explore the Challenges section</li>
                  <li>Read the requirements and rewards</li>
                  <li>Click "Join Challenge" to participate</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-lg mb-2">Log Your First Eco-Action</h4>
                <p className="mb-2">Record an eco-friendly action you've taken to start earning Impact Points.</p>
                <ul className="list-disc pl-5 text-muted-foreground">
                  <li>Go to the "Track Actions" section</li>
                  <li>Select the type of action you performed</li>
                  <li>Provide details and evidence</li>
                  <li>Submit for verification</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-lg mb-2">Connect with the Community</h4>
                <p className="mb-2">Engage with other Lumora users to share experiences and learn from each other.</p>
                <ul className="list-disc pl-5 text-muted-foreground">
                  <li>Join discussion forums</li>
                  <li>Follow other users with similar interests</li>
                  <li>Share your achievements on your profile</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
