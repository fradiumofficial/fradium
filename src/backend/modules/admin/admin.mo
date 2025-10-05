import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Map "mo:base/HashMap";
import Array "mo:base/Array";

import ParentTypes "../../types";
import CommunityTypes "../community/types";

module {
  public class AdminModule() {
    
    public func admin_change_report_deadline(
      report_id : CommunityTypes.ReportId, 
      new_deadline : Time.Time,
      reportStore : Map.HashMap<Principal, [CommunityTypes.Report]>
    ) : ParentTypes.Result<Text, Text> {
      var targetReport : ?CommunityTypes.Report = null;
      var reportOwner : ?Principal = null;
      
      for ((principal, reports) in reportStore.entries()) {
        for (report in reports.vals()) {
          if (report.report_id == report_id) {
            targetReport := ?report;
            reportOwner := ?principal;
          };
        };
      };

      switch (targetReport) {
        case null {
          return #Err("Report not found");
        };
        case (?report) {
          let updatedReport : CommunityTypes.Report = {
            report_id = report.report_id;
            reporter = report.reporter;
            chain = report.chain;
            address = report.address;
            category = report.category;
            description = report.description;
            evidence = report.evidence;
            url = report.url;
            votes_yes = report.votes_yes;
            votes_no = report.votes_no;
            voted_by = report.voted_by;
            vote_deadline = new_deadline;
            created_at = report.created_at;
          };

          switch (reportOwner) {
            case (?owner) {
              let existingReports = switch (reportStore.get(owner)) {
                case (?reports) { reports };
                case null { [] };
              };

              let updatedReports = Array.map(existingReports, func (r : CommunityTypes.Report) : CommunityTypes.Report {
                if (r.report_id == report.report_id) {
                  updatedReport
                } else {
                  r
                }
              });

              reportStore.put(owner, updatedReports);
              return #Ok("Report deadline updated successfully");
            };
            case null {
              return #Err("Report owner not found");
            };
          };
        };
      };
    };

    public func admin_delete_report(
      report_id : CommunityTypes.ReportId,
      reportStore : Map.HashMap<Principal, [CommunityTypes.Report]>,
      stakeRecordsStore : Map.HashMap<Principal, CommunityTypes.StakeRecord>
    ) : ParentTypes.Result<Text, Text> {
      var targetReport : ?CommunityTypes.Report = null;
      var reportOwner : ?Principal = null;
      
      for ((principal, reports) in reportStore.entries()) {
        for (report in reports.vals()) {
          if (report.report_id == report_id) {
            targetReport := ?report;
            reportOwner := ?principal;
          };
        };
      };

      switch (targetReport) {
        case null {
          return #Err("Report not found");
        };
        case (?report) {
          switch (reportOwner) {
            case (?owner) {
              let existingReports = switch (reportStore.get(owner)) {
                case (?reports) { reports };
                case null { [] };
              };

              let filteredReports = Array.filter(existingReports, func (r : CommunityTypes.Report) : Bool {
                r.report_id != report.report_id
              });

              if (filteredReports.size() == 0) {
                reportStore.delete(owner);
              } else {
                reportStore.put(owner, filteredReports);
              };

              var stakeRecordsToDelete : [Principal] = [];
              
              for ((staker, stakeRecord) in stakeRecordsStore.entries()) {
                if (stakeRecord.report_id == report_id) {
                  stakeRecordsToDelete := Array.append(stakeRecordsToDelete, [staker]);
                };
              };

              for (staker in stakeRecordsToDelete.vals()) {
                stakeRecordsStore.delete(staker);
              };

              return #Ok("Report and associated stake records deleted successfully");
            };
            case null {
              return #Err("Report owner not found");
            };
          };
        };
      };
    };
  };
};
