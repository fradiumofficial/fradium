import { useState } from "react";
import { FileText, Upload, X, Plus } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Textarea } from "@/core/components/ui/textarea";
import { toast } from "react-toastify";

export function SubmitEvidenceForm({ onSubmit }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    // Check if adding new files would exceed the 2 file limit
    if (files.length + selectedFiles.length > 2) {
      toast.error("You can only upload a maximum of 2 files.");
      return;
    }

    // Check file size (500KB limit per file)
    const oversizedFiles = selectedFiles.filter((file) => file.size > 250 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error(`Some files exceed the 250KB size limit: ${oversizedFiles.map((f) => f.name).join(", ")}`);
      return;
    }

    // Validate file types
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    const invalidFiles = selectedFiles.filter((file) => !allowedTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      toast.error(`Invalid file type(s): ${invalidFiles.map((f) => f.name).join(", ")}. Only PNG, JPG, and JPEG files are allowed.`);
      return;
    }

    setFiles([...files, ...selectedFiles]);
  };

  const removeFile = (index) => {
    const newFiles = [...files];
    if (newFiles[index].preview) {
      URL.revokeObjectURL(newFiles[index].preview);
    }
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (description.trim() === "" && files.length === 0) {
      toast.error("Please provide a description or upload files as evidence.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        description,
        files,
      });

      // Clean up file previews
      files.forEach((file) => {
        if (file.preview) URL.revokeObjectURL(file.preview);
      });
    } catch (error) {
      toast.error("There was an error submitting your evidence. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" placeholder="Describe your participation and the evidence you're providing..." value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
        <p className="text-sm text-muted-foreground">Explain what you did, when you did it, and how it relates to the project requirements.</p>
      </div>

      <div className="space-y-2">
        <Label>Evidence Files</Label>

        {files.length > 0 && (
          <div className="space-y-2 mb-4">
            {files.map((file, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                {file.preview ? (
                  <div className="h-10 w-10 rounded overflow-hidden flex-shrink-0">
                    <img src={file.preview || "/placeholder.svg"} alt={file.name} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <FileText className="h-10 w-10 p-2 text-muted-foreground" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{file.name}</div>
                  <div className="text-xs text-muted-foreground">{formatFileSize(file.size)}</div>
                </div>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeFile(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="border-2 border-dashed rounded-lg p-4 text-center">
          <Input id="evidence-files" type="file" multiple className="hidden" onChange={handleFileChange} accept="image/png,image/jpeg,image/jpg" disabled={files.length >= 2} />
          <div className="py-4">
            <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-1">Drag and drop files, or click to browse</p>
            <p className="text-xs text-muted-foreground mb-4">Supports PNG, JPG, and JPEG files (max 500KB each, max 2 files)</p>
            <Button type="button" variant="outline" onClick={() => document.getElementById("evidence-files").click()} disabled={files.length >= 2}>
              <Plus className="h-4 w-4 mr-2" />
              Add Files
            </Button>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Evidence"}
        </Button>
      </div>
    </form>
  );
}
