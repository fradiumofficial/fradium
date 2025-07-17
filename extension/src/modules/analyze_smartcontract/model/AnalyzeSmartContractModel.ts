export interface Root {
  report: Report
}

export interface Report {
  summary: Summary
  issues: Issue[]
  status: string
}

export interface Summary {
  total_issues: number
  high: number
  medium: number
  low: number
  info: number
}

export interface Issue {
  title: string
  description: string
  contract: string
  function: string
  severity: string
  swc_id: string
  lineno: number
  code: string
}
