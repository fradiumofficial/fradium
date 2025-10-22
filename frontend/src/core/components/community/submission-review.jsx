import { useState, useEffect } from "react";
import { Search, Filter, ArrowUpDown, CheckCircle, XCircle, MessageSquare, Eye, Award, Clock, Loader2 } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/ui/dialog";
import { Textarea } from "@/core/components/ui/textarea";
import { Label } from "@/core/components/ui/label";
import { EmptyState } from "@/core/components/ui/empty-state";
import { backend } from "declarations/backend";
import { toast } from "react-toastify";

export function SubmissionReview() {
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setIsLoading(true);
      const result = await backend.getCommunitySubmissions();
      if ("Ok" in result) {
        const formattedSubmissions = result.Ok.map((submission) => ({
          id: Number(submission.id),
          title: submission.projectName,
          user: {
            name: submission.participant.name,
            avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${submission.participant.name}`,
          },
          challenge: submission.projectName,
          submittedAt: new Date(Number(submission.timestamp) / 1000000).toISOString(),
          status: Object.keys(submission.status)[0] === "pending" ? "Pending" : Object.keys(submission.status)[0] === "approved" ? "Approved" : "Rejected",
          evidence: submission.description,
          description: submission.description,
          imageData: submission.imageData,
        }));
        setSubmissions(formattedSubmissions);
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast.error("Failed to fetch submissions");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSubmissions = submissions.filter((submission) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = submission.title.toLowerCase().includes(searchLower) || submission.user.name.toLowerCase().includes(searchLower) || submission.description.toLowerCase().includes(searchLower) || submission.evidence.toLowerCase().includes(searchLower);
    const matchesTab = activeTab === "all" || submission.status.toLowerCase() === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleReviewSubmission = (submission) => {
    setSelectedSubmission(submission);
    setReviewFeedback("");
    setIsReviewDialogOpen(true);
  };

  const handleFeedbackSubmission = async (status) => {
    if (!selectedSubmission) return;

    try {
      if (status === "approved") {
        setIsApproving(true);
      } else {
        setIsRejecting(true);
      }
      console.log("submission", selectedSubmission);

      const result = await backend.feedbackEvidence({
        evidenceId: selectedSubmission.id,
        feedback: reviewFeedback,
        status: status === "approved" ? { approved: null } : { rejected: null },
      });

      console.log("result", result);

      if ("Ok" in result) {
        toast.success(`Submission ${status} successfully`);
        await fetchSubmissions();
        setIsReviewDialogOpen(false);
        setReviewFeedback("");
      } else {
        toast.error(result.Err);
      }
    } catch (error) {
      console.error(`Error ${status} submission:`, error);
      toast.error(`Failed to ${status} submission`);
    } finally {
      setIsApproving(false);
      setIsRejecting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Approved":
        return <Badge className="bg-emerald-500">Approved</Badge>;
      case "Rejected":
        return <Badge className="bg-red-500">Rejected</Badge>;
      case "Pending":
        return <Badge className="bg-amber-500">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return <div>Loading submissions...</div>;
  }

  const renderEmptyState = (title, description) => <EmptyState title={title} description={description} variant="inbox" icon={MessageSquare} className="mt-8" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by title, user, or description..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending Review</TabsTrigger>
          <TabsTrigger value="all">All Submissions</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {filteredSubmissions.length === 0 ? (
            renderEmptyState("No Pending Submissions", "There are no submissions awaiting review at the moment.")
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle>Submissions Awaiting Review</CardTitle>
                </div>
                <CardDescription>Review and approve participant submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredSubmissions.map((submission) => (
                    <Card key={submission.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-3">
                            <div className="relative h-10 w-10 overflow-hidden rounded-full">
                              <img src={submission.user.avatar} alt="User avatar" className="h-full w-full object-cover" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{submission.title}</CardTitle>
                              <CardDescription className="text-sm">
                                By {submission.user.name} • {new Date(submission.submittedAt).toLocaleString()}
                              </CardDescription>
                            </div>
                          </div>
                          {getStatusBadge(submission.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <div className="space-y-3">
                          <div className="flex items-center text-sm">
                            <Award className="h-4 w-4 mr-2 text-amber-500" />
                            <span className="font-medium">Impact:</span>
                            <span className="ml-2">{submission.impact}</span>
                          </div>
                          <div className="flex items-start text-sm">
                            <Eye className="h-4 w-4 mr-2 text-blue-500 mt-1" />
                            <span className="font-medium">Description:</span>
                            <span className="ml-2">{submission.evidence}</span>
                          </div>
                          {submission.imageData && submission.imageData.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              {submission.imageData.map((image, index) => (
                                <img key={index} src={URL.createObjectURL(new Blob([image], { type: "image/jpeg" }))} alt={`Evidence ${index + 1}`} className="rounded-md" />
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="border-t pt-4 flex justify-end">
                        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleReviewSubmission(submission)}>
                          Review Submission
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          {filteredSubmissions.length === 0 ? (
            renderEmptyState("No Submissions Found", "There are no submissions to display at the moment.")
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>All Submissions</CardTitle>
                <CardDescription>View and manage all participant submissions</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="rounded-md border">
                  <div className="grid grid-cols-12 p-4 bg-muted text-sm font-medium">
                    <div className="col-span-4">Submission</div>
                    <div className="col-span-2">Challenge</div>
                    <div className="col-span-2">Submitted</div>
                    <div className="col-span-2">User</div>
                    <div className="col-span-1 text-center">Status</div>
                    <div className="col-span-1 text-center">Actions</div>
                  </div>
                  <div className="divide-y">
                    {filteredSubmissions.map((submission) => (
                      <div key={submission.id} className="grid grid-cols-12 p-4 items-center">
                        <div className="col-span-4">
                          <div className="font-medium">{submission.title}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-xs">{submission.evidence}</div>
                        </div>
                        <div className="col-span-2">
                          <div className="text-sm">{submission.challenge}</div>
                        </div>
                        <div className="col-span-2 text-sm">
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                            <span>{new Date(submission.submittedAt).toLocaleDateString()}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">{new Date(submission.submittedAt).toLocaleTimeString()}</div>
                        </div>
                        <div className="col-span-2">
                          <div className="flex items-center">
                            <div className="relative h-6 w-6 me-2 overflow-hidden rounded-full">
                              <img src={submission.user.avatar} alt="User avatar" className="h-full w-full object-cover" />
                            </div>
                            <span className="text-sm">{submission.user.name}</span>
                          </div>
                        </div>
                        <div className="col-span-1 text-center">{getStatusBadge(submission.status)}</div>
                        <div className="col-span-1 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => handleReviewSubmission(submission)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-6">
                <div className="text-sm text-muted-foreground">Showing {filteredSubmissions.length} submissions</div>
              </CardFooter>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          {filteredSubmissions.length === 0 ? (
            renderEmptyState("No Approved Submissions", "There are no approved submissions to display at the moment.")
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {filteredSubmissions
                    .filter((s) => s.status === "Approved")
                    .map((submission) => (
                      <div key={submission.id} className="flex items-start p-4 border rounded-lg">
                        <div className="relative h-10 w-10 me-2 overflow-hidden rounded-full">
                          <img src={submission.user.avatar} alt="User avatar" className="h-full w-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{submission.title}</div>
                              <div className="text-sm text-muted-foreground">
                                By {submission.user.name} • {new Date(submission.submittedAt).toLocaleString()}
                              </div>
                            </div>
                            {getStatusBadge(submission.status)}
                          </div>
                          <div className="mt-2 text-sm">
                            <span className="font-medium">Challenge:</span> {submission.challenge}
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">{submission.description}</div>
                          {submission.imageData && submission.imageData.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              {submission.imageData.map((image, index) => (
                                <img key={index} src={URL.createObjectURL(new Blob([image], { type: "image/jpeg" }))} alt={`Evidence ${index + 1}`} className="rounded-md" />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          {filteredSubmissions.length === 0 ? (
            renderEmptyState("No Rejected Submissions", "There are no rejected submissions to display at the moment.")
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {filteredSubmissions
                    .filter((s) => s.status === "Rejected")
                    .map((submission) => (
                      <div key={submission.id} className="flex items-start p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{submission.title}</div>
                              <div className="text-sm text-muted-foreground">
                                By {submission.user.name} • {new Date(submission.submittedAt).toLocaleString()}
                              </div>
                            </div>
                            {getStatusBadge(submission.status)}
                          </div>
                          <div className="mt-2 text-sm">
                            <span className="font-medium">Challenge:</span> {submission.challenge}
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">{submission.description}</div>
                          {submission.imageData && submission.imageData.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              {submission.imageData.map((image, index) => (
                                <img key={index} src={URL.createObjectURL(new Blob([image], { type: "image/jpeg" }))} alt={`Evidence ${index + 1}`} className="rounded-md" />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Review Submission</DialogTitle>
            <DialogDescription>Review the submission details and provide feedback</DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <img src={selectedSubmission.user.avatar} alt={selectedSubmission.user.name} className="h-10 w-10 rounded-full" />
                <div>
                  <div className="font-medium">{selectedSubmission.user.name}</div>
                  <div className="text-sm text-muted-foreground">Submitted on {new Date(selectedSubmission.submittedAt).toLocaleString()}</div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">{selectedSubmission.title}</h3>
                <div className="text-sm">
                  <span className="font-medium">Challenge:</span> {selectedSubmission.challenge}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Evidence:</span> {selectedSubmission.evidence}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback">Feedback</Label>
                <Textarea id="feedback" placeholder="Provide feedback for the participant..." value={reviewFeedback} onChange={(e) => setReviewFeedback(e.target.value)} rows={4} />
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)} disabled={isApproving || isRejecting}>
              Cancel
            </Button>
            <div className="flex space-x-2">
              <Button variant="destructive" onClick={() => handleFeedbackSubmission("rejected")} disabled={!reviewFeedback || isApproving}>
                {isRejecting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </>
                )}
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleFeedbackSubmission("approved")} disabled={!reviewFeedback || isRejecting}>
                {isApproving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
