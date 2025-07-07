import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Map "mo:base/HashMap";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Nat32 "mo:base/Nat32";

actor Fradium {
  // Vote deadline in nanoseconds (1 week = 7 * 24 * 60 * 60 * 1_000_000_000)
  private let VOTE_DEADLINE_DURATION : Time.Time = 604_800_000_000_000;

  public type Result<T, E> = { #Ok : T; #Err : E };

  // ===== REPORT =====
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
  // ===== END REPORT =====

  // ===== USER =====
  public type User = {
    name: Text;
    profile_picture: ?Text;
    created_at: Time.Time;
  };
  // ===== END USER =====

  public type ReportId = Nat32;
  public type UserId = Nat32;

  stable var reportsStorage : [(Principal, [Report])] = [];
  stable var usersStorage : [(Principal, User)] = [];

  var reportStore = Map.HashMap<Principal, [Report]>(0, Principal.equal, Principal.hash);
  var userStore = Map.HashMap<Principal, User>(0, Principal.equal, Principal.hash);

  private stable var next_user_id : UserId = 0;
  private stable var next_report_id : ReportId = 0;

  // ===== SYSTEM FUNCTIONS =====
  system func preupgrade() {
    // Save all data to stable storage
    reportsStorage := Iter.toArray(reportStore.entries());
    usersStorage := Iter.toArray(userStore.entries());
  };

  system func postupgrade() {
    // Restore data from stable storage
    reportStore := Map.HashMap<Principal, [Report]>(reportsStorage.size(), Principal.equal, Principal.hash);
    for ((key, value) in reportsStorage.vals()) {
        reportStore.put(key, value);
    };

    userStore := Map.HashMap<Principal, User>(usersStorage.size(), Principal.equal, Principal.hash);
    for ((key, value) in usersStorage.vals()) {
        userStore.put(key, value);
    };
  };

  public shared({ caller }) func get_profile() : async Result<User, Text> {
    if(Principal.isAnonymous(caller)) {
        return #Err("Anonymous users can't perform this action.");
    };
    
    switch (userStore.get(caller)) {
      case (?user) { return #Ok(user); };
      case null { return #Err("User profile not found. Please create a profile first."); };
    };
  };

  type CreateProfileParams = {
    name : Text;
    profile_picture : ?Text;
  };

  public shared({ caller }) func create_profile(params : CreateProfileParams) : async Result<User, Text> {
    if(Principal.isAnonymous(caller)) {
        return #Err("Anonymous users can't perform this action.");
    };
    
    switch (userStore.get(caller)) {
      case (?_) { 
        return #Err("Profile already exists. Use update_profile to modify existing profile."); 
      };
      case null {
        let new_user : User = {
          name = params.name;
          profile_picture = params.profile_picture;
          created_at = Time.now();
        };
        
        userStore.put(caller, new_user);
        return #Ok(new_user);
      };
    };
  };

  public shared({ caller }) func update_profile(name : ?Text, profile_picture : ?Text) : async Result<User, Text> {
    if(Principal.isAnonymous(caller)) {
        return #Err("Anonymous users can't perform this action.");
    };
    
    switch (userStore.get(caller)) {
      case (?existing_user) {
        let updated_user : User = {
          name = switch (name) {
            case (?new_name) { new_name };
            case null { existing_user.name };
          };
          profile_picture = switch (profile_picture) {
            case (?new_picture) { ?new_picture };
            case null { existing_user.profile_picture };
          };
          created_at = existing_user.created_at;
        };
        
        userStore.put(caller, updated_user);
        return #Ok(updated_user);
      };
      case null { 
        return #Err("Profile not found. Please create a profile first."); 
      };
    };
  };

  public query func get_reports() : async Result<[Report], Text> {
    return #Ok(Array.flatten(Iter.toArray(reportStore.vals())));
  };

  public query func get_report(report_id : ReportId) : async Result<Report, Text> {
    for ((principal, reports) in reportStore.entries()) {
      for (report in reports.vals()) {
        if (report.report_id == Nat32.toNat(report_id)) {
          return #Ok(report);
        };
      };
    };
    return #Err("Report not found");
  };

  public shared({ caller }) func create_report(report : Report) : async Result<ReportId, Text> {
    if(Principal.isAnonymous(caller)) {
        return #Err("Anonymous users can't perform this action.");
    };

    let new_report_id = next_report_id;
    next_report_id += 1;
    
    let new_report = {
      report_id = Nat32.toNat(new_report_id);
      reporter = report.reporter;
      chain = report.chain;
      address = report.address;
      category = report.category;
      description = report.description;
      evidence = report.evidence;
      url = report.url;
      status = #Pending;
      votes_yes = 0;
      votes_no = 0;
      voted_by = [];
      vote_deadline = Time.now() + VOTE_DEADLINE_DURATION;
      created_at = Time.now();
    };
    
    let existing_reports = switch (reportStore.get(report.reporter)) {
      case (?reports) { reports };
      case null { [] };
    };
    
    let updated_reports = Array.append(existing_reports, [new_report]);
    reportStore.put(report.reporter, updated_reports);
    
    return #Ok(new_report_id);
  };

  public shared({ caller }) func delete_report(report_id : ReportId) : async Result<Text, Text> {
    if(Principal.isAnonymous(caller)) {
        return #Err("Anonymous users can't perform this action.");
    };
    
    for ((principal, reports) in reportStore.entries()) {
      let filtered_reports = Array.filter(reports, func (report : Report) : Bool {
        report.report_id != Nat32.toNat(report_id)
      });
      
      if (filtered_reports.size() != reports.size()) {
        let target_report = Array.find(reports, func (report : Report) : Bool {
          report.report_id == Nat32.toNat(report_id)
        });
        
        switch (target_report) {
          case (?report) {
            if (report.reporter == caller) {
              if (filtered_reports.size() == 0) {
                reportStore.delete(principal);
              } else {
                reportStore.put(principal, filtered_reports);
              };
              return #Ok("Report deleted successfully");
            } else {
              return #Err("Only report owner can delete this report");
            };
          };
          case null { return #Err("Report not found"); };
        };
      };    
    };
    
    return #Err("Report not found");
  };
}
