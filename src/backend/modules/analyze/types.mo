import Time "mo:base/Time";
import CommunityTypes "../community/types";

module {
  public type Result<T, E> = { #Ok : T; #Err : E };

  // ===== ANALYZE TYPES =====
  public type AnalyzeHistoryType = {
    #CommunityVote;
    #AIAnalysis;
  };

  public type AnalyzeHistory = {
    address: Text;
    is_safe: Bool;
    analyzed_type: AnalyzeHistoryType;
    token_type: Text;
    created_at: Time.Time;
    metadata: Text;
  };

  public type CreateAnalyzeHistoryParams = {
    address: Text;
    is_safe: Bool;
    analyzed_type: AnalyzeHistoryType;
    metadata: Text;
    token_type: Text;
  };

  public type GetAnalyzeAddressResult = {
    is_safe: Bool;
    report: ?CommunityTypes.ReportWithStatus;
  };
};