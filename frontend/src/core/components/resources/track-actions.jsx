

import { motion } from "framer-motion"
import { LineChart, CheckCircle, Camera, BarChart3, Calendar } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/core/components/ui/accordion"
import { Button } from "@/core/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/components/ui/tabs"
import TrackingAnimation from "@/core/components/resources/animations/tracking-animation"

export default function TrackActions() {
  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center mb-6">
          <LineChart className="h-8 w-8 mr-3 text-primary" />
          <h2 className="text-3xl font-bold">Track Your Eco-Friendly Actions</h2>
        </div>
        <p className="text-lg text-muted-foreground mb-8">
          Learn how to record, verify, and monitor the impact of your environmental contributions.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 mb-12">
        <Card>
          <CardHeader>
            <CardTitle>Why Track Your Actions?</CardTitle>
            <CardDescription>
              Tracking your eco-friendly actions helps quantify your impact and motivates continued participation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 mr-3 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">Measure Your Impact</h4>
                  <p className="text-muted-foreground">
                    See the quantifiable difference your actions make on the environment.
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <BarChart3 className="h-5 w-5 mr-3 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">Track Your Progress</h4>
                  <p className="text-muted-foreground">Monitor your growth and improvement over time.</p>
                </div>
              </li>
              <li className="flex items-start">
                <Calendar className="h-5 w-5 mr-3 text-purple-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">Build Consistency</h4>
                  <p className="text-muted-foreground">Develop sustainable habits through regular tracking.</p>
                </div>
              </li>
              <li className="flex items-start">
                <Camera className="h-5 w-5 mr-3 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">Verify Your Contributions</h4>
                  <p className="text-muted-foreground">Provide evidence that validates your environmental actions.</p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Tips for Effective Action Tracking</CardTitle>
          <CardDescription>Maximize your impact and rewards with these best practices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Documentation Best Practices</h4>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Take clear, well-lit photos that clearly show your action</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Include timestamps or date information when possible</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Save receipts and documentation from eco-friendly purchases</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Be specific in your action descriptions</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Maximizing Your Impact</h4>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Focus on consistent, regular actions rather than one-time efforts</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Participate in community challenges to amplify your impact</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Track diverse types of actions across different categories</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Set personal goals and track your progress over time</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
