import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Textarea } from "@/core/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/components/ui/select";
import {
  Shield,
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  X,
  CheckCircle,
  Upload,
  FileText,
  CloudCog,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useAuth } from "@/core/providers/auth-provider";
import { token } from "declarations/token";
import { convertE8sToToken, optValue } from "../../core/lib/canisterUtils";
import { backend, canisterId as backendCanisterId } from "declarations/backend";
import { Principal } from "@dfinity/principal";

export default function CreateReportPage() {
  const { isAuthenticated, handleLogin, identity } = useAuth();
  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    address: "",
    chain: "",
    description: "",
    evidenceFields: [""],
    whatHappened: "",
    url: "",
  });
  const [errors, setErrors] = useState({});

  const [balance, setBalance] = useState(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState(true);

  // Confirmation Modal
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [stakeAmount, setStakeAmount] = useState(5);
  const [userBalance, setUserBalance] = useState(100);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [files, setFiles] = useState([]);

  console.log(formData);

  // What happened options for dropdown
  const whatHappenedOptions = [
    { value: "phishing", label: "Phishing" },
    { value: "scam", label: "Scam" },
    { value: "exploit", label: "Exploit" },
    { value: "rugpull", label: "Rug Pull" },
    { value: "ponzi", label: "Ponzi Scheme" },
    { value: "fake_token", label: "Fake Token" },
    { value: "impersonation", label: "Impersonation" },
    { value: "other", label: "Other" },
  ];

  // Steps configuration
  const steps = [
    {
      id: 1,
      title: "Case Details",
      description: "What happened, evidence",
    },
    {
      id: 2,
      title: "Scammer Information",
      description: "Address, chain info",
    },
    {
      id: 3,
      title: "Description",
      description: "Detailed description",
    },
  ];

  // Auto-detect blockchain network from address
  const detectChain = (address) => {
    if (!address) return "";

    // Simple chain detection based on address format
    if (address.startsWith("0x") && address.length === 42) {
      return "Ethereum";
    } else if (
      address.startsWith("bc1") ||
      address.startsWith("1") ||
      address.startsWith("3")
    ) {
      return "Bitcoin";
    } else if (address.length === 44) {
      return "Solana";
    } else if (address.startsWith("cosmos")) {
      return "Cosmos";
    }
    return "Unknown";
  };

  // Update chain when address changes
  useEffect(() => {
    const detectedChain = detectChain(formData.address);
    setFormData((prev) => ({ ...prev, chain: detectedChain }));
  }, [formData.address]);

  useEffect(() => {
    const fetchBalance = async () => {
      setIsBalanceLoading(true);
      const balance = await token.icrc1_balance_of({
        owner: identity.getPrincipal(),
        subaccount: [],
      });
      setIsBalanceLoading(false);
      setBalance(balance);
    };
    fetchBalance();
  }, [identity]);

  // Form validation
  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.whatHappened.trim()) {
        newErrors.whatHappened = "This field is required";
      }
    }

    if (step === 2) {
      if (!formData.address.trim()) {
        newErrors.address = "Address is required";
      } else if (formData.address.length < 10) {
        newErrors.address = "Please enter a valid address";
      }

      // Validate URL if provided
      if (formData.url.trim()) {
        try {
          new URL(formData.url);
        } catch {
          newErrors.url = "Please enter a valid URL";
        }
      }
    }

    if (step === 3) {
      if (!formData.description.trim()) {
        newErrors.description = "Description is required";
      } else if (formData.description.length < 20) {
        newErrors.description = "Description must be at least 20 characters";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Handle evidence field changes
  const handleEvidenceChange = (index, value) => {
    const newEvidenceFields = [...formData.evidenceFields];
    newEvidenceFields[index] = value;
    setFormData((prev) => ({ ...prev, evidenceFields: newEvidenceFields }));
  };

  // Add new evidence field
  const addEvidenceField = () => {
    setFormData((prev) => ({
      ...prev,
      evidenceFields: [...prev.evidenceFields, ""],
    }));
  };

  // Remove evidence field
  const removeEvidenceField = (index) => {
    if (formData.evidenceFields.length > 1) {
      const newEvidenceFields = formData.evidenceFields.filter(
        (_, i) => i !== index
      );
      setFormData((prev) => ({ ...prev, evidenceFields: newEvidenceFields }));
    }
  };

  // Navigation functions
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const goToStep = (step) => {
    if (step <= 3 && (step < currentStep || validateStep(currentStep))) {
      setCurrentStep(step);
    }
  };

  // Submit form
  const handleSubmit = async () => {
    console.log("111");
    // if (!validateStep(3)) return;

    setIsSubmitting(true);
    console.log(Principal.fromText(backendCanisterId).toString());

    const approveResult = await token.icrc2_approve({
      from_subaccount: [],
      spender: Principal.fromText(backendCanisterId),
      amount: BigInt(stakeAmount) * BigInt(10 ** 8),
      expires_at: [],
      fee: [],
      memo: [new TextEncoder().encode(`Approve for staking report creation`)],
      created_at_time: [],
    });

    console.log("OKADOKAD");

    console.log("approveResult", approveResult);

    const response = await backend.create_report({
      chain: formData.chain,
      address: formData.address,
      category: formData.whatHappened.toLowerCase(),
      description: formData.description,
      url: optValue(formData.url ?? null),
      evidence: formData.evidenceFields.map((evidence) => "example.com"),
      stake_amount: Number(stakeAmount) * 10 ** 8,
    });

    console.log("response", response);
    // if (response.ok) {
    //   setShowSuccessModal(true);
    // } else {
    //   toast.error(response.error);
    //   console.log(response.error);
    // } finally {
    //   setIsSubmitting(false);
    // }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    // Check if adding new files would exceed the 2 file limit
    if (files.length + selectedFiles.length > 2) {
      toast.error("You can only upload a maximum of 2 files.");
      return;
    }

    // Check file size (500KB limit per file)
    const oversizedFiles = selectedFiles.filter(
      (file) => file.size > 250 * 1024
    );
    if (oversizedFiles.length > 0) {
      toast.error(
        `Some files exceed the 250KB size limit: ${oversizedFiles
          .map((f) => f.name)
          .join(", ")}`
      );
      return;
    }

    // Validate file types
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    const invalidFiles = selectedFiles.filter(
      (file) => !allowedTypes.includes(file.type)
    );
    if (invalidFiles.length > 0) {
      toast.error(
        `Invalid file type(s): ${invalidFiles
          .map((f) => f.name)
          .join(", ")}. Only PNG, JPG, and JPEG files are allowed.`
      );
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

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Case Details</h2>
              <p className="text-gray-400 mb-6">
                Provide details about what happened and supporting evidence.
              </p>
            </div>

            {/* What Happened Select */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                What happened? <span className="text-red-400">*</span>
              </label>
              <Select
                value={formData.whatHappened}
                onValueChange={(value) =>
                  handleInputChange("whatHappened", value)
                }
              >
                <SelectTrigger
                  className={`bg-white/5 border-white/20 text-white focus:bg-white/10 ${
                    errors.whatHappened ? "border-red-400" : ""
                  }`}
                >
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/20">
                  {whatHappenedOptions.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="text-white hover:bg-white/10"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.whatHappened && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.whatHappened}
                </p>
              )}
            </div>

            {/* Evidence Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Evidence Files <span className="text-gray-400">(Optional)</span>
              </label>

              {files.length > 0 && (
                <div className="space-y-3 mb-4">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-3 bg-white/5 border border-white/20 rounded-md"
                    >
                      {file.preview ? (
                        <div className="h-10 w-10 rounded overflow-hidden flex-shrink-0">
                          <img
                            src={file.preview || "/placeholder.svg"}
                            alt={file.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <FileText className="h-10 w-10 p-2 text-gray-400" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">
                          {file.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatFileSize(file.size)}
                        </div>
                      </div>
                      <Button
                        onClick={() => removeFile(index)}
                        className="bg-red-400/10 border border-red-400/20 hover:bg-red-400/20 text-red-400 p-2"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center bg-white/5">
                <Input
                  id="evidence-files"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/png,image/jpeg,image/jpg"
                  disabled={files.length >= 2}
                />
                <div className="py-4">
                  <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-300 mb-1">
                    Drag and drop files, or click to browse
                  </p>
                  <p className="text-xs text-gray-400 mb-4">
                    Supports PNG, JPG, and JPEG files (max 250KB each, max 2
                    files)
                  </p>
                  <Button
                    onClick={() =>
                      document.getElementById("evidence-files").click()
                    }
                    disabled={files.length >= 2}
                    className="bg-white/10 border border-white/20 hover:bg-white/20 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Files
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Scammer Information</h2>
              <p className="text-gray-400 mb-6">
                Provide the wallet address and related information.
              </p>
            </div>

            {/* Address Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Wallet Address <span className="text-red-400">*</span>
              </label>
              <Input
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Enter the wallet address (e.g., 0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4)"
                className={`bg-white/5 border-white/20 text-white placeholder-gray-400 focus:bg-white/10 ${
                  errors.address ? "border-red-400" : ""
                }`}
              />
              {errors.address && (
                <p className="text-red-400 text-sm mt-1">{errors.address}</p>
              )}
            </div>

            {/* Auto-detected Chain */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Blockchain Network
              </label>
              <div className="flex items-center space-x-3 p-3 bg-white/5 border border-white/20">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-white font-medium">
                  {formData.chain || "Enter address to auto-detect"}
                </span>
              </div>
            </div>

            {/* URL Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Related URL <span className="text-gray-400">(Optional)</span>
              </label>
              <Input
                value={formData.url}
                onChange={(e) => handleInputChange("url", e.target.value)}
                placeholder="Enter related website or social media URL (e.g., https://example.com)"
                className={`bg-white/5 border-white/20 text-white placeholder-gray-400 focus:bg-white/10 ${
                  errors.url ? "border-red-400" : ""
                }`}
              />
              {errors.url && (
                <p className="text-red-400 text-sm mt-1">{errors.url}</p>
              )}
              <p className="text-gray-400 text-xs mt-1">
                Add any related website, social media, or platform URL where the
                scam occurred
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Description</h2>
              <p className="text-gray-400 mb-6">
                Provide a detailed description of the suspicious activity.
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description <span className="text-red-400">*</span>
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Provide a detailed explanation of the suspicious activity, including how you discovered it, what happened, and any relevant context..."
                rows={6}
                className={`bg-white/5 border-white/20 text-white placeholder-gray-400 focus:bg-white/10 resize-none ${
                  errors.description ? "border-red-400" : ""
                }`}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.description && (
                  <p className="text-red-400 text-sm">{errors.description}</p>
                )}
                <p className="text-gray-400 text-sm ml-auto">
                  {formData.description.length}/500 characters (min. 50)
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Calculate vote deadline (7 days from now)
  const getVoteDeadline = () => {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);
    return (
      deadline.toLocaleDateString() + " at " + deadline.toLocaleTimeString()
    );
  };

  // Calculate estimated reward
  const calculateEstimatedReward = () => {
    const amount = Number.parseFloat(stakeAmount) || 0;
    return amount * 0.25;
  };

  return (
    <>
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <header className="fixed top-0 w-full z-50 backdrop-blur-md bg-black/80 border-b border-white/10">
          <div className="container mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 sm:space-x-8">
                <Link href="/" className="text-xl sm:text-2xl font-bold">
                  Fradium
                </Link>
                <nav className="hidden lg:flex space-x-6">
                  <Link
                    href="#"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="#"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Community Vote
                  </Link>
                  <Link
                    href="#"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    My Wallet
                  </Link>
                  <Link
                    href="#"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Analytics
                  </Link>
                </nav>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Button className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white text-sm sm:text-base px-2 sm:px-4">
                  <Shield className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Help</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="pt-24 pb-16 px-4 sm:px-6">
          <div className="container mx-auto max-w-6xl">
            {/* Back Button */}
            <div className="mb-6 sm:mb-8">
              <Link
                to="/reports"
                className="inline-flex items-center text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Reports
              </Link>
            </div>

            {/* Page Title */}
            <div className="mb-8 sm:mb-12">
              <h1 className="text-3xl sm:text-4xl font-bold mb-4">
                Create New Report
              </h1>
              <p className="text-lg sm:text-xl text-gray-300">
                Help protect the community by reporting suspicious wallet
                addresses and fraudulent activities.
              </p>
            </div>

            {/* Main Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Left Sidebar - Steps */}
              <div className="hidden lg:block lg:col-span-1">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-6">Progress</h3>

                  <div className="space-y-4">
                    {steps.map((step, index) => (
                      <div key={step.id}>
                        <button
                          onClick={() => goToStep(step.id)}
                          className={`w-full text-left p-4 transition-all ${
                            currentStep === step.id
                              ? "text-[#99e39e]"
                              : currentStep > step.id
                              ? "text-[#99e39e] hover:text-[#7dd17e]"
                              : "text-gray-400 hover:text-gray-300"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                currentStep === step.id
                                  ? "bg-[#99e39e] text-black"
                                  : currentStep > step.id
                                  ? "bg-[#99e39e] text-black"
                                  : "bg-white/10 text-gray-400"
                              }`}
                            >
                              {currentStep > step.id ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                step.id
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div
                                className={`font-medium ${
                                  currentStep === step.id
                                    ? "text-white"
                                    : currentStep > step.id
                                    ? "text-[#99e39e]"
                                    : "text-gray-400"
                                }`}
                              >
                                {step.title}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {step.description}
                              </div>
                            </div>
                          </div>
                        </button>

                        {/* Connector Line */}
                        {index < steps.length - 1 && (
                          <div className="mt-2 mb-2 ml-3">
                            <div
                              className={`w-0.5 h-6 ml-5 ${
                                currentStep > step.id
                                  ? "bg-[#99e39e]"
                                  : "bg-white/20"
                              }`}
                            ></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Content - Form */}
              <div className="lg:col-span-3">
                <div>
                  {/* Mobile Progress Indicator */}
                  <div className="lg:hidden mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">
                        Step {currentStep} of {steps.length}
                      </h3>
                      <span className="text-sm text-gray-400">
                        {steps[currentStep - 1].title}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      {steps.map((step, index) => (
                        <div
                          key={step.id}
                          className={`flex-1 h-1 rounded-full ${
                            currentStep > step.id
                              ? "bg-[#99e39e]"
                              : currentStep === step.id
                              ? "bg-[#99e39e]"
                              : "bg-white/20"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Step Content */}
                  {renderStepContent()}

                  {/* Navigation Buttons */}
                  <div className="flex flex-col sm:flex-row justify-between items-center mt-8 pt-6 border-t border-white/10 space-y-4 sm:space-y-0">
                    <div>
                      {currentStep > 1 && (
                        <Button
                          onClick={prevStep}
                          className="bg-white/10 border border-white/20 hover:bg-white/20 text-white"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Previous
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center space-x-4">
                      <span className="text-gray-400 text-sm">
                        Step {currentStep} of {steps.length}
                      </span>

                      {currentStep < 3 ? (
                        <Button
                          onClick={nextStep}
                          className="bg-white text-black hover:bg-gray-200"
                        >
                          Next
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      ) : (
                        <Button
                          onClick={() => setShowConfirmModal(true)}
                          disabled={isSubmitting}
                          className="bg-red-400 hover:bg-red-500 text-white disabled:opacity-50"
                        >
                          {isSubmitting ? "Submitting..." : "Submit Report"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Success Modal */}
          {showSuccessModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="fixed inset-0 bg-black"
                onClick={() => setShowSuccessModal(false)}
              ></div>
              <div className="relative bg-black border border-white/20 rounded-2xl p-8 w-full max-w-md mx-4 text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-green-400/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Report Submitted!</h3>
                  <p className="text-gray-300 mb-4">
                    Your report has been submitted successfully and is now under
                    community review.
                  </p>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Report ID</div>
                    <div className="font-mono text-lg">
                      RPT-2024-
                      {Math.floor(Math.random() * 9999)
                        .toString()
                        .padStart(4, "0")}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                  <Button
                    onClick={() => setShowSuccessModal(false)}
                    className="flex-1 bg-white/10 border border-white/20 hover:bg-white/20 text-white"
                  >
                    Create Another
                  </Button>
                  <Link href="/reports" className="flex-1">
                    <Button className="w-full bg-white text-black hover:bg-gray-200">
                      View Reports
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black"
            onClick={() => setShowConfirmModal(false)}
          ></div>
          <div className="relative bg-black border border-white/20 rounded-xl sm:rounded-2xl p-6 sm:p-8 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl sm:text-2xl  text-white font-bold">
                Confirm Report Submission
              </h3>
              <Button
                onClick={() => setShowConfirmModal(false)}
                className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* User Stats */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm sm:text-base">
                    Your current balance:
                  </span>
                  <span className="font-bold text-white">
                    {convertE8sToToken(balance)} FUM
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm sm:text-base">
                    Minimum stake required:
                  </span>
                  <span className="font-bold text-red-400">5 FUM</span>
                </div>
              </div>

              {/* Stake Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Enter amount of FUM to stake
                </label>
                <Input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="5"
                  min="5"
                  max={userBalance}
                  className="bg-white/5 border-white/20 text-white placeholder-gray-400 focus:bg-white/10"
                />
                <p className="text-gray-400 text-xs mt-1">
                  Minimum: 5 FUM tokens required to submit a report
                </p>
              </div>

              {/* Vote Information */}
              <div className="space-y-3 p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm sm:text-base">
                    Vote ends:
                  </span>
                  <span className="font-bold text-yellow-400">
                    {getVoteDeadline()}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-gray-300 text-sm sm:text-base">
                    If report is validated, estimated reward:
                  </span>
                  <span className="font-bold text-green-400">
                    +{calculateEstimatedReward()} FUM
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  Your staked tokens will be returned when voting is completed
                  within the deadline, plus rewards if the report is validated
                  by the community.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <Button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 bg-white/10 border border-white/20 hover:bg-white/20 text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  // disabled={
                  //   !stakeAmount ||
                  //   Number.parseFloat(stakeAmount) < 5 ||
                  //   Number.parseFloat(stakeAmount) > userBalance ||
                  //   isSubmitting
                  // }
                  className="flex-1 bg-red-400 hover:bg-red-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Submitting..." : "Confirm & Submit"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black"
            onClick={() => setShowSuccessModal(false)}
          ></div>
          <div className="relative bg-black border border-white/20 rounded-2xl p-8 w-full max-w-md mx-4 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-400/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Report Submitted!</h3>
              <p className="text-gray-300 mb-4">
                Your report has been submitted successfully and is now under
                community review.
              </p>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Report ID</div>
                <div className="font-mono text-lg">
                  RPT-2024-
                  {Math.floor(Math.random() * 9999)
                    .toString()
                    .padStart(4, "0")}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <Button
                onClick={() => setShowSuccessModal(false)}
                className="flex-1 bg-white/10 border border-white/20 hover:bg-white/20 text-white"
              >
                Create Another
              </Button>
              <Link href="/reports" className="flex-1">
                <Button className="w-full bg-white text-black hover:bg-gray-200">
                  View Reports
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
