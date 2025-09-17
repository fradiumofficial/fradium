// src/mock_token/main.mo (Fixed Version)
import Principal "mo:base/Principal";
import Nat "mo:base/Nat";
import Nat8 "mo:base/Nat8";
import Map "mo:base/HashMap";
import Nat32 "mo:base/Nat32";
import Iter "mo:base/Iter";

persistent actor MockToken {
    // Using stable variables to persist across upgrades
    private var balanceEntries : [(Principal, Nat)] = [];
    private var allowanceEntries : [((Principal, Principal), Nat)] = [];
    
    // Transient HashMaps (rebuilt from stable storage)
    private transient var balances = Map.HashMap<Principal, Nat>(0, Principal.equal, Principal.hash);
    private transient var allowances = Map.HashMap<(Principal, Principal), Nat>(0, 
        func(a: (Principal, Principal), b: (Principal, Principal)) : Bool { 
            Principal.equal(a.0, b.0) and Principal.equal(a.1, b.1) 
        }, 
        func(a: (Principal, Principal)) : Nat32 { 
            Principal.hash(a.0) +% Principal.hash(a.1) 
        }
    );

    // System functions for stable storage
    system func preupgrade() {
        balanceEntries := balances.entries() |> Iter.toArray(_);
        allowanceEntries := allowances.entries() |> Iter.toArray(_);
    };

    system func postupgrade() {
        balances := Map.fromIter<Principal, Nat>(balanceEntries.vals(), balanceEntries.size(), Principal.equal, Principal.hash);
        allowances := Map.fromIter<(Principal, Principal), Nat>(allowanceEntries.vals(), allowanceEntries.size(), 
            func(a: (Principal, Principal), b: (Principal, Principal)) : Bool { 
                Principal.equal(a.0, b.0) and Principal.equal(a.1, b.1) 
            }, 
            func(a: (Principal, Principal)) : Nat32 { 
                Principal.hash(a.0) +% Principal.hash(a.1) 
            }
        );
        balanceEntries := [];
        allowanceEntries := [];
    };

    // Initialize with a large balance for the backend canister to use for the faucet
    public func init() : async () {
        let self = Principal.fromActor(MockToken);
        balances.put(self, 1_000_000_000_000);
    };

    // Public function to allow test users to mint tokens for themselves
    public shared({caller}) func mint(amount: Nat) : async () {
        let current_balance = switch (balances.get(caller)) {
            case (?bal) { bal };
            case null { 0 };
        };
        balances.put(caller, current_balance + amount);
    };

    // --- Mocked ICRC-1 Functions ---
    public query func icrc1_decimals() : async Nat8 { 8 };

    public query func icrc1_balance_of(account: {owner: Principal; subaccount: ?[Nat8]}): async Nat {
        switch (balances.get(account.owner)) {
            case (?bal) { bal };
            case null { 0 };
        }
    };

    public shared({caller}) func icrc1_transfer(args: { 
        to: {owner: Principal; subaccount: ?[Nat8]}; 
        amount: Nat; 
        from_subaccount: ?[Nat8]; 
        fee: ?Nat; 
        memo: ?Blob; 
        created_at_time: ?Nat 
    }) : async {#err: Nat; #ok: Nat} {
        let from_balance = switch (balances.get(caller)) {
            case (?bal) { bal };
            case null { 0 };
        };
        if (from_balance < args.amount) { return #err(0) };

        let to_balance = switch (balances.get(args.to.owner)) {
            case (?bal) { bal };
            case null { 0 };
        };

        balances.put(caller, from_balance - args.amount);
        balances.put(args.to.owner, to_balance + args.amount);
        return #ok(1);
    };

    // --- Mocked ICRC-2 Functions ---
    public shared({caller}) func icrc2_approve(args: { 
        spender: {owner: Principal; subaccount: ?[Nat8]}; 
        amount: Nat; 
        fee: ?Nat; 
        memo: ?Blob; 
        from_subaccount: ?[Nat8]; 
        created_at_time: ?Nat64 
    }): async {#err: Nat; #ok: Nat} {
        allowances.put((caller, args.spender.owner), args.amount);
        return #ok(1);
    };

    public shared func icrc2_transfer_from(args: { 
        spender_subaccount: ?[Nat8]; 
        from: {owner: Principal; subaccount: ?[Nat8]}; 
        to: {owner: Principal; subaccount: ?[Nat8]}; 
        amount: Nat; 
        fee: ?Nat; 
        memo: ?Blob; 
        created_at_time: ?Nat64 
    }): async {#err: Nat; #ok: Nat} {
        let from_balance = switch (balances.get(args.from.owner)) {
            case (?bal) { bal };
            case null { 0 };
        };
        if (from_balance < args.amount) { return #err(0) };

        let to_balance = switch (balances.get(args.to.owner)) {
            case (?bal) { bal };
            case null { 0 };
        };

        balances.put(args.from.owner, from_balance - args.amount);
        balances.put(args.to.owner, to_balance + args.amount);
        return #ok(1);
    };
}