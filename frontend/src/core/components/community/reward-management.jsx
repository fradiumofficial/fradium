import { useState, useEffect } from "react";
import { Search, Leaf, Award, User, Calendar, Clock, CheckCircle, Send } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/ui/dialog";
import { Label } from "@/core/components/ui/label";
import { Textarea } from "@/core/components/ui/textarea";
import { backend } from "declarations/backend";
import { toast } from "react-toastify";

export function RewardManagement() {
  const [isDistributeDialogOpen, setIsDistributeDialogOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [distributionMessage, setDistributionMessage] = useState("");
  const [rewards, setRewards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDistributing, setIsDistributing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    try {
      setIsLoading(true);
      const result = await backend.getCommunityRewards();

      if (result.Ok) {
        const transformedRewards = result.Ok.map((project) => {
          // Count approved evidence as recipients
          const recipients = project.evidence.filter((evidence) => JSON.stringify(evidence.status) === `{"approved":null}`).length;

          // Calculate total reward amount
          const totalAmount = parseInt(project.reward) * recipients;

          // Determine status based on project status
          const status = parseInt(project.status) === 2 ? "Distributed" : "Pending";

          // Format dates
          const dueDate = new Date(Number(project.expiredAt) / 1000000).toISOString().split("T")[0];
          const distributedDate = status === "Distributed" ? new Date().toISOString().split("T")[0] : null;

          return {
            id: project.id,
            title: project.title,
            name: project.title,
            recipients: project.participants.length,
            totalAmount: totalAmount,
            individualAmount: parseInt(project.reward),
            status: status,
            dueDate: dueDate,
            distributedDate: distributedDate,
            projectId: project.id,
          };
        });

        setRewards(transformedRewards);
      } else {
        setError(result.Err);
        toast.error(`Failed to fetch rewards: ${result.Err}`);
      }
    } catch (err) {
      setError(err.message);
      toast.error(`Error fetching rewards: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDistributeReward = async (reward) => {
    try {
      setSelectedReward(reward);
      setDistributionMessage(`Congratulations on completing the ${reward.name}! You've earned ${reward.individualAmount} LUM tokens for your contribution to sustainability.`);
      setIsDistributeDialogOpen(true);
    } catch (error) {
      console.error("Error preparing distribution:", error);
      toast.error(`Error preparing distribution: ${error.message}`);
    }
  };

  const handleConfirmDistribution = async () => {
    try {
      if (!selectedReward) return;

      setIsDistributing(true);
      const result = await backend.distributeRewards(selectedReward.projectId);

      if (result.Ok) {
        // Refresh rewards after successful distribution
        await fetchRewards();
        setIsDistributeDialogOpen(false);
        setSelectedReward(null);
        setDistributionMessage("");
        toast.success(`Successfully distributed ${selectedReward.totalAmount} LUM to ${selectedReward.recipients} participants!`);
      } else {
        console.error("Failed to distribute rewards:", result.Err);
        toast.error(`Failed to distribute rewards: ${result.Err}`);
      }
    } catch (error) {
      console.error("Error distributing rewards:", error);
      toast.error(`Error distributing rewards: ${error.message}`);
    } finally {
      setIsDistributing(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Distributed":
        return <Badge className="bg-emerald-500">Distributed</Badge>;
      case "Pending":
        return <Badge className="bg-amber-500">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "Challenge":
        return <Award className="h-4 w-4 text-amber-500" />;
      case "Project":
        return <Leaf className="h-4 w-4 text-emerald-500" />;
      default:
        return <Award className="h-4 w-4" />;
    }
  };

  const getCommunityFee = (level) => {
    switch (level) {
      case "bronze":
        return { fee: 5, maxReward: 100 };
      case "silver":
        return { fee: 10, maxReward: 500 };
      case "gold":
        return { fee: 15, maxReward: 2000 };
      case "diamond":
        return { fee: 20, maxReward: 5000 };
      default:
        return { fee: 5, maxReward: 100 };
    }
  };

  const calculateCommunityFee = (totalAmount, level) => {
    const { fee } = getCommunityFee(level);
    return (totalAmount * fee) / 100;
  };

  const filteredRewards = rewards.filter((reward) => {
    const matchesSearch = reward.title.toLowerCase().includes(searchQuery.toLowerCase()) || reward.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || reward.status.toLowerCase() === statusFilter;
    const matchesTab = activeTab === "all" || (activeTab === "pending" && reward.status === "Pending") || (activeTab === "distributed" && reward.status === "Distributed");

    return matchesSearch && matchesStatus && matchesTab;
  });

  if (isLoading) {
    return <div>Loading rewards...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search rewards..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="distributed">Distributed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending Distribution</TabsTrigger>
          <TabsTrigger value="all">All Rewards</TabsTrigger>
          <TabsTrigger value="distributed">Distributed</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Rewards Pending Distribution</CardTitle>
              </div>
              <CardDescription>Distribute rewards to participants who have completed challenges or projects</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredRewards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Award className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No pending rewards</h3>
                  <p className="text-sm text-muted-foreground mt-2">There are currently no rewards pending distribution.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRewards
                    .filter((r) => r.status === "Pending")
                    .map((reward) => (
                      <Card key={reward.id} className="overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              {getTypeIcon(reward.type)}
                              <CardTitle className="text-base">{reward.title}</CardTitle>
                            </div>
                            {getStatusBadge(reward.status)}
                          </div>
                          <CardDescription className="text-sm">
                            {reward.type}: {reward.name}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-3">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <div className="text-sm text-muted-foreground">Recipients</div>
                              <div className="font-medium flex items-center">
                                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                                {reward.recipients} participants
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-sm text-muted-foreground">Individual Reward</div>
                              <div className="font-medium flex items-center">
                                <Leaf className="h-4 w-4 mr-2 text-emerald-500" />
                                {reward.individualAmount} LUM
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-sm text-muted-foreground">Total Amount</div>
                              <div className="font-medium flex items-center">
                                <Leaf className="h-4 w-4 mr-2 text-emerald-500" />
                                {reward.totalAmount} LUM
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 flex items-center text-sm">
                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="text-muted-foreground">Due by:</span>
                            <span className="ml-2 font-medium">{new Date(reward.dueDate).toLocaleDateString()}</span>
                          </div>
                        </CardContent>
                        <CardFooter className="border-t pt-4 flex justify-end">
                          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleDistributeReward(reward)}>
                            <Send className="h-4 w-4 mr-2" />
                            Distribute Rewards
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>All Rewards</CardTitle>
              <CardDescription>View and manage all reward distributions</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {filteredRewards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Award className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No rewards found</h3>
                  <p className="text-sm text-muted-foreground mt-2">{searchQuery ? "No rewards match your search criteria." : "There are no rewards to display."}</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <div className="grid grid-cols-12 p-4 bg-muted text-sm font-medium">
                    <div className="col-span-4">Reward</div>
                    <div className="col-span-1 text-center">Type</div>
                    <div className="col-span-2 text-center">Recipients</div>
                    <div className="col-span-2 text-center">Amount</div>
                    <div className="col-span-2 text-center">Date</div>
                    <div className="col-span-1 text-center">Status</div>
                  </div>
                  <div className="divide-y">
                    {filteredRewards.map((reward) => (
                      <div key={reward.id} className="grid grid-cols-12 p-4 items-center">
                        <div className="col-span-4">
                          <div className="font-medium">{reward.title}</div>
                          <div className="text-sm text-muted-foreground">{reward.name}</div>
                        </div>
                        <div className="col-span-1 text-center">
                          <div className="flex items-center justify-center">
                            {getTypeIcon(reward.type)}
                            <span className="sr-only">{reward.type}</span>
                          </div>
                        </div>
                        <div className="col-span-2 text-center">
                          <div className="flex items-center justify-center">
                            <User className="h-3 w-3 mr-1 text-muted-foreground" />
                            <span>{reward.recipients}</span>
                          </div>
                        </div>
                        <div className="col-span-2 text-center">
                          <div className="flex flex-col items-center">
                            <div className="flex items-center">
                              <Leaf className="h-3 w-3 mr-1 text-emerald-500" />
                              <span>{reward.individualAmount} LUM</span>
                            </div>
                            <div className="text-xs text-muted-foreground">Total: {reward.totalAmount} LUM</div>
                          </div>
                        </div>
                        <div className="col-span-2 text-center text-sm">
                          {reward.status === "Distributed" ? (
                            <div className="flex items-center justify-center">
                              <CheckCircle className="h-3 w-3 mr-1 text-emerald-500" />
                              <span>{new Date(reward.distributedDate).toLocaleDateString()}</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <Clock className="h-3 w-3 mr-1 text-amber-500" />
                              <span>Due: {new Date(reward.dueDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                        <div className="col-span-1 text-center">{getStatusBadge(reward.status)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between pt-6">
              <div className="text-sm text-muted-foreground">Showing {filteredRewards.length} rewards</div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Next
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="distributed" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              {filteredRewards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No distributed rewards</h3>
                  <p className="text-sm text-muted-foreground mt-2">There are no distributed rewards to display.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRewards
                    .filter((r) => r.status === "Distributed")
                    .map((reward) => (
                      <div key={reward.id} className="flex items-start p-4 border rounded-lg">
                        <div className="p-2 rounded-full bg-emerald-500/10 mr-4">{getTypeIcon(reward.type)}</div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{reward.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {reward.type}: {reward.name}
                              </div>
                            </div>
                            {getStatusBadge(reward.status)}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
                            <div className="text-sm">
                              <span className="text-muted-foreground">Recipients:</span> <span className="font-medium">{reward.recipients} participants</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-muted-foreground">Individual Amount:</span> <span className="font-medium">{reward.individualAmount} LUM</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-muted-foreground">Total Amount:</span> <span className="font-medium">{reward.totalAmount} LUM</span>
                            </div>
                          </div>
                          <div className="mt-2 text-sm flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1 text-emerald-500" />
                            <span className="text-muted-foreground">Distributed on:</span> <span className="font-medium ml-1">{new Date(reward.distributedDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Distribute Rewards Dialog */}
      <Dialog open={isDistributeDialogOpen} onOpenChange={setIsDistributeDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Distribute Rewards</DialogTitle>
            <DialogDescription>Confirm reward distribution to all eligible participants</DialogDescription>
          </DialogHeader>

          {selectedReward && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  {getTypeIcon(selectedReward.type)}
                  <span className="font-medium">{selectedReward.title}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Recipients</div>
                    <div className="font-medium flex items-center">
                      <User className="h-4 w-4 mr-2 text-muted-foreground" />
                      {selectedReward.recipients} participants
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Individual Reward</div>
                    <div className="font-medium flex items-center">
                      <Leaf className="h-4 w-4 mr-2 text-emerald-500" />
                      {selectedReward.individualAmount} LUM
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Total Amount</div>
                    <div className="font-medium flex items-center">
                      <Leaf className="h-4 w-4 mr-2 text-emerald-500" />
                      {selectedReward.totalAmount} LUM
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">LUM you will get</div>
                    <div className="font-medium flex items-center">
                      <Leaf className="h-4 w-4 mr-2 text-emerald-500" />
                      {calculateCommunityFee(selectedReward.totalAmount, selectedReward.projectLevel)} LUM
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Distribution Message</Label>
                <Textarea id="message" placeholder="Message to send to recipients..." value={distributionMessage} onChange={(e) => setDistributionMessage(e.target.value)} rows={4} />
                <p className="text-xs text-muted-foreground">This message will be sent to all recipients along with their reward notification.</p>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setIsDistributeDialogOpen(false);
                setSelectedReward(null);
                setDistributionMessage("");
              }}>
              Cancel
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleConfirmDistribution} disabled={!selectedReward}>
              {isDistributing ? (
                "Distributing..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Distribute {selectedReward?.totalAmount} LUM
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
