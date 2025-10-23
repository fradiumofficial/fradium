import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Nat32 "mo:base/Nat32";

module {
  public type Result<T, E> = { #Ok : T; #Err : E };

  // ===== REPORT TYPES =====
  public type ReportId = Nat32;

  // Report status type
  public type ReportStatus = {
    #Voting;           // Still within voting period
    #NotValidated;     // Voting ended but didn't meet minimum quorum (< 3 voters)
    #Safe;             // Voting ended, quorum met, majority voted safe
    #Unsafe;           // Voting ended, quorum met, majority voted unsafe
  };

  // Vote type
  public type VoteType = {
    #Unsafe;           // Vote that address is unsafe
    #Safe;             // Vote that address is safe
  };

  public type Voter = {
    voter: Principal;
    vote: VoteType;
    vote_weight: Nat;
  };

  public type ReportRole = {
    #Reporter;
    #Voter: VoteType;
  };

  public type Report = {
    report_id: ReportId;
    reporter: Principal;
    chain: Text;
    address: Text;
    category: Text;
    description: Text;
    evidence: [Text];
    url: ?Text;
    votes_yes: Nat;
    votes_no: Nat;
    voted_by: [Voter];
    vote_deadline: Time.Time;
    created_at: Time.Time;
  };

  public type StakeRecord = {
    staker: Principal;
    amount: Nat;
    staked_at: Time.Time;
    role: ReportRole;
    report_id: ReportId;
    unstaked_at: ?Time.Time;
  };

  // ===== REPORT PARAMS =====
  // Response type for reports with status
  public type ReportWithStatus = Report and {
    status : ReportStatus;
  };

  // Response type for get_reports with pagination
  public type GetReportsResponse = {
    reports : [ReportWithStatus];
    total : Nat;
    offset : Nat;
    limit : Nat;
  };

  public type GetMyReportsParams = Report and {
    stake_amount : Nat;
    reward : Nat;
    unstaked_at : ?Time.Time;
    status : ReportStatus;
  };

  public type GetMyVotesParams = Report and {
    stake_amount : Nat;
    reward : Nat;
    vote_type : VoteType;
    unstaked_at : ?Time.Time;
    status : ReportStatus;
  };

  public type CreateReportParams = {
    chain : Text;
    address : Text;
    category : Text;
    description : Text;
    url : ?Text;
    evidence : [Text];
    stake_amount : Nat;
  };

  public type VoteReportParams = {
    stake_amount : Nat;
    vote_type : VoteType;
    report_id : ReportId;
  };
};