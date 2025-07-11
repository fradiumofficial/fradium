import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Textarea } from "@/core/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Plus, X, CheckCircle, Upload, FileText, Wallet } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/core/providers/auth-provider";
import { token } from "declarations/token";
import { convertE8sToToken, optValue } from "../../core/lib/canisterUtils";
import { backend, canisterId as backendCanisterId } from "declarations/backend";
import { Principal } from "@dfinity/principal";
import PrimaryButton from "@/core/components/Button";

import { uploadMultipleFilesToPinataWithFallback } from "@/core/services/pinata";
import { validateFiles, formatFileSize, FILE_SIZE_LIMITS, ALLOWED_FILE_TYPES } from "@/core/services/fileValidation";
import { toast } from "react-toastify";

export default function CreateReportPage() {
  const { isAuthenticated, handleLogin, identity } = useAuth();
  const navigate = useNavigate();
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
  const [isUploading, setIsUploading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [stakeAmount, setStakeAmount] = useState(5);
  const [userBalance, setUserBalance] = useState(100);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [files, setFiles] = useState([]);

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
    } else if (address.startsWith("bc1") || address.startsWith("1") || address.startsWith("3")) {
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

  // Real-time error checking
  useEffect(() => {
    if (currentStep === 3) {
      const submitErrors = {};

      if (!formData.whatHappened.trim()) {
        submitErrors.whatHappened = "This field is required";
      }

      if (!formData.address.trim()) {
        submitErrors.address = "Address is required";
      } else if (formData.address.length < 10) {
        submitErrors.address = "Please enter a valid address";
      }

      if (!formData.description.trim()) {
        submitErrors.description = "Description is required";
      } else if (formData.description.length < 20) {
        submitErrors.description = "Description must be at least 20 characters";
      }

      if (!stakeAmount || Number(stakeAmount) < 5) {
        submitErrors.stakeAmount = "Minimum 5 FUM tokens required";
      }

      if (formData.url.trim()) {
        try {
          new URL(formData.url);
        } catch {
          submitErrors.url = "Please enter a valid URL";
        }
      }

      setErrors(submitErrors);
    }
  }, [formData, currentStep, stakeAmount]);

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

  // Real-time validation for submit button
  const hasSubmitErrors = () => {
    const submitErrors = {};

    // Check all required fields
    if (!formData.whatHappened.trim()) {
      submitErrors.whatHappened = "This field is required";
    }

    if (!formData.address.trim()) {
      submitErrors.address = "Address is required";
    } else if (formData.address.length < 10) {
      submitErrors.address = "Please enter a valid address";
    }

    if (!formData.description.trim()) {
      submitErrors.description = "Description is required";
    } else if (formData.description.length < 20) {
      submitErrors.description = "Description must be at least 20 characters";
    }

    // Validate stake amount
    if (!stakeAmount || Number(stakeAmount) < 5) {
      submitErrors.stakeAmount = "Minimum 5 FUM tokens required";
    }

    // Validate URL if provided
    if (formData.url.trim()) {
      try {
        new URL(formData.url);
      } catch {
        submitErrors.url = "Please enter a valid URL";
      }
    }

    return Object.keys(submitErrors).length > 0;
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  console.log(files);

  // Navigation functions
  const nextStep = () => {
    if (!isAuthenticated) return;
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    if (!isAuthenticated) return;
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const goToStep = (step) => {
    if (!isAuthenticated) return;
    if (step <= 3 && (step < currentStep || validateStep(currentStep))) {
      setCurrentStep(step);
    }
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validateStep(3)) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Approve tokens first
      const approveResult = await token.icrc2_approve({
        from_subaccount: [],
        spender: Principal.fromText(backendCanisterId),
        amount: BigInt(stakeAmount) * BigInt(10 ** 8),
        expires_at: [],
        fee: [],
        memo: [new TextEncoder().encode(`Approve for staking report creation`)],
        created_at_time: [],
      });

      // Check if approve failed
      if (!approveResult || approveResult.Err) {
        if (approveResult.Err?.InsufficientFunds) {
          toast.error("Insufficient funds. Please top up your balance.");
        } else {
          toast.error("Failed to approve tokens. Please try again.");
        }
        return;
      }

      // Upload files to Pinata after successful approve
      const evidenceUrls = [];
      if (files.length > 0) {
        setIsUploading(true);

        try {
          const uploadResult = await uploadMultipleFilesToPinataWithFallback(files);
          evidenceUrls.push(...uploadResult.success);
        } catch (error) {
          console.error("Error during file upload:", error);
        } finally {
          setIsUploading(false);
        }
      }

      const response = await backend.create_report({
        chain: formData.chain,
        address: formData.address,
        category: formData.whatHappened.toLowerCase(),
        description: formData.description,
        url: optValue(formData.url ?? null),
        evidence: evidenceUrls.length > 0 ? evidenceUrls : [],
        stake_amount: Number(stakeAmount) * 10 ** 8,
      });
      console.log("response", response);

      if (response.Ok) {
        toast.success("Report created successfully.");
        setShowConfirmModal(false);

        // Trigger balance update event for navbar
        window.dispatchEvent(new Event("balance-updated"));

        navigate("/reports");
      } else {
        if (response.Err) {
          toast.error(response.Err);
        } else {
          toast.error("Failed to create report. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    // Validate files using service
    const validation = validateFiles([...files, ...selectedFiles], {
      maxSize: FILE_SIZE_LIMITS.MEDIUM,
      allowedTypes: ALLOWED_FILE_TYPES.IMAGES,
      maxFiles: 5,
    });

    if (validation.errors.length > 0) {
      return;
    }

    if (validation.invalid.length > 0) {
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

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Case Details</h2>
              <p className="text-gray-400 mb-6">Provide details about what happened and supporting evidence.</p>
            </div>

            {/* What Happened Select */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                What happened? <span className="text-red-400">*</span>
              </label>
              <Select value={formData.whatHappened} onValueChange={(value) => handleInputChange("whatHappened", value)} disabled={!isAuthenticated}>
                <SelectTrigger className={`bg-white/5 border-white/20 text-white focus:bg-white/10 ${errors.whatHappened ? "border-red-400" : ""} ${!isAuthenticated ? "opacity-50 cursor-not-allowed" : ""}`}>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/20">
                  {whatHappenedOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-white hover:bg-white/10">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.whatHappened && <p className="text-red-400 text-sm mt-1">{errors.whatHappened}</p>}
            </div>

            {/* Evidence Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Evidence Files <span className="text-gray-400">(Optional)</span>
              </label>

              {files.length > 0 && (
                <div className="space-y-3 mb-4">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-white/5 border border-white/20 rounded-md">
                      {file.preview ? (
                        <div className="h-10 w-10 rounded overflow-hidden flex-shrink-0">
                          <img src={file.preview || "/placeholder.svg"} alt={file.name} className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <FileText className="h-10 w-10 p-2 text-gray-400" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">{file.name}</div>
                        <div className="text-xs text-gray-400">{formatFileSize(file.size)}</div>
                      </div>
                      <Button onClick={() => removeFile(index)} className="bg-red-400/10 border border-red-400/20 hover:bg-red-400/20 text-red-400 p-2">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className={`border-2 border-dashed border-white/20 rounded-lg p-4 text-center bg-white/5 ${!isAuthenticated ? "opacity-50" : ""}`}>
                <Input id="evidence-files" type="file" multiple className="hidden" onChange={handleFileChange} accept="image/png,image/jpeg,image/jpg" disabled={files.length >= 2 || !isAuthenticated} />
                <div className="py-4">
                  <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-300 mb-1">Drag and drop files, or click to browse</p>
                  <p className="text-xs text-gray-400 mb-4">Supports PNG, JPG, and JPEG files (max 2MB each, max 5 files)</p>
                  <Button onClick={() => document.getElementById("evidence-files").click()} disabled={files.length >= 5 || !isAuthenticated} className={`bg-white/10 border border-white/20 hover:bg-white/20 text-white ${!isAuthenticated ? "opacity-50 cursor-not-allowed" : ""}`}>
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
              <p className="text-gray-400 mb-6">Provide the wallet address and related information.</p>
            </div>

            {/* Address Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Wallet Address <span className="text-red-400">*</span>
              </label>
              <Input value={formData.address} onChange={(e) => handleInputChange("address", e.target.value)} placeholder="Enter the wallet address (e.g., 0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4)" className={`bg-white/5 border-white/20 text-white placeholder-gray-400 focus:bg-white/10 ${errors.address ? "border-red-400" : ""}`} />
              {errors.address && <p className="text-red-400 text-sm mt-1">{errors.address}</p>}
            </div>

            {/* Auto-detected Chain */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Blockchain Network</label>
              <div className="flex items-center space-x-3 p-3 bg-white/5 border border-white/20">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-white font-medium">{formData.chain || "Enter address to auto-detect"}</span>
              </div>
            </div>

            {/* URL Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Related URL <span className="text-gray-400">(Optional)</span>
              </label>
              <Input value={formData.url} onChange={(e) => handleInputChange("url", e.target.value)} placeholder="Enter related website or social media URL (e.g., https://example.com)" className={`bg-white/5 border-white/20 text-white placeholder-gray-400 focus:bg-white/10 ${errors.url ? "border-red-400" : ""}`} />
              {errors.url && <p className="text-red-400 text-sm mt-1">{errors.url}</p>}
              <p className="text-gray-400 text-xs mt-1">Add any related website, social media, or platform URL where the scam occurred</p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Description</h2>
              <p className="text-gray-400 mb-6">Provide a detailed description of the suspicious activity.</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description <span className="text-red-400">*</span>
              </label>
              <Textarea value={formData.description} onChange={(e) => handleInputChange("description", e.target.value)} placeholder="Provide a detailed explanation of the suspicious activity, including how you discovered it, what happened, and any relevant context..." rows={6} className={`bg-white/5 border-white/20 text-white placeholder-gray-400 focus:bg-white/10 resize-none ${errors.description ? "border-red-400" : ""}`} />
              <div className="flex justify-between items-center mt-1">
                {errors.description && <p className="text-red-400 text-sm">{errors.description}</p>}
                <p className="text-gray-400 text-sm ml-auto">{formData.description.length}/500 characters (min. 20)</p>
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
    return deadline.toLocaleDateString() + " at " + deadline.toLocaleTimeString();
  };

  // Calculate estimated reward
  const calculateEstimatedReward = () => {
    const amount = Number.parseFloat(stakeAmount) || 0;
    return amount * 0.25;
  };

  return (
    <>
      <div className="min-h-screen bg-black text-white">
        <main className="pt-24 pb-16 px-4 sm:px-6">
          <div className="container mx-auto max-w-6xl">
            {/* Back Button */}
            <div className="mb-6 sm:mb-8">
              <Link to="/reports" className="inline-flex items-center text-gray-300 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Reports
              </Link>
            </div>

            {/* Page Title */}
            <div className="mb-8 sm:mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold mb-4">Create New Report</h1>
              <p className="text-lg sm:text-xl text-gray-300">Help protect the community by reporting suspicious wallet addresses and fraudulent activities.</p>
            </div>

            {/* Login Required Alert */}
            {!isAuthenticated && (
              <div className="mb-8 bg-[#99e39e]/10 border border-[#99e39e]/20 rounded-xl p-6 pb-8">
                <div className="flex items-start space-x-4">
                  <AlertTriangle className="w-6 h-6 text-[#99e39e] flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#99e39e] mb-2">Login Required</h3>
                    <p className="text-gray-300 mb-4">You need to login to create a new report. This ensures secure submission and allows you to stake FUM tokens for the community validation process.</p>
                    <PrimaryButton onClick={handleLogin} className="bg-[#99e39e] text-black font-semibold">
                      Login to Continue
                    </PrimaryButton>
                  </div>
                </div>
              </div>
            )}

            {/* Main Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Left Sidebar - Steps */}
              <div className="hidden lg:block lg:col-span-1">
                <div className="space-y-4">
                  <h3 className={`text-lg font-semibold mb-6 ${!isAuthenticated ? "text-white/50" : "text-white"}`}>Progress</h3>

                  <div className="space-y-4">
                    {steps.map((step, index) => (
                      <div key={step.id}>
                        <button onClick={() => goToStep(step.id)} disabled={!isAuthenticated} className={`w-full text-left p-4 transition-all ${!isAuthenticated ? "opacity-50 cursor-not-allowed" : currentStep === step.id ? "text-blue-400" : currentStep > step.id ? "text-green-400 hover:text-green-300" : "text-gray-400 hover:text-gray-300"}`}>
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === step.id ? "bg-[#99e39e] text-black" : currentStep > step.id ? "bg-[#99e39e] text-black" : "bg-white/10 text-gray-400"}`}>{currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}</div>
                            <div className="flex-1 min-w-0">
                              <div className={`font-medium ${currentStep === step.id ? "text-white" : currentStep > step.id ? "text-[#99e39e]" : "text-gray-400"}`}>{step.title}</div>
                              <div className="text-xs text-gray-400 mt-1">{step.description}</div>
                            </div>
                          </div>
                        </button>

                        {/* Connector Line */}
                        {index < steps.length - 1 && (
                          <div className="mt-2 mb-2 ml-3">
                            <div className={`w-0.5 h-6 ml-5 ${currentStep > step.id ? "bg-[#99e39e]" : "bg-white/20"}`}></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Content - Form */}
              <div className="lg:col-span-3">
                <div className={`${!isAuthenticated ? "opacity-50" : ""}`}>
                  {/* Mobile Progress Indicator */}
                  <div className="lg:hidden mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">
                        Step {currentStep} of {steps.length}
                      </h3>
                      <span className="text-sm text-gray-400">{steps[currentStep - 1].title}</span>
                    </div>
                    <div className="flex space-x-2">
                      {steps.map((step, index) => (
                        <div key={step.id} className={`flex-1 h-1 rounded-full ${currentStep > step.id ? "bg-[#99e39e]" : currentStep === step.id ? "bg-[#99e39e]" : "bg-white/20"}`} />
                      ))}
                    </div>
                  </div>

                  {/* Step Content */}
                  {renderStepContent()}

                  {/* Navigation Buttons */}
                  <div className="flex flex-col sm:flex-row justify-between items-center mt-8 pt-6 border-t border-white/10 space-y-4 sm:space-y-0">
                    <div>
                      {currentStep > 1 && (
                        <Button onClick={prevStep} disabled={!isAuthenticated} className={`bg-white/10 border border-white/20 hover:bg-white/20 text-white ${!isAuthenticated ? "opacity-50 cursor-not-allowed" : ""}`}>
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
                        <Button onClick={nextStep} disabled={!isAuthenticated} className={`bg-white text-black hover:bg-gray-200 ${!isAuthenticated ? "opacity-50 cursor-not-allowed" : ""}`}>
                          Next
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      ) : (
                        <Button onClick={() => setShowConfirmModal(true)} disabled={isSubmitting || isUploading || !isAuthenticated || hasSubmitErrors()} className={`bg-red-400 hover:bg-red-500 text-white disabled:opacity-50 ${!isAuthenticated ? "cursor-not-allowed" : ""}`}>
                          {isUploading ? "Uploading..." : isSubmitting ? "Submitting..." : "Submit Report"}
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
              <div className="fixed inset-0 bg-black" onClick={() => setShowSuccessModal(false)}></div>
              <div className="relative bg-black border border-white/20 rounded-2xl p-8 w-full max-w-md mx-4 text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-green-400/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Report Submitted!</h3>
                  <p className="text-gray-300 mb-4">Your report has been submitted successfully and is now under community review.</p>
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
                  <Button onClick={() => setShowSuccessModal(false)} className="flex-1 bg-white/10 border border-white/20 hover:bg-white/20 text-white">
                    Create Another
                  </Button>
                  <Link href="/reports" className="flex-1">
                    <Button className="w-full bg-white text-black hover:bg-gray-200">View Reports</Button>
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
          <div className="fixed inset-0 bg-black" onClick={() => setShowConfirmModal(false)}></div>
          <div className="relative bg-black border border-white/20 rounded-xl sm:rounded-2xl p-6 sm:p-8 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl sm:text-2xl  text-white font-bold">Confirm Report Submission</h3>
              <Button onClick={() => setShowConfirmModal(false)} className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* User Stats */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm sm:text-base">Your current balance:</span>
                  <span className="font-bold text-white">{convertE8sToToken(balance)} FUM</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm sm:text-base">Minimum stake required:</span>
                  <span className="font-bold text-red-400">5 FUM</span>
                </div>
              </div>

              {/* Stake Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Enter amount of FUM to stake <span className="text-red-400">*</span>
                </label>
                <Input type="number" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} placeholder="5" min="5" max={userBalance} required className={`bg-white/5 border-white/20 text-white placeholder-gray-400 focus:bg-white/10`} />
                <p className="text-gray-400 text-xs mt-1">Minimum: 5 FUM tokens required to submit a report</p>
              </div>

              {/* Vote Information */}
              <div className="space-y-3 p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm sm:text-base">Vote ends:</span>
                  <span className="font-bold text-yellow-400">{getVoteDeadline()}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-gray-300 text-sm sm:text-base">If report is validated, estimated reward:</span>
                  <span className="font-bold text-green-400">+{calculateEstimatedReward()} FUM</span>
                </div>
                <div className="text-xs text-gray-400 mt-2">Your staked tokens will be returned when voting is completed within the deadline, plus rewards if the report is validated by the community.</div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <Button onClick={() => setShowConfirmModal(false)} className="flex-1 bg-white/10 border border-white/20 hover:bg-white/20 text-white">
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting || isUploading || !stakeAmount || Number(stakeAmount) < 5} className="flex-1 bg-red-400 hover:bg-red-500 text-white disabled:opacity-50 disabled:cursor-not-allowed">
                  {isUploading ? "Uploading Files..." : isSubmitting ? "Submitting..." : "Confirm & Submit"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black" onClick={() => setShowSuccessModal(false)}></div>
          <div className="relative bg-black border border-white/20 rounded-2xl p-8 w-full max-w-md mx-4 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-400/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Report Submitted!</h3>
              <p className="text-gray-300 mb-4">Your report has been submitted successfully and is now under community review.</p>
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
              <Button onClick={() => setShowSuccessModal(false)} className="flex-1 bg-white/10 border border-white/20 hover:bg-white/20 text-white">
                Create Another
              </Button>
              <Link href="/reports" className="flex-1">
                <Button className="w-full bg-white text-black hover:bg-gray-200">View Reports</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
