export interface Root {
  success: boolean
  message: string
  issues: Issue[]
}

export interface Issue {
  contract: string
  description: string
  function: string
  severity: string
  'swc-id': string
  'swc-url': string
  title: string
}

export interface AnalysisSummary {
  total_issues: number
  high: number
  medium: number
  low: number
  info: number
}

// Legacy interface for backward compatibility
export interface Report {
  summary: AnalysisSummary
  issues: Issue[]
  status: string
}
