import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Nat32 "mo:base/Nat32";

module {
  public type Result<T, E> = { #Ok : T; #Err : E };

  // ===== REPORT TYPES =====
  public type ReportId = Nat32;

  public type Voter = {
    voter: Principal;
    vote: Bool;
    vote_weight: Nat;
  };

  public type ReportRole = {
    #Reporter;
    #Voter: Bool;
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
  public type GetMyReportsParams = Report and {
    stake_amount : Nat;
    reward : Nat;
    unstaked_at : ?Time.Time;
  };

  public type GetMyVotesParams = Report and {
    stake_amount : Nat;
    reward : Nat;
    vote_type : Bool;
    unstaked_at : ?Time.Time;
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
    vote_type : Bool;
    report_id : ReportId;
  };
};