import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/components/ui/tabs";
import { ProjectManagement } from "@/core/components/community/project-management";
import { SubmissionReview } from "@/core/components/community/submission-review";
import { RewardManagement } from "@/core/components/community/reward-management";
import CommunityBalance from "../core/components/community/community-balance";
import { useSearchParams } from "react-router";

export default function CommunityDashboardPage() {
  const [searchParams] = useSearchParams();

  return (
    <main className="flex-1 container py-8 ">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Community Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage projects, challenges, and rewards for the Lumora community</p>
        </div>
      </div>

      <Tabs defaultValue={`${searchParams.get("tab") || "projects"}`} className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="balance">Balance</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-6">
          <ProjectManagement />
        </TabsContent>

        <TabsContent value="submissions" className="space-y-6">
          <SubmissionReview />
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6">
          <RewardManagement />
        </TabsContent>

        <TabsContent value="balance" className="space-y-6">
          <CommunityBalance />
        </TabsContent>
      </Tabs>
    </main>
  );
}
