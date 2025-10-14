import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { RefreshCw, Clock, ShieldCheck } from "lucide-react";
import LightButton from "@/core/components/ui/LightButton.jsx";
import { backend as backendCan } from "declarations/backend";
import { canisterId as backendCanisterId } from "declarations/backend";
import { formatAmount } from "@/core/lib/tokenUtils";
import { Principal } from "@dfinity/principal";
import { fradium_ledger } from "declarations/fradium_ledger";
import toast from "react-hot-toast";

const APICreditsPage = () => {
  // Local approval history (filtered by API_CREDITS metadata)
  const STORAGE_KEY = "apiCreditsApprovalHistory";
  const [history, setHistory] = useState([]);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [amountInput, setAmountInput] = useState("");
  const [isApproving, setIsApproving] = useState(false);

  // Normalize numeric input: remove leading zeros except before decimal
  const normalizeAmountInput = (value) => {
    if (value === "") return "";
    // keep only digits and dot
    let cleaned = String(value).replace(/[^0-9.]/g, "");
    // if starts with dot, prefix with 0
    if (cleaned.startsWith(".")) cleaned = "0" + cleaned;
    // split by first dot only
    const [rawInt, rawFrac = ""] = cleaned.split(".");
    // strip leading zeros but keep single 0 when needed
    const intPart = rawInt.replace(/^0+(?=\d)/, "");
    const safeInt = intPart === "" ? "0" : intPart;
    // allow fractional
    const fracPart = rawFrac.replace(/[^0-9]/g, "");
    return cleaned.includes(".") ? `${safeInt}.${fracPart}` : safeInt;
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const onlyApiCredits = Array.isArray(parsed) ? parsed.filter((h) => h?.metadata === "API_CREDITS") : [];
      setHistory(onlyApiCredits);
    } catch (e) {
      setHistory([]);
    }
  }, []);

  // Match ConfirmationModal scroll behavior
  useEffect(() => {
    if (showApproveModal) {
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = "0px";
    } else {
      document.body.style.overflow = "unset";
      document.body.style.paddingRight = "0px";
    }
    return () => {
      document.body.style.overflow = "unset";
      document.body.style.paddingRight = "0px";
    };
  }, [showApproveModal]);

  // Backend stats and history
  const [stats, setStats] = useState({ used_e8s: 0, remaining_e8s: 0 });
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchStats = async () => {
    try {
      setIsLoadingStats(true);
      const res = await backendCan.get_api_credits_stats();
      setStats({ used_e8s: res.used_e8s || 0, remaining_e8s: res.remaining_e8s || 0 });
    } catch (_e) {
      setStats({ used_e8s: 0, remaining_e8s: 0 });
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchHistory = async (offset = 0, limit = 50) => {
    try {
      setHistoryLoading(true);
      const res = await backendCan.get_api_approvals_history(offset, limit);

      console.log("res", res);
      const items = Array.isArray(res.items) ? res.items : [];
      // sort by time descending (latest first); handle BigInt safely
      const sorted = items.slice().sort((a, b) => {
        const aAt = typeof a.at === "bigint" ? a.at : BigInt(a.at || 0);
        const bAt = typeof b.at === "bigint" ? b.at : BigInt(b.at || 0);
        return aAt === bAt ? 0 : aAt > bAt ? -1 : 1;
      });
      setHistoryItems(sorted);
    } catch (_e) {
      console.log("error", _e);
      setHistoryItems([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchHistory(0, 50);
    const onBalanceUpdated = () => fetchStats();
    window.addEventListener("balance-updated", onBalanceUpdated);
    return () => window.removeEventListener("balance-updated", onBalanceUpdated);
  }, []);

  const used = useMemo(() => Number(stats.used_e8s) / 1e8, [stats]);
  const totalApproved = useMemo(() => (Number(stats.used_e8s) + Number(stats.remaining_e8s)) / 1e8, [stats]);

  // Semicircle gauge for Total Approval card (shows used percentage)
  const gaugeTotal = useMemo(() => {
    const radius = 52; // px
    const stroke = 10; // px
    const halfCirc = Math.PI * radius; // half-circle length (arc path)
    const denom = totalApproved;
    const pctUsed = denom > 0 ? Math.min(Math.max(used / denom, 0), 1) : 0;
    // Improve visual fill when pct ~ 1 to avoid tiny gap due to rounding/joins
    const isFull = pctUsed >= 0.999;
    const dash = isFull ? halfCirc + 2 : halfCirc * pctUsed;
    const gap = Math.max(halfCirc - (isFull ? halfCirc : dash), 0);
    return { radius, stroke, dash, gap, pctUsed };
  }, [totalApproved, used]);

  // Remaining and status color/label based on thresholds in FUM
  const remainingFum = useMemo(() => Math.max(totalApproved - used, 0), [totalApproved, used]);
  const { statusColorTotal, statusLabelTotal } = useMemo(() => {
    if (totalApproved <= 0) {
      return { statusColorTotal: "#EF4444", statusLabelTotal: "No allowance" };
    }
    if (remainingFum > 5) {
      return { statusColorTotal: "#10B981", statusLabelTotal: "Full" }; // green
    }
    if (remainingFum <= 1) {
      return { statusColorTotal: "#EF4444", statusLabelTotal: "Low" }; // red
    }
    return { statusColorTotal: "#F59E0B", statusLabelTotal: "Almost depleted" }; // yellow
  }, [totalApproved, remainingFum]);

  // Resolve backend canister ID for display and approve spender
  const backendIdResolved = useMemo(() => {
    return backendCanisterId || (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_CANISTER_ID_BACKEND) || (typeof process !== "undefined" && process.env && process.env.CANISTER_ID_BACKEND) || "Unknown";
  }, []);

  // removed remaining balance gauge and status logic

  // Dummy approval history
  // (History is loaded from localStorage instead)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="min-h-screen bg-transparent">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 mb-2">API Credits</h1>
              <p className="text-slate-600">Manage your API spending limit and approval history.</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="group relative rounded-[16px] border border-slate-200/70 bg-white ring-1 ring-slate-100 p-5 shadow-[0_12px_40px_rgba(2,6,23,0.06)] hover:shadow-[0_18px_56px_rgba(2,6,23,0.12)] transition-all">
            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(520px_200px_at_60%_-40px,rgba(108,140,223,0.16),rgba(45,84,184,0.10)_55%,transparent_75%)]" />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm">Total of Approval</p>
                  <div className="mt-1 text-slate-900 text-2xl font-semibold">{isLoadingStats ? "…" : `${formatAmount(totalApproved)} FUM`}</div>
                </div>
                <ShieldCheck className="w-6 h-6 text-[#2D54B8]" />
              </div>
              {/* Semicircle gauge indicates Used portion from Total */}
              <div className="mt-4 flex items-end gap-6">
                <svg width={140} height={80} viewBox="0 0 140 80" className="overflow-visible">
                  {/* Background half circle */}
                  <path d={`M 20 70 A ${gaugeTotal.radius} ${gaugeTotal.radius} 0 0 1 ${20 + gaugeTotal.radius * 2} 70`} fill="none" stroke="#E5E7EB" strokeWidth={gaugeTotal.stroke} strokeLinecap="round" />
                  {/* Used progress arc */}
                  <path d={`M 20 70 A ${gaugeTotal.radius} ${gaugeTotal.radius} 0 0 1 ${20 + gaugeTotal.radius * 2} 70`} fill="none" stroke={statusColorTotal} strokeWidth={gaugeTotal.stroke} strokeLinecap="round" strokeDasharray={`${gaugeTotal.dash} ${gaugeTotal.gap}`} />
                </svg>
                <div className="flex flex-col">
                  <div className="text-sm text-slate-600">Used</div>
                  <div className="text-lg font-semibold text-slate-900">{isLoadingStats ? "…" : `${formatAmount(used)} FUM`}</div>
                  <div className="text-xs text-slate-500 mt-1">{Math.round(gaugeTotal.pctUsed * 100)}% of approved</div>
                  <div className="mt-2 inline-flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusColorTotal }} />
                    <span className="text-xs text-slate-700">{statusLabelTotal}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="group relative rounded-[16px] border border-slate-200/70 bg-white ring-1 ring-slate-100 p-5 shadow-[0_12px_40px_rgba(2,6,23,0.06)] hover:shadow-[0_18px_56px_rgba(2,6,23,0.12)] transition-all">
            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(520px_200px_at_60%_-40px,rgba(239,68,68,0.16),rgba(220,38,38,0.10)_55%,transparent_75%)]" />
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-slate-600 text-sm">Used Amount</p>
                <div className="mt-1 text-slate-900 text-2xl font-semibold">{isLoadingStats ? "…" : `${formatAmount(used)} FUM`}</div>
              </div>
              <Clock className="w-6 h-6 text-red-500" />
            </div>
          </div>

          {/* Removed Remaining Balance card */}
        </motion.div>

        {/* Approve Action */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 gap-4">
          <div className="group relative rounded-[20px] border border-slate-200/70 bg-white shadow-[0_15px_60px_rgba(2,6,23,0.06)] ring-1 ring-slate-100 p-6 overflow-hidden transition-all duration-300 ease-out transform-gpu hover:shadow-[0_24px_72px_rgba(2,6,23,0.12)] hover:ring-slate-200">
            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(600px_180px_at_50%_-40px,rgba(108,140,223,0.18),rgba(45,84,184,0.12)_55%,transparent_75%)]" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Approve More FUM</h2>
              </div>
              <p className="text-slate-600 text-sm mb-4">Initiate a new FUM approval for API usage. This will call icrc2_approve() from your Fradium wallet.</p>
              <div className="mb-4 text-xs text-slate-600">
                Spender canister: <code className="px-1 py-0.5 bg-slate-100 rounded text-slate-900">{backendIdResolved}</code>
              </div>
              <LightButton
                variant="primary"
                size="sm"
                leftIcon={<RefreshCw className="w-4 h-4" />}
                disabled={isApproving}
                onClick={() => {
                  setShowApproveModal(true);
                }}>
                Approve More FUM
              </LightButton>
            </div>
          </div>
        </motion.div>

        {/* Approval History */}
        <motion.div variants={itemVariants} className="group relative rounded-[20px] border border-slate-200/70 bg-white shadow-[0_15px_60px_rgba(2,6,23,0.06)] ring-1 ring-slate-100 overflow-hidden transition-all duration-300 ease-out transform-gpu hover:shadow-[0_24px_72px_rgba(2,6,23,0.12)] hover:ring-slate-200">
          <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(600px_260px_at_50%_-60px,rgba(108,140,223,0.14),rgba(45,84,184,0.10)_55%,transparent_80%)]" />
          <div className="relative z-10">
            <div className="flex items-center justify-between p-6 pb-4">
              <h2 className="text-lg font-semibold text-slate-900">Approval History</h2>
            </div>
            <div className="px-6 pb-6 overflow-x-auto">
              {historyLoading ? (
                <div className="py-10 text-center text-slate-600">Loading history…</div>
              ) : historyItems.length === 0 ? (
                <div className="py-10 text-center text-slate-600">No approval history yet.</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Amount (FUM)</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {historyItems.map((h, idx) => (
                      <tr key={`${h.at}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 text-slate-900 text-sm">{formatAmount(Number(h.amount_e8s) / 1e8)}</td>
                        <td className="px-4 py-3 text-slate-900 text-sm">{new Date(Number((typeof h.at === "bigint" ? h.at : BigInt(h.at)) / 1_000_000n)).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </motion.div>

        {/* Approve Modal */}
        {showApproveModal &&
          createPortal(
            <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/60 backdrop-blur-sm">
              <div className="flex min-h-full items-start justify-center pt-8 pl-4 pr-4 pb-4">
                <div className="relative w-full max-w-[500px] mx-auto my-8 bg-white rounded-2xl border border-slate-200/70 shadow-[0_15px_60px_rgba(2,6,23,0.06)] ring-1 ring-slate-100">
                  {/* Close Button */}
                  <button className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50" onClick={() => setShowApproveModal(false)} aria-label="Close" disabled={isApproving}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Content */}
                  <div className="flex flex-col items-center p-6 gap-6 h-auto">
                    <div className="w-full text-center text-slate-900 text-lg font-semibold">Approve FUM Allowance</div>

                    {/* Icon and Message */}
                    <div className="flex flex-col items-center gap-4 w-full">
                      <div className="p-4 rounded-full bg-slate-50 border border-slate-200">
                        <RefreshCw className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="text-center">
                        <p className="text-slate-900 font-medium text-base mb-2">Approve FUM to the backend canister</p>
                        <p className="text-slate-600 text-sm">This will allow the API backend to spend up to the approved FUM amount on your behalf.</p>
                        <p className="text-slate-600 text-xs mt-2">
                          Spender canister: <code className="px-1 py-0.5 bg-slate-100 rounded text-slate-900">{backendIdResolved}</code>
                        </p>
                      </div>
                    </div>

                    {/* Amount input */}
                    <div className="w-full">
                      <label className="block text-xs text-slate-600 mb-1">Amount (FUM)</label>
                      <input type="text" inputMode="decimal" pattern="[0-9]*[.]?[0-9]*" value={amountInput} onChange={(e) => setAmountInput(normalizeAmountInput(e.target.value))} placeholder="e.g. 10.5" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6C8CDF] bg-white text-slate-900" />
                    </div>

                    {/* Warning box */}
                    <div className="w-full rounded-xl bg-yellow-50 border border-yellow-200 p-4">
                      <div className="text-yellow-800 font-medium text-sm mb-1">Notice</div>
                      <ul className="text-yellow-700 text-xs space-y-1">
                        <li>• Approving grants spending allowance to the backend canister</li>
                        <li>• You can re-approve a higher amount later if needed</li>
                        <li>• This does not transfer tokens immediately</li>
                      </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="w-full flex gap-3">
                      <LightButton variant="ghost" size="lg" fullWidth onClick={() => setShowApproveModal(false)} className="h-12 flex items-center justify-center" disabled={isApproving}>
                        Cancel
                      </LightButton>
                      <LightButton
                        variant="primary"
                        size="lg"
                        fullWidth
                        className="h-12 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                        leftIcon={<RefreshCw className={`w-4 h-4 ${isApproving ? "animate-spin" : ""}`} />}
                        disabled={isApproving}
                        onClick={async () => {
                          try {
                            setIsApproving(true);
                            const n = Number(amountInput || 0);
                            if (!Number.isFinite(n) || n <= 0) {
                              toast.error("Enter a valid positive amount");
                              setIsApproving(false);
                              return;
                            }

                            const backendId = backendCanisterId || import.meta.env.VITE_CANISTER_ID_BACKEND || process.env.CANISTER_ID_BACKEND;
                            if (!backendId) {
                              toast.error("Backend canister ID not found");
                              setIsApproving(false);
                              return;
                            }

                            const amountE8s = BigInt(Math.floor(n * 10 ** 8));
                            const spender = { owner: Principal.fromText(backendId), subaccount: [] };

                            const loading = toast.loading("Approving allowance...");
                            const approveArgs = {
                              amount: amountE8s,
                              spender,
                              fee: [],
                              memo: [Array.from(new TextEncoder().encode("approve API credit"))],
                              from_subaccount: [],
                              created_at_time: [],
                              expected_allowance: [],
                              expires_at: [],
                            };
                            const res = await fradium_ledger.icrc2_approve(approveArgs);
                            if ("Err" in res) {
                              const errKey = Object.keys(res.Err)[0];
                              toast.error(`Approval failed: ${errKey}`, { id: loading });
                              setIsApproving(false);
                              return;
                            }

                            const txId = res.Ok?.toString?.() || `${Date.now()}`;
                            // Record approval on backend store so it appears in history immediately
                            try {
                              await backendCan.record_api_approval(amountE8s, "API_CREDITS");
                              console.log("approval recorded");
                            } catch (_recErr) {
                              console.log("error recording approval", _recErr);
                              // non-fatal: continue updating local history even if backend record fails
                            }

                            const entry = {
                              txId,
                              amount: n,
                              time: new Date().toLocaleString(),
                              metadata: "API_CREDITS",
                            };
                            const updated = [entry, ...history];
                            setHistory(updated);
                            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                            toast.success("Approved successfully", { id: loading });
                            setAmountInput(0);
                            setShowApproveModal(false);
                            // Refresh stats and history from backend
                            fetchStats();
                            fetchHistory(0, 50);
                          } catch (e) {
                            toast.error(e?.message || "Approval failed");
                          } finally {
                            setIsApproving(false);
                          }
                        }}>
                        {isApproving ? "Approving..." : "Approve"}
                      </LightButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}
      </motion.div>
    </div>
  );
};

export default APICreditsPage;
