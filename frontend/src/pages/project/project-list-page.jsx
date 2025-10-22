import { Search } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";

import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { EmptyState } from "@/core/components/ui/empty-state";
import { ProjectCard } from "@/core/components/project/project-card";

// Import the backend canister
import { backend } from "declarations/backend";

// Debounce function
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProjects, setFilteredProjects] = useState([]);

  // Fetch projects from backend
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const result = await backend.getProjects();
        if ("Ok" in result) {
          // Sort projects by createdAt in descending order (latest first)
          const sortedProjects = result.Ok.sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
          setProjects(sortedProjects);
          setFilteredProjects(sortedProjects); // Initialize filtered projects with sorted data
        } else {
          setError(result.Err);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query) => {
      const filtered = projects.filter((project) => project.title.toLowerCase().includes(query.toLowerCase()) || project.description.toLowerCase().includes(query.toLowerCase()));
      setFilteredProjects(filtered);
    }, 500),
    [projects]
  );

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  return (
    <main className="flex-1">
      {/* Hero Banner */}
      <section className="bg-card py-12 border-b border-border/40">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Featured Impact Projects</h1>
              <p className="text-muted-foreground">Discover and support sustainable initiatives from around the world</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => navigate("/community?tab=community")}>
                Start a Project
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="py-8">
        <div className="container">
          {/* Search and Filters */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search projects..." className="pl-9 pr-4" value={searchQuery} onChange={handleSearchChange} />
              </div>
            </div>
          </div>

          {/* Projects Grid */}
          <div>
            {loading ? (
              <div className="text-center py-8">Loading projects...</div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">Error: {error}</div>
            ) : filteredProjects.length === 0 ? (
              <EmptyState variant="projects" title="No projects found" description={searchQuery ? "No projects match your search criteria." : "No projects to display at the moment."} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} onClick={() => navigate(`/projects/${project.id}`)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
