import { useState, useEffect } from "react";
import { X, CheckCircle, AlertCircle, User, Users, Camera } from "lucide-react";
import { cn } from "@/core/lib/utils";
import { Button } from "@/core/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/components/ui/tabs";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { motion } from "framer-motion";
import { backend } from "declarations/backend";
import { face_recognition as faceRecognition } from "declarations/face_recognition";
import { Actor } from "@dfinity/agent";
import { useAuth } from "@/core/providers/auth-provider";
import { toast } from "react-toastify";

export default function RegistrationModal({ isOpen, onClose, redirectPath = "/" }) {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(null); // null, 'success', 'error'
  const [isVisible, setIsVisible] = useState(false);
  const [role, setRole] = useState("participant"); // "participant" or "community"
  const [formData, setFormData] = useState({
    participantName: "",
    communityName: "",
  });
  const [faceImage, setFaceImage] = useState(null);
  const [faceVerificationStatus, setFaceVerificationStatus] = useState(null);
  const { identity } = useAuth();
  const [errorMessage, setErrorMessage] = useState("");
  const [isFaceLoading, setIsFaceLoading] = useState(false);
  const [capturedFaceBlob, setCapturedFaceBlob] = useState(null);

  // Handle animation states
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      setTimeout(() => setIsVisible(false), 300); // Match this with CSS transition duration
    }
  }, [isOpen]);

  // Reset status when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStatus(null);
        setFormData({
          participantName: "",
          communityName: "",
        });
      }, 300);
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const serialize = (canvas) => {
    return new Promise((resolve) => canvas.toBlob((blob) => blob.arrayBuffer().then(resolve), "image/png", 0.9));
  };

  const handleFaceCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      });

      // Create video element
      const video = document.createElement("video");
      video.srcObject = stream;
      video.setAttribute("playsinline", ""); // Required for iOS
      video.setAttribute("autoplay", "");

      // Wait for video to be ready
      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          resolve();
        };
      });

      // Wait a bit for the video to actually start playing
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Create canvas with video dimensions
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the current video frame to canvas
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Create resized canvas
      const resized = document.createElement("canvas");
      resized.width = 320;
      resized.height = 240;
      const scale = Math.min(resized.width / canvas.width, resized.height / canvas.height);
      const width = canvas.width * scale;
      const height = canvas.height * scale;
      const x = resized.width / 2 - width / 2;
      const y = resized.height / 2 - height / 2;

      const ctx2 = resized.getContext("2d");
      ctx2.drawImage(canvas, x, y, width, height);

      // Get blob data
      const blob = await serialize(resized);

      // Convert to base64 for preview
      const base64Data = btoa(new Uint8Array(blob).reduce((data, byte) => data + String.fromCharCode(byte), ""));
      const previewImage = `data:image/png;base64,${base64Data}`;
      setFaceImage(previewImage);

      // Stop the video stream
      stream.getTracks().forEach((track) => track.stop());

      // Add face
      await addFace(blob);
    } catch (error) {
      console.error("Error capturing face:", error);
      setFaceVerificationStatus("error");
    }
  };

  const addFace = async (blob) => {
    try {
      setIsFaceLoading(true);
      setFaceVerificationStatus("processing");

      // First detect if there's a face in the image
      const detectionResult = await faceRecognition.detect(new Uint8Array(blob));
      console.log("detectionResult", detectionResult);

      // Check if detection was successful and contains face data
      if ("Err" in detectionResult || !detectionResult.Ok || !detectionResult.Ok.left) {
        setFaceVerificationStatus("error");
        setErrorMessage("No face detected. Please make sure your face is clearly visible in the frame");
        return;
      }

      // Validate face dimensions
      const face = detectionResult.Ok;
      const faceWidth = face.right - face.left;
      const faceHeight = face.bottom - face.top;
      const faceRatio = faceHeight / faceWidth;

      // Human face ratio is typically around 1.3:1
      // Allow more margin (0.7 to 2.0) to account for different angles and distances
      if (faceRatio < 0.7 || faceRatio > 2.0) {
        setFaceVerificationStatus("error");
        setErrorMessage("Invalid face detection. Please make sure your face is clearly visible and centered");
        return;
      }

      // If face is valid, store the blob for later use
      setFaceVerificationStatus("success");
      setErrorMessage("");
      setCapturedFaceBlob(blob);
    } catch (error) {
      console.error("Error adding face:", error);
      setFaceVerificationStatus("error");
      setErrorMessage("An error occurred while adding face. Please try again");
    } finally {
      setIsFaceLoading(false);
    }
  };

  const handleRegister = async () => {
    setIsLoading(true);
    setStatus(null);
    setErrorMessage("");

    // Validate form data
    let isValid = true;
    if (role === "participant" && !formData.participantName.trim()) {
      isValid = false;
      setErrorMessage("Participant name must be filled");
    } else if (role === "community") {
      if (!formData.communityName.trim()) {
        isValid = false;
        setErrorMessage("Community name must be filled");
      }
      if (!faceImage || faceVerificationStatus !== "success" || !capturedFaceBlob) {
        setStatus("error");
        setErrorMessage("Face verification not successful. Please capture your face first");
        setIsLoading(false);
        return;
      }
    }

    if (!isValid) {
      setStatus("error");
      setIsLoading(false);
      return;
    }

    try {
      Actor.agentOf(backend).replaceIdentity(identity);

      // For community registration, store the face first
      if (role === "community") {
        const storeResult = await faceRecognition.add(identity.getPrincipal().toText(), new Uint8Array(capturedFaceBlob));
        console.log("storeResult", storeResult);

        if ("Err" in storeResult) {
          setStatus("error");
          setErrorMessage("Failed to store face. Please try again");
          setIsLoading(false);
          return;
        }
      }

      const registerResponse = await backend.register({
        name: role === "participant" ? formData.participantName : formData.communityName,
        registerAs: role,
      });

      if ("Ok" in registerResponse) {
        setStatus("success");
        setErrorMessage("");
        setIsLoading(false);
        document.location.reload();
      } else if ("Err" in registerResponse) {
        setStatus("error");
        setErrorMessage("Registration failed. Please try again");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Registration error:", error);
      setStatus("error");
      setErrorMessage("An error occurred during registration. Please try again");
      setIsLoading(false);
      toast.error(error.message || "An unexpected error occurred. Please try again.");
    }
  };

  if (!isOpen && !isVisible) return null;

  return (
    <div className={cn("fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300", isOpen ? "opacity-100" : "opacity-0", isVisible ? "visible" : "invisible")}>
      {/* Backdrop with blur effect */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
        style={{
          transition: "backdrop-filter 300ms ease-out, background-color 300ms ease-out",
        }}
      />

      {/* Modal content */}
      <motion.div initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }} transition={{ duration: 0.3 }} className="relative z-10 w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <div className="absolute right-4 top-4">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        <div className="flex flex-col items-center space-y-4">
          <div className="mb-2 flex items-center justify-center">
            <h2 className="text-2xl font-bold">Create Your Lumora Account</h2>
          </div>

          <p className="text-center text-muted-foreground">Join the Lumora ecosystem to track your sustainability efforts, earn rewards, and make a positive impact.</p>

          {/* Role selection tabs */}
          <Tabs defaultValue="participant" className="w-full" onValueChange={setRole}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="participant" className="flex items-center justify-center gap-2">
                <User className="h-4 w-4" />
                <span>Participant</span>
              </TabsTrigger>
              <TabsTrigger value="community" className="flex items-center justify-center gap-2">
                <Users className="h-4 w-4" />
                <span>Community</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="participant" className="mt-4 space-y-4">
              <div className="rounded-lg border border-border/50 bg-emerald-500/5 p-3 text-sm">
                <p className="font-medium text-emerald-600">Participant Access</p>
                <p className="text-muted-foreground">Track eco-actions, earn rewards, and browse NFT collections.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="participantName">Participant Name</Label>
                <Input id="participantName" name="participantName" placeholder="Enter your name" value={formData.participantName} onChange={handleInputChange} required />
              </div>
            </TabsContent>
            <TabsContent value="community" className="mt-4 space-y-4">
              <div className="rounded-lg border border-border/50 bg-blue-500/5 p-3 text-sm">
                <p className="font-medium text-blue-600">Community Access</p>
                <p className="text-muted-foreground">Create projects, manage challenges, and review submissions.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="communityName">Community Name</Label>
                <Input id="communityName" name="communityName" placeholder="Enter community name" value={formData.communityName} onChange={handleInputChange} required />
              </div>

              <div className="space-y-2">
                <Label>Face Verification</Label>
                <div className="flex flex-col items-center space-y-4">
                  {!faceImage ? (
                    <Button onClick={handleFaceCapture} className="w-full" variant="outline" disabled={isFaceLoading}>
                      {isFaceLoading ? (
                        <>
                          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                          Processing Face...
                        </>
                      ) : (
                        <>
                          <Camera className="mr-2 h-4 w-4" />
                          Capture Face
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative w-48 h-48 border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
                        <img src={faceImage} alt="Captured face" className="w-full h-full object-cover" />
                      </div>
                      <Button onClick={handleFaceCapture} variant="outline" className="w-full" disabled={isFaceLoading}>
                        {isFaceLoading ? (
                          <>
                            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                            Processing Face...
                          </>
                        ) : (
                          "Retake Photo"
                        )}
                      </Button>
                    </div>
                  )}

                  {faceVerificationStatus === "success" && (
                    <div className="flex items-center text-emerald-500">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      <span>Face successfully added</span>
                    </div>
                  )}

                  {faceVerificationStatus === "error" && (
                    <div className="flex items-center text-red-500">
                      <AlertCircle className="mr-2 h-4 w-4" />
                      <span>{errorMessage || "Failed to add face. Please try again."}</span>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {status === "success" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex w-full items-center justify-center rounded-md bg-emerald-500/10 p-3 text-emerald-500">
              <CheckCircle className="mr-2 h-5 w-5" />
              <span>Registration successful! Redirecting...</span>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex w-full items-center justify-center rounded-md bg-red-500/10 p-3 text-red-500">
              <AlertCircle className="mr-2 h-5 w-5" />
              <span>{errorMessage || "Registration failed. Please check your information and try again."}</span>
            </motion.div>
          )}

          <Button className={cn("mt-4 w-full", role === "community" ? "bg-blue-500 hover:bg-blue-600" : "bg-emerald-500 hover:bg-emerald-600")} onClick={handleRegister} disabled={isLoading || status === "success" || (role === "community" && (!faceImage || faceVerificationStatus !== "success"))}>
            {isLoading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
