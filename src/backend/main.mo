import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Map "mo:base/HashMap";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Nat32 "mo:base/Nat32";
import Nat8 "mo:base/Nat8";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Text "mo:base/Text";
import Bool "mo:base/Bool";
import Blob "mo:base/Blob";
import Nat64 "mo:base/Nat64";

import TokenCanister "canister:token";

actor Fradium {
  // Vote deadline in nanoseconds (1 week = 7 * 24 * 60 * 60 * 1_000_000_000)
  private let VOTE_DEADLINE_DURATION : Time.Time = 604_800_000_000_000;
  
  // Faucet claim cooldown in nanoseconds (48 hours = 48 * 60 * 60 * 1_000_000_000)
  private let FAUCET_COOLDOWN_DURATION : Time.Time = 172_800_000_000_000;

  public type Result<T, E> = { #Ok : T; #Err : E };

  public type Chain = {
      #Bitcoin;
      #Ethereum;
  };

  public type Voter = {
    voter: Principal;
    vote: Bool;
  };

  public type ReportRole = {
    #Reporter;
    #Voter: Bool; // true = vote yes, false = vote no
  };

  public type Report = {
    report_id: Nat;
    reporter: Principal;
    chain: Chain;
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
  // ===== END REPORT =====

  // ===== STAKE =====
  public type StakeRecord = {
    staker: Principal;
    amount: Nat;
    staked_at: Time.Time;
    role: ReportRole;
    report_id: ReportId;
  };
  // ===== END STAKE =====

  public type ReportId = Nat32;

  stable var reportsStorage : [(Principal, [Report])] = [];
  stable var faucetClaimsStorage : [(Principal, Time.Time)] = [];
  stable var stakeRecordsStorage : [(Principal, StakeRecord)] = [];

  var reportStore = Map.HashMap<Principal, [Report]>(0, Principal.equal, Principal.hash);
  var faucetClaimsStore = Map.HashMap<Principal, Time.Time>(0, Principal.equal, Principal.hash);
  var stakeRecordsStore = Map.HashMap<Principal, StakeRecord>(0, Principal.equal, Principal.hash);
  private stable var next_report_id : ReportId = 0;

  // ===== SYSTEM FUNCTIONS =====
  system func preupgrade() {
    // Save all data to stable storage
    reportsStorage := Iter.toArray(reportStore.entries());
    faucetClaimsStorage := Iter.toArray(faucetClaimsStore.entries());
    stakeRecordsStorage := Iter.toArray(stakeRecordsStore.entries());
  };

  system func postupgrade() {
    // Restore data from stable storage
    reportStore := Map.HashMap<Principal, [Report]>(reportsStorage.size(), Principal.equal, Principal.hash);
    for ((key, value) in reportsStorage.vals()) {
        reportStore.put(key, value);
    };

    faucetClaimsStore := Map.HashMap<Principal, Time.Time>(faucetClaimsStorage.size(), Principal.equal, Principal.hash);
    for ((key, value) in faucetClaimsStorage.vals()) {
        faucetClaimsStore.put(key, value);
    };

    stakeRecordsStore := Map.HashMap<Principal, StakeRecord>(stakeRecordsStorage.size(), Principal.equal, Principal.hash);
    for ((key, value) in stakeRecordsStorage.vals()) {
        stakeRecordsStore.put(key, value);
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

  // ===== FAUCET FUNCTIONS =====
  public shared({ caller }) func claim_faucet() : async Result<Text, Text> {
    if(Principal.isAnonymous(caller)) {
        return #Err("Anonymous users can't perform this action.");
    };

    // Check if user has claimed recently
    let currentTime = Time.now();
    switch (faucetClaimsStore.get(caller)) {
      case (?lastClaimTime) {
        let timeSinceLastClaim = currentTime - lastClaimTime;
        if (timeSinceLastClaim < FAUCET_COOLDOWN_DURATION) {
          return #Err("You can only claim faucet once every 48 hours. Please try again later.");
        };
      };
      case null { /* First time claiming, proceed */ };
    };

    let transferArgs = {
      from_subaccount = null;
      to = { owner = caller; subaccount = null };
      amount = 10 * (10 ** Nat8.toNat(await TokenCanister.get_decimals()));
      fee = null;
      memo = ?Text.encodeUtf8("Faucet Claim");
      created_at_time = null;
    };

    let transferResult = await TokenCanister.icrc1_transfer(transferArgs);
    switch (transferResult) {
        case (#Err(err)) {
            return #Err("Failed to transfer tokens: " # debug_show(err));
        };
        case (#Ok(_)) {
            // Record the claim time
            faucetClaimsStore.put(caller, currentTime);
            return #Ok("Tokens transferred successfully");
        };
    };
  };

  public shared({ caller }) func check_faucet_claim() : async Result<Text, Text> {
    if(Principal.isAnonymous(caller)) {
        return #Err("Anonymous users can't perform this action.");
    };

    switch (faucetClaimsStore.get(caller)) {
      case (?lastClaimTime) {
        let currentTime = Time.now();
        let timeSinceLastClaim = currentTime - lastClaimTime;
        let canClaim = timeSinceLastClaim >= FAUCET_COOLDOWN_DURATION;
        
        if (canClaim) {
          return #Ok("You can claim faucet now");
        } else {
          let remainingTime = FAUCET_COOLDOWN_DURATION - timeSinceLastClaim;
          let remainingHours = remainingTime / 3_600_000_000_000; // Convert to hours
          let remainingMinutes = (remainingTime % 3_600_000_000_000) / 60_000_000_000; // Convert to minutes
          
          if (remainingHours > 0 and remainingMinutes > 0) {
            return #Err("You can't claim faucet yet. Remaining time: " # Nat.toText(Int.abs(remainingHours)) # " hours " # Nat.toText(Int.abs(remainingMinutes)) # " minutes");
          } else if (remainingHours > 0) {
            return #Err("You can't claim faucet yet. Remaining time: " # Nat.toText(Int.abs(remainingHours)) # " hours");
          } else {
            return #Err("You can't claim faucet yet. Remaining time: " # Nat.toText(Int.abs(remainingMinutes)) # " minutes");
          };
        };
      };
      case null {
        return #Ok("You can claim faucet now");
      };
    };
  };

  // ===== COMMUNITY REPORT & STAKE FUNCTIONS =====
  public type CreateReportParams = {
    chain : Chain;
    address : Text;
    category : Text;
    description : Text;
    url : ?Text;
    evidence : [Text];
    stake_amount : Nat;
  };
  public shared({ caller }) func create_report(params : CreateReportParams) : async Result<Text, Text> {
    if(Principal.isAnonymous(caller)) {
        return #Err("Anonymous users can't perform this action.");
    };

    // Check if address already exists in any report
    for ((principal, reports) in reportStore.entries()) {
      for (report in reports.vals()) {
        if (report.address == params.address and report.chain == params.chain) {
          return #Err("Address " # params.address # " has already been reported. Please check existing reports.");
        };
      };
    };

    let minimum_stake_amount = 5 * (10 ** Nat8.toNat(await TokenCanister.get_decimals()));

    if (params.stake_amount < minimum_stake_amount) {
      return #Err("Minimum stake is 5 FUM tokens");
    };

    let transferArgs = {
        spender_subaccount = null;
        from = {
            owner = caller; 
            subaccount = null;
        };
        to = {
            owner = Principal.fromActor(Fradium); 
            subaccount = null;
        };
        amount = params.stake_amount;
        fee = null;
        memo = ?Blob.toArray(Text.encodeUtf8("Report Stake"));
        created_at_time = ?Nat64.fromNat(Int.abs(Time.now()));
    };

    let transferResult = await TokenCanister.icrc2_transfer_from(transferArgs);
    switch (transferResult) {
        case (#Err(err)) {
            return #Err("Failed to transfer tokens: " # debug_show(err));
        };
        case (#Ok(_)) { };  
    };

    let new_report_id = next_report_id;
    next_report_id += 1;

    // Record the stake
    let stakeRecord : StakeRecord = {
      staker = caller;
      amount = params.stake_amount;
      staked_at = Time.now();
      role = #Reporter;
      report_id = new_report_id;
    };
    stakeRecordsStore.put(caller, stakeRecord);

    let new_report : Report = {
      report_id = Nat32.toNat(new_report_id);
      reporter = caller;
      chain = params.chain;
      address = params.address;
      category = params.category;
      description = params.description;
      evidence = params.evidence;
      url = params.url;
      votes_yes = 0;
      votes_no = 0;
      voted_by = [];
      vote_deadline = Time.now() + VOTE_DEADLINE_DURATION;
      created_at = Time.now();
    };
    
    let existing_reports = switch (reportStore.get(caller)) {
      case (?reports) { reports };
      case null { [] };
    };
    
    let updated_reports = Array.append(existing_reports, [new_report]);
    reportStore.put(caller, updated_reports);
    
    return #Ok("Report created successfully with ID: " # Nat32.toText(new_report_id));
  };
}
