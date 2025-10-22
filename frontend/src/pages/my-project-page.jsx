import { useState, useEffect } from "react";
import { Search, HelpCircle, Eye, FileText, Leaf, Clock, Ban, CalendarClock } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { Progress } from "@/core/components/ui/progress";
import { useAuth } from "@/core/providers/auth-provider";
import { backend } from "declarations/backend";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";

const renderProjectStatus = (status) => {
  status = parseInt(status);
  switch (status) {
    case 0: // inactive
      return (
        <Badge variant="secondary" className="ml-auto bg-red-500/20 text-red-400">
          <Ban className="h-3 w-3 mr-1" />
          Inactive
        </Badge>
      );
    case 1: // active
      return (
        <Badge variant="secondary" className="ml-auto bg-emerald-500/20 text-emerald-400">
          <Leaf className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    case 2: // upcoming
      return (
        <Badge variant="secondary" className="ml-auto bg-blue-500/20 text-blue-400">
          <CalendarClock className="h-3 w-3 mr-1" />
          Upcoming
        </Badge>
      );
    case 3: // closed
      return (
        <Badge variant="secondary" className="ml-auto bg-gray-500/20 text-gray-400">
          <Clock className="h-3 w-3 mr-1" />
          Closed
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="ml-auto bg-gray-500/20 text-gray-400">
          <HelpCircle className="h-3 w-3 mr-1" />
          Unknown
        </Badge>
      );
  }
};

export default function MyProjectsPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [joinedProjects, setJoinedProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    }
  }, [isAuthenticated]);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const projects = await backend.getParticipantProjects();
      if (projects.Ok) {
        setJoinedProjects(
          projects.Ok.map((project) => ({
            id: project.id,
            title: project.title,
            description: project.description,
            category: project.category,
            startDate: new Date(Number(project.startDate) / 1000000),
            expiredAt: new Date(Number(project.expiredAt) / 1000000),
            participants: Number(project.participants.length),
            reward: Number(project.reward),
            status: Number(project.status),
            verified: true,
            earnedRewards: calculateEarnedRewards(project),
          }))
        );
      } else {
        toast.error(projects.Err || "Failed to fetch projects");
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error(error.message || "Failed to fetch projects. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getNextDeadline = (project) => {
    if (project.status === 3) {
      return "Completed";
    }

    const formattedDate = project.expiredAt.toLocaleDateString("en-US", {
      month: "short", // Short month name
      day: "numeric", // Day of month
      year: "numeric", // Year
    });

    return formattedDate;
  };

  const calculateEarnedRewards = (project) => {
    // Convert BigInt to Number for calculation
    const reward = Number(project.reward);
    return Math.floor(Math.random() * reward);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-emerald-500">Active</Badge>;
      case "Completed":
        return <Badge className="bg-purple-500">Completed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getRoleColor = (role) => {
    const roleColors = {
      water: "text-blue-500",
      energy: "text-emerald-500",
      waste: "text-amber-500",
      transportation: "text-green-600",
      agriculture: "text-indigo-500",
      forestry: "text-yellow-600",
      biodiversity: "text-red-500",
    };
    return roleColors[role] || "text-gray-500";
  };

  const getTotalEarnedRewards = () => {
    return joinedProjects.reduce((total, project) => total + project.earnedRewards, 0);
  };

  const getActiveProjectsCount = () => {
    return joinedProjects.filter((project) => project.status === 1).length;
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

  const filteredProjects = joinedProjects.filter((project) => {
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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">My Projects</h1>
          <p className="text-muted-foreground">Track and manage all the sustainability projects you have joined</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{joinedProjects.length}</div>
              <p className="text-muted-foreground text-sm">Projects you have participated in</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Active Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{getActiveProjectsCount()}</div>
              <p className="text-muted-foreground text-sm">Projects currently in progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Rewards Earned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold flex items-center">
                <Leaf className="h-5 w-5 mr-1 text-emerald-500" />
                {getTotalEarnedRewards()} LUM
              </div>
              <p className="text-muted-foreground text-sm">Rewards from completed tasks</p>
            </CardContent>
          </Card>
        </div>

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
        </div>

        <Tabs defaultValue="all">
          <TabsContent value="all" className="mt-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle>My Joined Projects</CardTitle>
                </div>
                <CardDescription>All sustainability projects you have joined</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="rounded-md border">
                  <div className="grid grid-cols-10 p-4 bg-muted text-sm font-medium">
                    <div className="col-span-3">Project</div>
                    <div className="col-span-2 text-center">Category</div>
                    <div className="col-span-2 text-center">Next Deadline</div>
                    <div className="col-span-1 text-center">Rewards</div>
                    <div className="col-span-1 text-center">Status</div>
                    <div className="col-span-1 text-center">Actions</div>
                  </div>
                  <div className="divide-y">
                    {filteredProjects.map((project) => (
                      <div key={project.id} className="grid grid-cols-10 p-4 items-center">
                        <div className="col-span-3">
                          <div className="font-medium">{project.title}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-xs">{project.description}</div>
                        </div>
                        <div className="col-span-2 text-center">
                          <Badge variant="outline" className={getRoleColor(Object.keys(project.category))}>
                            {Object.keys(project.category)}
                          </Badge>
                        </div>
                        <div className="col-span-2 text-center">
                          <div className="flex items-center justify-center">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{getNextDeadline(project)}</span>
                          </div>
                        </div>
                        <div className="col-span-1 text-center">
                          <div className="flex items-center justify-center">
                            <Leaf className="h-3 w-3 mr-1 text-emerald-500" />
                            <span>{project.earnedRewards} LUM</span>
                          </div>
                        </div>
                        <div className="col-span-1 text-center">{renderProjectStatus(project.status)}</div>
                        <div className="col-span-1 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => navigate(`/projects/${project.id}`)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {project.status === "Active" && (
                              <Button variant="ghost" size="icon" onClick={() => navigate(`/projects/${project.id}`)}>
                                <FileText className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
