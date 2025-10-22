import { motion } from "framer-motion";
import { MessageSquare, Users, PlusCircle, Award, Trophy, Wallet, BadgeDollarSign, PercentCircle, Sparkles, HelpCircle, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/components/ui/tabs";
import { Badge } from "@/core/components/ui/badge";
import { Progress } from "@/core/components/ui/progress";
import { Button } from "@/core/components/ui/button";
import { useNavigate } from "react-router";
import { useState } from "react";
// import { Separator } from "@/core/components/ui/separator";

export default function LearnCommunity() {
  const navigate = useNavigate();
  const [userLevel, setUserLevel] = useState("bronze");
  const [lumHolding, setLumHolding] = useState(0);

  const levels = [
    {
      name: "Bronze",
      value: "bronze",
      color: "bg-amber-600",
      borderColor: "border-amber-600",
      textColor: "text-amber-600",
      holdingRequirement: "100 LUM",
      maxReward: "100 LUM",
      fee: "5%",
    },
    {
      name: "Silver",
      value: "silver",
      color: "bg-gray-400",
      borderColor: "border-gray-400",
      textColor: "text-gray-400",
      holdingRequirement: "500 LUM",
      maxReward: "200 LUM",
      fee: "7.5%",
    },
    {
      name: "Gold",
      value: "gold",
      color: "bg-yellow-400",
      borderColor: "border-yellow-400",
      textColor: "text-yellow-400",
      holdingRequirement: "1,000 LUM",
      maxReward: "500 LUM",
      fee: "10%",
    },
    {
      name: "Platinum",
      value: "platinum",
      color: "bg-blue-400",
      borderColor: "border-blue-400",
      textColor: "text-blue-400",
      holdingRequirement: "5,000 LUM",
      maxReward: "5,000 LUM",
      fee: "15%",
    },
  ];

  const getProgressPercentage = () => {
    const currentLevel = levels.find((l) => l.value === userLevel);
    const currentIndex = levels.findIndex((l) => l.value === userLevel);
    const nextLevel = levels[currentIndex + 1];

    if (!nextLevel) return 100;

    const currentRequirement = parseInt(currentLevel.holdingRequirement);
    const nextRequirement = parseInt(nextLevel.holdingRequirement);
    const progress = ((lumHolding - currentRequirement) / (nextRequirement - currentRequirement)) * 100;

    return Math.min(Math.max(progress, 0), 100);
  };

  const getNextLevelRequirement = () => {
    const currentIndex = levels.findIndex((l) => l.value === userLevel);
    if (currentIndex === levels.length - 1) return "Maximum level reached";
    return levels[currentIndex + 1].holdingRequirement;
  };

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center mb-6">
          <Users className="h-8 w-8 mr-3 text-primary" />
          <h2 className="text-3xl font-bold">How Communities Work in Lumora</h2>
        </div>
        <p className="text-lg text-muted-foreground mb-8">Learn how to create and manage a thriving community as an organizer on the Lumora platform.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 mb-12">
        <Card>
          <CardHeader>
            <CardTitle>The Community Organizer Journey</CardTitle>
            <CardDescription>Understanding the role and responsibilities of community organizers</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Community organizers are the backbone of Lumora's ecosystem. They create and manage projects that inspire participants to take eco-friendly actions, verify contributions, and distribute rewards.</p>

            <h4 className="font-semibold text-lg mb-2">Key Responsibilities:</h4>
            <ul className="space-y-3">
              <li className="flex items-start">
                <PlusCircle className="h-5 w-5 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">Create Impactful Projects</span>
                  <p className="text-sm text-muted-foreground">Design and launch sustainability projects that engage the community.</p>
                </div>
              </li>
              <li className="flex items-start">
                <MessageSquare className="h-5 w-5 mr-2 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">Provide Feedback</span>
                  <p className="text-sm text-muted-foreground">Review participant contributions and provide constructive feedback.</p>
                </div>
              </li>
              <li className="flex items-start">
                <Award className="h-5 w-5 mr-2 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">Distribute Rewards</span>
                  <p className="text-sm text-muted-foreground">Allocate and distribute LUM tokens to recognize valuable contributions.</p>
                </div>
              </li>
              <li className="flex items-start">
                <Users className="h-5 w-5 mr-2 text-purple-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">Build Community</span>
                  <p className="text-sm text-muted-foreground">Foster an engaged and supportive community around your sustainability initiatives.</p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Community Level Section */}
      <section className="py-12 border-t">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Community Organizer Levels</h1>
          <p className="text-muted-foreground max-w-[800px]">Unlock greater rewards and benefits as you level up your community organizer status by holding more LUM tokens.</p>
        </div>
        <Tabs defaultValue="overview" className="space-y-8">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="calculator">Level Calculator</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
            </TabsList>

            <a href="#" onClick={() => navigate("/assistant")}>
              <Button variant="outline" className="gap-2">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <span>Get Help</span>
              </Button>
            </a>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {levels.map((level) => (
                <Card key={level.value} className={`border ${level.borderColor} overflow-hidden`}>
                  <CardHeader className={`${level.color} text-white pb-4`}>
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5" />
                        {level.name}
                      </CardTitle>
                      <Badge variant="outline" className="bg-background/20 text-white border-white">
                        Level {levels.findIndex((l) => l.value === level.value) + 1}
                      </Badge>
                    </div>
                    <CardDescription className="text-white">Organizer tier</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-white" />
                          <span className="text-white">Holding Requirement</span>
                        </div>
                        <span className={`font-medium text-white`}>{level.holdingRequirement}</span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <BadgeDollarSign className="h-4 w-4 text-white" />
                          <span className="text-white">Maximum Reward</span>
                        </div>
                        <span className={`font-medium text-white`}>{level.maxReward}</span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <PercentCircle className="h-4 w-4 text-white" />
                          <span className="text-white">Fee to Organizer</span>
                        </div>
                        <span className={`font-medium text-white`}>{level.fee}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-card border rounded-lg p-6 space-y-6">
              <div className="flex flex-col gap-2">
                <h2 className="text-xl font-semibold">How the Level System Works</h2>
                <p className="text-muted-foreground">As a community organizer, your level is determined by the amount of LUM tokens you hold in your wallet. Higher levels unlock greater rewards and benefits, but also come with increased responsibilities.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">1. Hold LUM Tokens</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Maintain the required amount of LUM tokens in your wallet to qualify for each level. Your level is automatically updated based on your holdings.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">2. Create Projects / Challenges</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Design and launch sustainability challenges with rewards up to your level's maximum. Higher levels allow for more complex and rewarding initiatives.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">3. Earn Fees</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Receive a percentage of all rewards distributed through your challenges. Higher levels earn larger percentages, incentivizing growth.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Calculator Tab */}
          <TabsContent value="calculator" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Level Calculator</CardTitle>
                <CardDescription>See your current level and what you need to reach the next tier</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="level-select" className="text-sm font-medium">
                      Select your current community account level
                    </label>
                    <select id="level-select" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" value={userLevel} onChange={(e) => setUserLevel(e.target.value)}>
                      {levels.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="lum-holding" className="text-sm font-medium">
                      Your current LUM holdings
                    </label>
                    <input id="lum-holding" type="number" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" value={lumHolding} placeholder="0" onChange={(e) => setLumHolding(Number.parseInt(e.target.value))} min="0" max="5000" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress to next level</span>
                    <span>{getProgressPercentage().toFixed(0)}%</span>
                  </div>
                  <Progress value={getProgressPercentage()} className="h-2" />
                </div>

                <div className="rounded-lg border bg-card p-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Trophy className={`h-5 w-5 ${levels.find((l) => l.value === userLevel)?.textColor}`} />
                        <span className="font-medium">Current Level: {levels.find((l) => l.value === userLevel)?.name}</span>
                      </div>
                      <Badge variant="outline" className={`${levels.find((l) => l.value === userLevel)?.textColor}`}>
                        {levels.find((l) => l.value === userLevel)?.holdingRequirement}
                      </Badge>
                    </div>

                    {/* <Separator /> */}

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Maximum reward per challenge</span>
                        <span className="font-medium">{levels.find((l) => l.value === userLevel)?.maxReward}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Fee earned on rewards</span>
                        <span className="font-medium">{levels.find((l) => l.value === userLevel)?.fee}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">LUM needed for next level</span>
                        <span className="font-medium">{typeof getNextLevelRequirement() === "number" ? `${getNextLevelRequirement()} LUM` : getNextLevelRequirement()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Earnings Potential</CardTitle>
                <CardDescription>Estimate your potential earnings as a community organizer</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Monthly Challenges</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">5</div>
                        <p className="text-sm text-muted-foreground">Average for your level</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Completion Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">75%</div>
                        <p className="text-sm text-muted-foreground">Average for your level</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Potential Earnings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-emerald-500">{((Number.parseInt(levels.find((l) => l.value === userLevel)?.maxReward) * 5 * 0.75 * Number.parseInt(levels.find((l) => l.value === userLevel)?.fee)) / 100).toFixed(0)} LUM</div>
                        <p className="text-sm text-muted-foreground">Monthly estimate</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 flex items-start gap-3">
                    <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">Earnings are estimated based on average challenge completion rates and reward distributions. Actual earnings may vary based on challenge design, participant engagement, and other factors.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>Common questions about the community organizer level system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {[
                    {
                      question: "How is my organizer level determined?",
                      answer: "Your level is determined by the amount of LUM tokens you hold in your account. The system automatically checks your balance and assigns the appropriate level.",
                    },
                    {
                      question: "How are organizer fees calculated and distributed?",
                      answer: "Organizer fees are calculated as a percentage of the rewards distributed to participants who complete your projects. Fees are automatically transferred to your wallet when rewards are distributed.",
                    },
                    {
                      question: "Can I create projects with rewards higher than my level's maximum?",
                      answer: "No, the maximum reward per challenge is limited by your current level. To create projects with higher rewards, you'll need to increase your LUM holdings to reach the next level.",
                    },
                    {
                      question: "How often are levels updated?",
                      answer: "Your level is updated in real-time based on your LUM holdings. As soon as you acquire enough tokens to reach the next level, your benefits and capabilities will be upgraded automatically.",
                    },
                  ].map((faq, i) => (
                    <div key={i} className="space-y-2">
                      <h3 className="font-medium flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-emerald-500" />
                        {faq.question}
                      </h3>
                      <p className="text-sm text-muted-foreground pl-6">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
