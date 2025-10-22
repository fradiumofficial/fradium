import { Ban, CalendarClock, Clock, HelpCircle, Leaf } from "lucide-react";
import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/core/components/ui/avatar";
import { Badge } from "@/core/components/ui/badge";
import { Card, CardContent } from "@/core/components/ui/card";

// Helper function to render project status
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
          <Clock className="h-3 w-3 mr-1" />
          Closed
        </Badge>
      );
  }
};

export function ProjectCard({ project, onClick }) {
  const avatarUrl = useMemo(() => `https://api.dicebear.com/7.x/identicon/svg?seed=${project.title}&backgroundColor=c7d2fe&shape1Color=4f46e5`, [project.title]);

  const coverImageUrl = useMemo(() => `https://api.dicebear.com/7.x/shapes/svg?seed=${project.title}&backgroundColor=c7d2fe,ddd6fe,fae8ff,dbeafe,bfdbfe,e0e7ff&shape1Color=4f46e5,6d28d9,7c3aed,2563eb,3b82f6,4f46e5`, [project.title]);

  return (
    <Card className="overflow-hidden bg-card border-border/40 cursor-pointer hover:border-border/60 transition-colors" onClick={onClick}>
      <div className="relative aspect-square">
        {project.imageData && project.imageData[0] ? (
          <img
            src={URL.createObjectURL(new Blob([new Uint8Array(project.imageData[0])]))}
            alt={project.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = coverImageUrl;
            }}
          />
        ) : (
          <img src={coverImageUrl} alt={project.title} className="w-full h-full object-cover bg-gray-100" />
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-8 w-8 border-2 border-background -mt-8">
            <AvatarImage src={avatarUrl} alt={project.title} />
            <AvatarFallback>{project.title.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="font-medium">{project.title}</div>
          {renderProjectStatus(project.status)}
        </div>
        <div className="flex justify-between text-sm">
          <div>
            <p className="text-muted-foreground">Participants</p>
            <p className="font-medium">
              {project.participants.length}/{project.maxParticipants}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Reward</p>
            <p className="font-medium">{project.reward} LUM</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
