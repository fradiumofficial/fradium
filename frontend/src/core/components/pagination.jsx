import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { Button } from "@/core/components/ui/button";

export function Pagination({ className }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous page</span>
        </Button>
        <Button variant="outline" size="sm" className="h-8 w-8 bg-primary text-primary-foreground">
          1
        </Button>
        <Button variant="outline" size="sm" className="h-8 w-8">
          2
        </Button>
        <Button variant="outline" size="sm" className="h-8 w-8">
          3
        </Button>
        <Button variant="outline" size="sm" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">More pages</span>
        </Button>
        <Button variant="outline" size="sm" className="h-8 w-8">
          12
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8">
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next page</span>
        </Button>
      </div>
    </div>
  );
}
