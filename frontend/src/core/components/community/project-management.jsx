import { useState, useEffect } from "react";
import { Plus, Search, Edit, Eye, Users, Calendar, Leaf, Ban, Clock, CalendarClock, HelpCircle, ArrowRight, ChevronRight, Trophy } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/core/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { ProjectForm } from "@/core/components/community/project-form";
import { backend } from "declarations/backend";
import { useAuth } from "@/core/providers/auth-provider";
import { useNavigate } from "react-router";
import { EmptyState } from "@/core/components/ui/empty-state";
import { Award } from "lucide-react";
import { toast } from "react-toastify";

export function ProjectManagement() {
  const { isAuthenticated, identity } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingCommunityLevel, setIsFetchingCommunityLevel] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [communityLevel, setCommunityLevel] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
      fetchCommunityLevel();
    }
  }, [isAuthenticated]);

  const fetchCommunityLevel = async () => {
    try {
      setIsFetchingCommunityLevel(true);
      const result = await backend.getCommunityLevel(identity.getPrincipal());
      setIsFetchingCommunityLevel(false);
      setCommunityLevel(Object.keys(result.Ok)[0]);
    } catch (error) {
      console.error("Error fetching community level:", error);
      setCommunityLevel({ level: "bronze", error: "Failed to fetch community level" });
      toast.error(error.message || "Failed to fetch community level");
    } finally {
      setIsFetchingCommunityLevel(false);
    }
  };

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const response = await backend.getCommunityProjects();
      if (response.Ok) {
        // Sort projects by createdAt in descending order (latest first)
        const sortedProjects = response.Ok.map((project) => ({
          id: project.id,
          title: project.title,
          description: project.description,
          category: project.category,
          startDate: new Date(Number(project.startDate) / 1000000),
          expiredAt: new Date(Number(project.expiredAt) / 1000000),
          participants: project.participants.length,
          reward: Number(project.reward),
          status: Number(project.status),
          maxParticipants: Number(project.maxParticipants),
          address: project.address,
          impact: project.impact,
          evidence: project.evidence,
          createdAt: Number(project.createdAt),
        })).sort((a, b) => b.createdAt - a.createdAt);
        setProjects(sortedProjects);
      } else {
        toast.error(response.Err || "Failed to fetch projects");
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error(error.message || "Failed to fetch projects");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
  };

  const handleCategoryChange = (value) => {
    setCategoryFilter(value);
  };

  const handleCreateProject = async (projectData) => {
    try {
      setIsSubmitting(true);

      if (!identity) {
        toast.error("Please login first");
        return;
      }

      // Convert dates to nanoseconds
      const startDate = BigInt(projectData.startDate.getTime() * 1_000_000);
      const expiredAt = BigInt(projectData.endDate.getTime() * 1_000_000);

      // Handle image upload if exists
      let imageData = null;
      if (projectData.image) {
        try {
          // Convert File to Uint8Array
          const arrayBuffer = await projectData.image.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          // Convert to array of Nat8
          imageData = Array.from(uint8Array);
        } catch (fileError) {
          console.error("Error processing file:", fileError);
          toast.error(`Failed to process image: ${fileError.message}`);
          return;
        }
      }

      // Prepare project parameters
      const params = {
        title: projectData.title,
        description: projectData.description,
        startDate: startDate,
        expiredAt: expiredAt,
        reward: BigInt(projectData.reward),
        imageData: imageData ? [imageData] : [],
        category: { [projectData.category]: null },
        maxParticipants: BigInt(projectData.maxParticipants),
        address: projectData.address,
        impact: projectData.impact,
      };

      // Call backend to create project
      const response = await backend.createProject(params);

      if ("Ok" in response) {
        toast.success("Project created successfully");
        setIsCreateDialogOpen(false);
        fetchProjects(); // Refresh project list
      } else {
        toast.error(response.Err || "Failed to create project");
      }
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error(error.message || "Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProjects = projects.filter((project) => {
    // Search filter
    const matchesSearch = searchQuery === "" || project.title.toLowerCase().includes(searchQuery.toLowerCase()) || project.description.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "0" && project.status === 0) || // inactive
      (statusFilter === "1" && project.status === 1) || // active
      (statusFilter === "2" && project.status === 2) || // upcoming
      (statusFilter === "3" && project.status === 3); // closed

    // Category filter
    const matchesCategory = categoryFilter === "all" || Object.keys(project.category)[0].toLowerCase() === categoryFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const renderProjectStatus = (status) => {
    status = parseInt(status);
    switch (status) {
      case 0: // inactive
        return (
          <Badge variant="secondary" className="bg-red-500/20 text-red-400">
            <Ban className="h-3 w-3 mr-1" />
            Inactive
          </Badge>
        );
      case 1: // active
        return (
          <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400">
            <Leaf className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case 2: // upcoming
        return (
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
            <CalendarClock className="h-3 w-3 mr-1" />
            Upcoming
          </Badge>
        );
      case 3: // closed
        return (
          <Badge variant="secondary" className="bg-gray-500/20 text-gray-400">
            <Clock className="h-3 w-3 mr-1" />
            Closed
          </Badge>
        );
      case 4: // distributed
        return (
          <Badge variant="secondary" className="bg-green-500/20 text-green-400">
            <Award className="h-3 w-3 mr-1" />
            Distributed
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-gray-500/20 text-gray-400">
            <HelpCircle className="h-3 w-3 mr-1" />
            Unknown
          </Badge>
        );
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case "bronze":
        return "text-amber-500";
      case "silver":
        return "text-white";
      case "gold":
        return "text-yellow-500";
      case "diamond":
        return "text-blue-500";
      default:
        return "text-amber-500";
    }
  };

  const getMaxReward = (level) => {
    switch (level) {
      case "bronze":
        return 100;
      case "silver":
        return 500;
      case "gold":
        return 1000;
      case "diamond":
        return 2000;
      default:
        return 100;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-64 bg-muted rounded mb-4"></div>
          <div className="h-4 w-48 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search projects..." className="pl-9" value={searchQuery} onChange={handleSearchChange} />
          </div>
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="0">Inactive</SelectItem>
              <SelectItem value="1">Active</SelectItem>
              <SelectItem value="2">Upcoming</SelectItem>
              <SelectItem value="3">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="energy">Energy</SelectItem>
              <SelectItem value="water">Water</SelectItem>
              <SelectItem value="waste">Waste</SelectItem>
              <SelectItem value="transportation">Transportation</SelectItem>
              <SelectItem value="agriculture">Agriculture</SelectItem>
              <SelectItem value="forestry">Forestry</SelectItem>
              <SelectItem value="biodiversity">Biodiversity</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>Fill in the details to create a new sustainability project</DialogDescription>
            </DialogHeader>
            {isFetchingCommunityLevel || <ProjectForm onSubmit={handleCreateProject} onCancel={() => setIsCreateDialogOpen(false)} isSubmitting={isSubmitting} communityLevel={communityLevel} />}
          </DialogContent>
        </Dialog>
      </div>

      {isFetchingCommunityLevel || (
        <div className="bg-card border rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Trophy className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">Community Organizer Levels</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Your Community Level determines the maximum rewards you can offer and the fees you'll earn. Currently, you're at the <span className={`font-medium ${getLevelColor(communityLevel)}`}>{communityLevel.toUpperCase()}</span> level with a maximum reward of {getMaxReward(communityLevel)} LUM per project.
              </p>
              <div className="flex items-center gap-2">
                <a href="#" onClick={() => navigate("/resources#learn-community")}>
                  <Button variant="outline" size="sm" className="h-8">
                    View Level System
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Project Management</CardTitle>
          </div>
          <CardDescription>Manage all your sustainability projects</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredProjects.length === 0 ? (
            <div className="p-8">
              <EmptyState title="No Projects Found" description="There are no projects to display at the moment. Create a new project to get started." variant="projects" icon={Leaf} />
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="grid grid-cols-12 p-4 bg-muted text-sm font-medium">
                <div className="col-span-4">Project</div>
                <div className="col-span-2 text-center">Category</div>
                <div className="col-span-2 text-center">Timeline</div>
                <div className="col-span-1 text-center">Participants</div>
                <div className="col-span-1 text-center">Reward</div>
                <div className="col-span-1 text-center">Status</div>
                <div className="col-span-1 text-center">Actions</div>
              </div>
              <div className="divide-y">
                {filteredProjects.map((project) => (
                  <div key={project.id} className="grid grid-cols-12 p-4 items-center">
                    <div className="col-span-4">
                      <div className="font-medium">{project.title}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-xs">{project.description}</div>
                    </div>
                    <div className="col-span-2 text-center">
                      <Badge variant="outline">{Object.keys(project.category)}</Badge>
                    </div>
                    <div className="col-span-2 text-center text-sm">
                      <div className="flex items-center justify-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>
                          {project.startDate.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="text-muted-foreground">to {project.expiredAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                    </div>
                    <div className="col-span-1 text-center">
                      <div className="flex items-center justify-center">
                        <Users className="h-3 w-3 mr-1" />
                        <span>
                          {project.participants} / {project.maxParticipants}
                        </span>
                      </div>
                    </div>
                    <div className="col-span-1 text-center">
                      <div className="flex items-center justify-center">
                        <Leaf className="h-3 w-3 mr-1 text-emerald-500" />
                        <span>{project.reward} LUM</span>
                      </div>
                    </div>
                    <div className="col-span-1 text-center">{renderProjectStatus(project.status)}</div>
                    <div className="col-span-1 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/projects/${project.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between pt-6">
          <div className="text-sm text-muted-foreground">Showing {filteredProjects.length} projects</div>
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
    </div>
  );
}
