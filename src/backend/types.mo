import Time "mo:base/Time";
import Principal "mo:base/Principal";

    

module {
    public type Result<T, E> = { #Ok : T; #Err : E };

    public type ReportStatus = {
        #Pending;
        #Accepted;
        #Rejected;
        #Expired;
    };

    public type Chain = {
        #Bitcoin;
        #Ethereum;
    };

    public type Voter = {
      voter: Principal;
      vote: Bool;
    };

    public type Report = {
      report_id: Nat;
      reporter: Principal;
      chain: Chain;
      address: Text;
      category: Text;
      description: Text;
      evidence: [Text];
      url: Text;
      status: ReportStatus;
      votes_yes: Nat;
      votes_no: Nat;
      voted_by: [Voter];
      vote_deadline: Time.Time;
      created_at: Time.Time;
    };
};