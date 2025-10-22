import { useState, useRef, useCallback } from "react";
import { Info, X, Crop, Trophy, BadgeDollarSign, PercentCircle, Wallet } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Badge } from "@/core/components/ui/badge";
import { Textarea } from "@/core/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/core/components/ui/tooltip";
import { useToast } from "@/core/hooks/use-toast";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/core/components/ui/dialog";

function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

const getLevelInfo = (level) => {
  switch (level?.toLowerCase()) {
    case "silver":
      return {
        color: "text-white",
        holding: "100-500 LUM",
        maxReward: "500 LUM",
        fee: "10%",
        badgeColor: "text-white border-white/20",
      };
    case "gold":
      return {
        color: "text-yellow-500",
        holding: "500-2000 LUM",
        maxReward: "2000 LUM",
        fee: "15%",
        badgeColor: "text-yellow-500 border-yellow-500/20",
      };
    case "diamond":
      return {
        color: "text-blue-500",
        holding: "2000-5000 LUM",
        maxReward: "5000 LUM",
        fee: "20%",
        badgeColor: "text-blue-500 border-blue-500/20",
      };
    default: // bronze
      return {
        color: "text-amber-500",
        holding: "0-100 LUM",
        maxReward: "100 LUM",
        fee: "5%",
        badgeColor: "text-amber-500 border-amber-500/20",
      };
  }
};

const getMaxRewardValue = (level) => {
  switch (level?.toLowerCase()) {
    case "silver":
      return 500;
    case "gold":
      return 2000;
    case "diamond":
      return 5000;
    default: // bronze
      return 100;
  }
};

export function ProjectForm({ onSubmit, onCancel, initialData = {}, isSubmitting, communityLevel }) {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const imgRef = useRef(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const [isEditing, setIsEditing] = useState(false);
  const [originalImage, setOriginalImage] = useState(null);
  const [formData, setFormData] = useState({
    title: initialData.title || "",
    description: initialData.description || "",
    category: initialData.category || "",
    startDate: initialData.startDate ? new Date(initialData.startDate) : null,
    endDate: initialData.endDate ? new Date(initialData.endDate) : null,
    reward: initialData.reward,
    maxParticipants: initialData.maxParticipants,
    impact: initialData.impact || "",
    address: initialData.address || "",
    image: null,
    ...initialData,
  });

  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(initialData.imageUrl || null);

  const levelInfo = getLevelInfo(communityLevel);
  const maxReward = getMaxRewardValue(communityLevel);

  const onImageLoad = useCallback((e) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 16 / 9));
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload only JPG, JPEG, or PNG files",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (3MB)
    if (file.size > 3 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 3MB",
        variant: "destructive",
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setOriginalImage(reader.result);
      setIsEditing(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (crop) => {
    setCompletedCrop(crop);
  };

  const handleEditComplete = () => {
    if (!completedCrop || !imgRef.current) return;

    const image = imgRef.current;
    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;

    ctx.drawImage(image, completedCrop.x * scaleX, completedCrop.y * scaleY, completedCrop.width * scaleX, completedCrop.height * scaleY, 0, 0, completedCrop.width, completedCrop.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], "cropped-image.jpg", { type: "image/jpeg" });
        setFormData((prev) => ({ ...prev, image: file }));
        setImagePreview(URL.createObjectURL(blob));
        setIsEditing(false);
      },
      "image/jpeg",
      0.95
    );
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setOriginalImage(null);
    setFormData((prev) => ({ ...prev, image: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is modified
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly",
        variant: "destructive",
      });
      return;
    }

    onSubmit(formData);
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.endDate) newErrors.endDate = "End date is required";
    if (!formData.reward) newErrors.reward = "Reward is required";
    if (!formData.impact.trim()) newErrors.impact = "Impact is required";
    if (!formData.maxParticipants) newErrors.maxParticipants = "Max participants is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";

    // Reward validation based on community level
    if (formData.reward) {
      if (formData.reward > maxReward) {
        newErrors.reward = `Maximum reward for ${communityLevel?.toUpperCase() || "BRONZE"} level is ${maxReward} LUM`;
      }
      if (formData.reward <= 0) {
        newErrors.reward = "Reward must be greater than 0";
      }
    }

    // Date validation
    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
      newErrors.endDate = "End date must be after start date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-start gap-3">
          <Trophy className={`h-5 w-5 ${levelInfo.color} mt-0.5 flex-shrink-0`} />
          <div>
            <h3 className="font-medium text-sm">Community Level Terms</h3>
            <p className="text-xs text-muted-foreground mt-1">By creating this project, you agree to the following terms based on your Community Level:</p>
          </div>
        </div>

        <div className="bg-muted/40 rounded-lg p-4 space-y-3 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-xs">
              <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Your Current Level:</span>
              <Badge variant="outline" className={`ml-auto ${levelInfo.badgeColor}`}>
                {communityLevel?.toUpperCase() || "BRONZE"}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <BadgeDollarSign className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Maximum Reward:</span>
              <span className="ml-auto font-medium">{levelInfo.maxReward}</span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <PercentCircle className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Fee to Organizer:</span>
              <span className="ml-auto font-medium">{levelInfo.fee}</span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Required Holding:</span>
              <span className="ml-auto font-medium">{levelInfo.holding}</span>
            </div>
          </div>

          <div className="text-xs text-muted-foreground space-y-2">
            <p>
              <span className="font-medium">Important:</span> The maximum reward you can offer is determined by your Community Level. To increase this limit, you need to hold more LUM tokens.
            </p>
            <p>Fees are automatically deducted from rewards when participants complete actions. You must maintain the minimum token holding requirement throughout the project duration.</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Project Title</Label>
            <Input id="title" value={formData.title} onChange={(e) => handleChange("title", e.target.value)} placeholder="Enter project title" className={errors.title ? "border-red-500" : ""} />
            {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={formData.description} onChange={(e) => handleChange("description", e.target.value)} placeholder="Describe the project and its goals" rows={4} className={errors.description ? "border-red-500" : ""} />
            {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="impact">Project Impact</Label>
            <Input id="impact" value={formData.impact} onChange={(e) => handleChange("impact", e.target.value)} placeholder="Enter the expected impact of this project" className={errors.impact ? "border-red-500" : ""} />
            {errors.impact && <p className="text-sm text-red-500">{errors.impact}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Project Address</Label>
            <Input id="address" value={formData.address} onChange={(e) => handleChange("address", e.target.value)} placeholder="Enter project location address" className={errors.address ? "border-red-500" : ""} />
            {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Project Image (Optional)</Label>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Input id="image" type="file" accept="image/jpeg,image/jpg,image/png" onChange={handleImageChange} className="cursor-pointer text-white [&::file-selector-button]:text-white" ref={fileInputRef} />
                {imagePreview && (
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="icon" onClick={() => setIsEditing(true)} className="h-10 w-10">
                      <Crop className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="outline" size="icon" onClick={handleRemoveImage} className="h-10 w-10">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">Max file size: 3MB. Supported formats: JPG, JPEG, PNG</p>
              {imagePreview && (
                <div className="relative w-full max-w-xs aspect-video rounded-md overflow-hidden border">
                  <img src={imagePreview} alt="Project preview" className="object-cover w-full h-full" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
              <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="energy">Energy</SelectItem>
                <SelectItem value="water">Water</SelectItem>
                <SelectItem value="waste">Waste</SelectItem>
                <SelectItem value="transportation">Transportation</SelectItem>
                <SelectItem value="agriculture">Agriculture</SelectItem>
                <SelectItem value="forestry">Forestry</SelectItem>
                <SelectItem value="biodiversity">Biodiversity</SelectItem>
              </SelectContent>
            </Select>
            {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input id="startDate" type="date" value={formData.startDate ? formData.startDate.toISOString().split("T")[0] : ""} onChange={(e) => handleChange("startDate", e.target.value ? new Date(e.target.value) : null)} min={new Date().toISOString().split("T")[0]} className={errors.startDate ? "border-red-500" : ""} />
            {errors.startDate && <p className="text-sm text-red-500">{errors.startDate}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input id="endDate" type="date" value={formData.endDate ? formData.endDate.toISOString().split("T")[0] : ""} onChange={(e) => handleChange("endDate", e.target.value ? new Date(e.target.value) : null)} min={formData.startDate ? formData.startDate.toISOString().split("T")[0] : new Date().toISOString().split("T")[0]} className={errors.endDate ? "border-red-500" : ""} />
            {errors.endDate && <p className="text-sm text-red-500">{errors.endDate}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="maxParticipants" className="mr-2">
                Max Participants
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Maximum number of participants allowed (0 for unlimited)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input id="maxParticipants" type="number" min="0" value={formData.maxParticipants || ""} onChange={(e) => handleChange("maxParticipants", e.target.value ? Number.parseInt(e.target.value) : "")} placeholder="Enter max participants (0 for unlimited)" className={errors.maxParticipants ? "border-red-500" : ""} />
            {errors.maxParticipants && <p className="text-sm text-red-500">{errors.maxParticipants}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="reward" className="mr-2">
                Reward (LUM)
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total LUM tokens allocated as rewards for this project (Max: {maxReward} LUM)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input id="reward" type="number" min="0" max={maxReward} value={formData.reward || ""} onChange={(e) => handleChange("reward", e.target.value ? Number.parseInt(e.target.value) : "")} placeholder={`Enter reward amount (Max: ${maxReward} LUM)`} className={errors.reward ? "border-red-500" : ""} />
            {errors.reward && <p className="text-sm text-red-500">{errors.reward}</p>}
          </div>
        </div>
      </div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {originalImage && (
              <div className="relative aspect-video">
                <ReactCrop crop={crop} onChange={(c) => setCrop(c)} onComplete={handleCropComplete} aspect={16 / 9} className="max-h-[60vh]">
                  <img ref={imgRef} src={originalImage} alt="Original" onLoad={onImageLoad} className="max-h-[60vh]" />
                </ReactCrop>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleEditComplete} className="bg-emerald-600 hover:bg-emerald-700">
                Apply Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Project"}
        </Button>
      </div>
    </form>
  );
}
