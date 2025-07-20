import type { Root as AnalysisReport } from "../model/AnalyzeSmartContractModel";

// Contoh data untuk testing sesuai dengan format JSON yang Anda berikan
export const mockAnalysisSuccess: AnalysisReport = {
  "success": true,
  "message": "Analysis complete",
  "issues": [
    {
      "contract": "0x8176D8872447775FE76ac65A961E538C9bF9940d",
      "description": "The arithmetic operator can underflow.\nIt is possible to cause an integer overflow or underflow in the arithmetic operation. ",
      "function": "name()",
      "severity": "High",
      "swc-id": "101",
      "swc-url": "https://swcregistry.io/docs/SWC-101",
      "title": "Integer Arithmetic Bugs"
    },
    {
      "contract": "0x8176D8872447775FE76ac65A961E538C9bF9940d",
      "description": "The arithmetic operator can underflow.\nIt is possible to cause an integer overflow or underflow in the arithmetic operation. ",
      "function": "link_classic_internal(uint64,int64) or symbol()",
      "severity": "High",
      "swc-id": "101",
      "swc-url": "https://swcregistry.io/docs/SWC-101",
      "title": "Integer Arithmetic Bugs"
    },
    {
      "contract": "0x8176D8872447775FE76ac65A961E538C9bF9940d",
      "description": "A potential vulnerability in access control mechanism.",
      "function": "approve()",
      "severity": "Medium",
      "swc-id": "115",
      "swc-url": "https://swcregistry.io/docs/SWC-115",
      "title": "Authorization through tx.origin"
    },
    {
      "contract": "0x8176D8872447775FE76ac65A961E538C9bF9940d",
      "description": "Missing input validation for user parameters.",
      "function": "transfer()",
      "severity": "Low",
      "swc-id": "103",
      "swc-url": "https://swcregistry.io/docs/SWC-103",
      "title": "Insufficient Input Validation"
    }
  ]
};

export const mockAnalysisSafe: AnalysisReport = {
  "success": true,
  "message": "Analysis complete",
  "issues": []
};

export const mockAnalysisError: AnalysisReport = {
  "success": false,
  "message": "Failed to analyze contract: Invalid address format",
  "issues": []
};

// Fungsi utility untuk testing
export const generateMockAnalysis = (hasIssues: boolean = true): AnalysisReport => {
  return hasIssues ? mockAnalysisSuccess : mockAnalysisSafe;
};
