import { CheckCircle, Clock, XCircle } from "lucide-react";

export function SubmissionStatus({ submission }) {
  const getStatusDisplay = () => {
    switch (JSON.stringify(submission.status)) {
      case `{"approved":null}`:
        return {
          icon: <CheckCircle className="h-5 w-5 text-emerald-500" />,
          text: "Approved",
          description: "Your submission has been approved and rewards will be distributed.",
          bgColor: "bg-emerald-500/10",
          borderColor: "border-emerald-500/20",
          textColor: "text-emerald-500",
        };
      case `{"rejected":null}`:
        return {
          icon: <XCircle className="h-5 w-5 text-red-500" />,
          text: "Rejected",
          description: "Your submission was not approved. Please review the feedback and resubmit if needed.",
          bgColor: "bg-red-500/10",
          borderColor: "border-red-500/20",
          textColor: "text-red-500",
        };
      case `{"pending":null}`:
      default:
        return {
          icon: <Clock className="h-5 w-5 text-amber-500" />,
          text: "Pending Review",
          description: "Your submission is being reviewed by the project administrators.",
          bgColor: "bg-amber-500/10",
          borderColor: "border-amber-500/20",
          textColor: "text-amber-500",
        };
    }
  };

  const status = getStatusDisplay();

  return (
    <div className={`p-4 rounded-lg ${status.bgColor} border ${status.borderColor}`}>
      <div className="flex items-center gap-3">
        {status.icon}
        <div>
          <h3 className={`font-medium ${status.textColor}`}>{status.text}</h3>
          <p className="text-sm text-muted-foreground">{status.description}</p>
        </div>
      </div>
    </div>
  );
}
