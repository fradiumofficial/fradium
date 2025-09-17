// UI Components
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Textarea } from "@/core/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import PrimaryButton from "@/core/components/Button";
import ButtonGreen from "@/core/components/ButtonGreen.jsx";
import Footer from "../../core/components/Footer.jsx";
import { fradium_ledger } from "declarations/fradium_ledger";

// Icon
import { AlertTriangle, ArrowLeft, ArrowRight, Check, CheckCircle, FileText, Plus, Upload, Wallet, X } from "lucide-react";

// React & Router
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";

// Auth
import { useAuth } from "@/core/providers/AuthProvider";

// Canister & Backend
import { Principal } from "@dfinity/principal";

// Utils (local)
import { convertE8sToToken, optValue } from "@/core/lib/canisterUtils";

import { uploadMultipleFilesToPinataWithFallback } from "@/core/lib/pinataUtils";
import { validateFiles, formatFileSize, FILE_SIZE_LIMITS, ALLOWED_FILE_TYPES } from "@/core/lib/fileValidationUtils";
import { toast } from "react-toastify";

export default function CreateReportPage() {
  const { isAuthenticated, handleLogin, identity } = useAuth();
  const navigate = useNavigate();
  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState("forward");
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

  // Toast helper styled with Fradium design system
  const showFileTooLargeToast = (tooLargeFiles) => {
    toast.error(
      (
        <div className="text-left">
          <div className="font-medium mb-1">Ukuran file terlalu besar</div>
          <div className="text-sm text-white/90">Batas maksimal 2MB per file. File berikut melebihi batas:</div>
          <ul className="mt-2 list-disc list-inside text-sm">
            {tooLargeFiles.map((f, i) => (
              <li key={i}>
                <span className="font-medium">{f.name}</span>
                <span className="text-white/80"> — {formatFileSize(f.size)}</span>
              </li>
            ))}
          </ul>
        </div>
      ),
      {
        icon: <AlertTriangle className="text-red-400" />,
        className:
          "!bg-[#0B0F14] !text-white !border !border-red-400/25 !rounded-2xl !backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.45)]",
        progressClassName: "!bg-red-400",
        closeOnClick: true,
        autoClose: 4800,
      }
    );
  };

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
      const balance = await fradium_ledger.icrc1_balance_of({
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
      setTransitionDirection("forward");
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep((prev) => Math.min(prev + 1, 3));
        setIsTransitioning(false);
      }, 180);
    }
  };

  const prevStep = () => {
    if (!isAuthenticated) return;
    setTransitionDirection("back");
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep((prev) => Math.max(prev - 1, 1));
      setIsTransitioning(false);
    }, 180);
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
      const approveResult = await fradium_ledger.icrc2_approve({
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

    // Custom nice popup when files exceed max size
    const MAX_SIZE = FILE_SIZE_LIMITS.MEDIUM;
    const tooLarge = selectedFiles.filter((f) => f.size > MAX_SIZE);
    if (tooLarge.length > 0) {
      showFileTooLargeToast(tooLarge);
      return;
    }

    if (validation.errors.length > 0 || validation.invalid.length > 0) {
      toast.error("File tidak valid. Pastikan tipe gambar (PNG/JPG) dan ukuran ≤ 2MB.");
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
              <h2 className="text-2xl font-medium mb-2">Scammer Information</h2>
              <p className="text-gray-400 mb-6">Provide the wallet address and related information.</p>
            </div>

            {/* What Happened Select */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                What happened? <span className="text-red-400">*</span>
              </label>
              <Select value={formData.whatHappened} onValueChange={(value) => handleInputChange("whatHappened", value)} disabled={!isAuthenticated}>
                <SelectTrigger className={`bg-white/5 rounded-xl border-white/20 text-white focus:bg-white/10 ${errors.whatHappened ? "border-red-400" : ""} ${!isAuthenticated ? "opacity-50 cursor-not-allowed" : ""}`}>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent className="bg-[#0B0F1480] backdrop-blur-md border border-white/10 rounded-xl text-white shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
                  {whatHappenedOptions.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="text-white/90 data-[highlighted]:bg-white/10 data-[state=checked]:bg-white/15 focus:bg-white/15 focus:text-white"
                    >
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
                    <div key={index} className="flex items-center space-x-3 p-3 bg-white/5 border border-white/20 rounded-xl">
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
                  <Button onClick={() => document.getElementById("evidence-files").click()} disabled={files.length >= 5 || !isAuthenticated} className={`bg-white/10 border rounded-full border-white/20 hover:bg-white/20 text-white ${!isAuthenticated ? "opacity-50 cursor-not-allowed" : ""}`}>
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
              <h2 className="text-2xl font-medium mb-2">Scammer Information</h2>
              <p className="text-gray-400 mb-6">Provide the wallet address and related information.</p>
            </div>

            {/* Address Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Wallet Address <span className="text-red-400">*</span>
              </label>
              <Input value={formData.address} onChange={(e) => handleInputChange("address", e.target.value)} placeholder="Enter the wallet address (e.g., 0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4)" className={`bg-white/5 border-white/20 text-white placeholder-gray-400 focus:bg-white/10 rounded-xl ${errors.address ? "border-red-400" : ""}`} />
              {errors.address && <p className="text-red-400 text-sm mt-1">{errors.address}</p>}
            </div>

            {/* Auto-detected Chain */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Blockchain Network</label>
              <div className="flex rounded-xl items-center space-x-3 p-3 bg-white/5 border border-white/20">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-white font-medium">{formData.chain || "Enter address to auto-detect"}</span>
              </div>
            </div>

            {/* URL Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Related URL <span className="text-gray-400">(Optional)</span>
              </label>
              <Input value={formData.url} onChange={(e) => handleInputChange("url", e.target.value)} placeholder="Enter related website or social media URL (e.g., https://example.com)" className={`bg-white/5 border-white/20 text-white placeholder-gray-400 focus:bg-white/10 rounded-xl ${errors.url ? "border-red-400" : ""}`} />
              {errors.url && <p className="text-red-400 text-sm mt-1">{errors.url}</p>}
              <p className="text-gray-400 text-xs mt-1">Add any related website, social media, or platform URL where the scam occurred</p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-medium mb-2">Scammer Information</h2>
              <p className="text-gray-400 mb-6">Provide a detailed description of the suspicious activity.</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description <span className="text-red-400">*</span>
              </label>
              <Textarea value={formData.description} onChange={(e) => handleInputChange("description", e.target.value)} placeholder="Provide a detailed explanation of the suspicious activity, including how you discovered it, what happened, and any relevant context..." rows={6} className={`bg-white/5 border-white/20 text-white placeholder-gray-400 focus:bg-white/10 resize-none rounded-xl ${errors.description ? "border-red-400" : ""}`} />
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
      <div className=" bg-[#000510] text-white relative overflow-hidden min-h-[900px] md:min-h-[1000px] lg:min-h-[1100px]">
        {/* Background layer */}
        <div className="absolute inset-x-0 top-20 md:top-28 bottom-0 z-0 pointer-events-none select-none">
          <img
            src="https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/backgrounds/background-3.webp"
            alt=""
            aria-hidden="true"
            decoding="async"
            loading="lazy"
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
        </div>
        {/* Soft fade at top edge */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#000510] to-transparent z-0" />
        <main className="pt-24 px-4 sm:px-6">
          <div className="relative z-10 container mx-auto max-w-6xl">
            {/* Back Button */}
            <div className="mb-6 sm:mb-8">
              <Link to="/reports" className="inline-flex items-center text-gray-300 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Reports
              </Link>
            </div>

            {/* Page Title */}
            <div className="mb-8 sm:mb-8">
              <h1 className="text-3xl sm:text-4xl font-medium mb-4">Create New Report</h1>
              <p className="text-lg sm:text-base text-gray-300">Help protect the community by reporting suspicious wallet addresses and fraudulent activities.</p>
            </div>

            {/* Login Required Alert */}
            {!isAuthenticated && (
              <div className="mb-8 bg-[#99E39E12] backdrop-blur-sm border border-[#99E39E33] rounded-2xl p-6 pb-8">
                <div className="flex items-start space-x-4">
                  <AlertTriangle className="w-6 h-6 text-[#99e39e] flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#99e39e] mb-2">Login Required</h3>
                    <p className="text-gray-300 mb-4">You need to login to create a new report. This ensures secure submission and allows you to stake FUM tokens for the community validation process.</p>
                    <ButtonGreen size="sm" fontWeight="medium" onClick={handleLogin}>Login to Continue</ButtonGreen>
                  </div>
                </div>
              </div>
            )}

            {/* Main Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Left Sidebar - Steps */}
              <div className="hidden lg:block lg:col-span-1">
                <div className="space-y-4">
                  <div className="space-y-4">
                    {steps.map((step, index) => (
                      <div key={step.id}>
                        <button onClick={() => goToStep(step.id)} disabled={!isAuthenticated} className={`w-full text-left pl-4 transition-colors duration-300 ${!isAuthenticated ? "opacity-50 cursor-not-allowed" : currentStep === step.id ? "text-white" : currentStep > step.id ? "text-[#99e39e]" : "text-gray-400 hover:text-gray-300"}`}>
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors duration-300 ${currentStep === step.id ? "bg-[#99e39e] text-black" : currentStep > step.id ? "bg-[#99e39e] text-black" : "bg-white/10 text-gray-400"}`}>{currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}</div>
                            <div className="flex-1 min-w-0">
                              <div className={`font-medium transition-colors duration-300 ${currentStep === step.id ? "text-white" : currentStep > step.id ? "text-[#99e39e]" : "text-gray-400"}`}>{step.title}</div>
                              <div className="text-xs text-gray-400 mt-1">{step.description}</div>
                            </div>
                          </div>
                        </button>

                        {/* Connector Line */}
                        {index < steps.length - 1 && (
                          <div className="mt-2 ml-3">
                            <div className={`w-0.5 h-8 ml-5 transition-colors duration-500 ${currentStep > step.id ? "bg-[#99e39e]" : "bg-white/20"}`}></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Content - Form */}
              <div className="lg:col-span-3">
                <div className={`${!isAuthenticated ? "opacity-50" : ""} bg-[#00000080] backdrop-blur-sm border border-white/10 rounded-2xl p-5 sm:p-6 lg:p-7 shadow-[0_16px_48px_rgba(0,0,0,0.30)]`}>
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

                  {/* Step Content with transition */}
                  <div className={`transition-all duration-300 ${isTransitioning ? (transitionDirection === "forward" ? "opacity-0 translate-y-2" : "opacity-0 -translate-y-2") : "opacity-100 translate-y-0"}`}>
                    {renderStepContent()}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex flex-col sm:flex-row justify-between items-center mt-8 pt-6 border-t border-white/10 space-y-4 sm:space-y-0">
                    <div>
                      {currentStep > 1 && (
                        <Button
                          onClick={prevStep}
                          disabled={!isAuthenticated}
                          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm backdrop-blur-sm ${!isAuthenticated ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>Previous</span>
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center space-x-4">
                      <span className="text-gray-400 text-sm">
                        Step {currentStep} of {steps.length}
                      </span>

                      {currentStep < 3 ? (
                        <ButtonGreen size="sm" fontWeight="medium" onClick={nextStep} className={`${!isAuthenticated ? "opacity-50 cursor-not-allowed" : ""}`}>
                          <span className="inline-flex items-center gap-2">
                            Next
                            <ArrowRight className="w-4 h-4 text-[#0A4C2A]" aria-hidden="true" />
                          </span>
                        </ButtonGreen>
                      ) : (
                        <ButtonGreen size="sm" fontWeight="medium" onClick={() => setShowConfirmModal(true)} disabled={isSubmitting || isUploading || !isAuthenticated || hasSubmitErrors()} className={`text-white disabled:opacity-50 ${!isAuthenticated ? "cursor-not-allowed" : ""}`}>
                          {isUploading ? "Uploading..." : isSubmitting ? "Submitting..." : "Submit Report"}
                        </ButtonGreen>
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
                <Input type="number" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} placeholder="5" min="5" max={userBalance} required className={`bg-white/5 border-white/20 text-white placeholder-gray-400 focus:bg-white/10 rounded-xl`} />
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
      <Footer />
    </>
  );
}
