import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Blob "mo:base/Blob";
import Result "mo:base/Result";
import Option "mo:base/Option";
import Nat64 "mo:base/Nat64";

import Int "mo:base/Int";
import Buffer "mo:base/Buffer";
import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Nat "mo:base/Nat";
import Debug "mo:base/Debug";

actor Token {
    // Token Types
    stable var logo : Text = "";
    public type Timestamp = Nat64;
    public type Duration = Nat64;
    public type Subaccount = Blob;
    public type Account = { owner : Principal; subaccount : ?Subaccount };
    public type Tokens = Nat;
    public type Memo = Blob;
    public type TxIndex = Nat;
    public type TxLog = Buffer.Buffer<Transaction>;
    public type Value = { #Nat : Nat; #Int : Int; #Blob : Blob; #Text : Text };

    public type Operation = {
        #Approve : Approve;
        #Transfer : Transfer;
        #Burn : Transfer;
        #Mint : Transfer;
    };

    public type CommonFields = {
        memo : ?Memo;
        fee : ?Tokens;
        created_at_time : ?Timestamp;
    };

    public type Approve = CommonFields and {
        from : Account;
        spender : Account;
        amount : Nat;
        expires_at : ?Nat64;
    };

    public type TransferSource = {
        #Init;
        #Icrc1Transfer;
        #Icrc2TransferFrom;
    };

    public type Transfer = CommonFields and {
        spender : Account;
        source : TransferSource;
        to : Account;
        from : Account;
        amount : Tokens;
    };

    public type Transaction = {
        operation : Operation;
        fee : Tokens;
        timestamp : Timestamp;
    };

    public type TransferError = {
        #TooOld;
        #Duplicate : { duplicate_of : TxIndex };
        #CreatedInFuture : { ledger_time : Timestamp };
        #InsufficientFunds : { balance : Tokens };
        #BadFee : { expected_fee : Tokens };
        #TemporarilyUnavailable;
        #GenericError : { error_code : Nat; message : Text };
        #BadBurn : { min_burn_amount : Tokens };
    };

    public type Result<T, E> = { #Ok : T; #Err : E };

    // Add these types after the existing types
    type Allowance = {
        amount : Tokens;
        expires_at : ?Nat64;
    };

    type AllowanceRequest = {
        account : Account;
        spender : Principal;
    };

    type ApproveRequest = {
        from_subaccount : ?[Nat8];
        spender : Principal;
        amount : Tokens;
        expires_at : ?Nat64;
        fee : ?Nat;
        memo : ?[Nat8];
        created_at_time : ?Nat64;
    };

    type ApproveError = {
        #BadFee : { expected_fee : Nat };
        #InsufficientFunds : { balance : Nat };
        #ApproveError : Text;
        #Expired : { ledger_time : Nat64 };
        #TooOld;
        #CreatedInFuture : { ledger_time : Nat64 };
        #Duplicate : { duplicate_of : Nat };
        #TemporarilyUnavailable;
        #GenericError : { error_code : Nat; message : Text };
    };

    type ApproveResult = {
        #Ok : Nat;
        #Err : ApproveError;
    };

    type TransferFromRequest = {
        spender_subaccount : ?[Nat8];
        from : Account;
        to : Account;
        amount : Nat;
        fee : ?Nat;
        memo : ?[Nat8];
        created_at_time : ?Nat64;
    };

    type TransferFromError = {
        #BadFee : { expected_fee : Nat };
        #BadBurn : { min_burn_amount : Nat };
        #InsufficientFunds : { balance : Nat };
        #InsufficientAllowance : { allowance : Nat };
        #Expired : { ledger_time : Nat64 };
        #TooOld;
        #CreatedInFuture : { ledger_time : Nat64 };
        #Duplicate : { duplicate_of : Nat };
        #TemporarilyUnavailable;
        #GenericError : { error_code : Nat; message : Text };
    };

    type TransferFromResult = {
        #Ok : TxIndex;
        #Err : TransferFromError;
    };

    // ===== STATE VARIABLES =====
    // Admin
    stable var persistedLog : [Transaction] = [];

    // Transaction Log
    private var log : Buffer.Buffer<Transaction> = Buffer.Buffer<Transaction>(0);
    private stable var isInitialized : Bool = false;

    // Constants
    private let defaultSubaccount : Subaccount = Blob.fromArrayMut(Array.init(32, 0 : Nat8));
    private let maxMemoSize = 32;
    private let permittedDriftNanos : Duration = 60_000_000_000;
    private let transactionWindowNanos : Duration = 24 * 60 * 60 * 1_000_000_000;
    private let DEFAULT_FEE : Nat = 0;
    private let MAX_ALLOWED_TIME_DRIFT_NANOS : Nat64 = 60_000_000_000;

    // Token Configuration
    stable var tokenConfig : {
        initial_mints : [{
            account : { owner : Principal; subaccount : ?Blob };
            amount : Nat;
        }];
        minting_account : { owner : Principal; subaccount : ?Blob };
        token_name : Text;
        token_symbol : Text;
        decimals : Nat8;
        transfer_fee : Nat;
    } = {
        initial_mints = [];
        minting_account = { owner = Principal.fromActor(Token); subaccount = null };
        token_name = "";
        token_symbol = "";
        decimals = 0;
        transfer_fee = 0;
    };

    // Add these variables after the existing variables
    private stable var allowances : [(Account, Principal, Allowance)] = [];
    private var allowancesMap = HashMap.HashMap<(Account, Principal), Allowance>(
        0,
        func(a, b) { a == b },
        func((account, principal)) { 
            let accountHash = Principal.hash(account.owner);
            let principalHash = Principal.hash(principal);
            accountHash ^ principalHash
        }
    );

    // ===== SYSTEM FUNCTIONS =====
    system func preupgrade() {
        persistedLog := Buffer.toArray(log);
        let entries = allowancesMap.entries();
        let buffer = Buffer.Buffer<(Account, Principal, Allowance)>(0);
        for ((key, value) in entries) {
            let (account, principal) = key;
            buffer.add((account, principal, value));
        };
        allowances := Buffer.toArray(buffer);
    };

    system func postupgrade() {
        log := Buffer.Buffer<Transaction>(persistedLog.size());
        for (tx in Array.vals(persistedLog)) { log.add(tx); };
        
        let entries = allowances.vals();
        let map = HashMap.HashMap<(Account, Principal), Allowance>(
            0,
            func(a, b) { a == b },
            func((account, principal)) { 
                let accountHash = Principal.hash(account.owner);
                let principalHash = Principal.hash(principal);
                accountHash ^ principalHash
            }
        );
        
        for ((account, principal, allowance) in entries) {
            map.put((account, principal), allowance);
        };
        
        allowancesMap := map;
        allowances := [];
    };

    // ===== ICRC-1 STANDARD FUNCTIONS =====
    public shared ({ caller }) func icrc1_transfer({
        from_subaccount : ?Subaccount;
        to : Account;
        amount : Tokens;
        fee : ?Tokens;
        memo : ?Memo;
        created_at_time : ?Timestamp;
    }) : async Result<TxIndex, TransferError> {
        let from = { owner = caller; subaccount = from_subaccount };
        await apply_transfer({
            spender = from;
            source = #Icrc1Transfer;
            from = from;
            to = to;
            amount = amount;
            fee = fee;
            memo = memo;
            created_at_time = created_at_time;
        });
    };

    public query func icrc1_balance_of(account : Account) : async Tokens {
        balance(account, log);
    };

    public query func icrc1_name() : async Text { tokenConfig.token_name; };
    public query func icrc1_symbol() : async Text { tokenConfig.token_symbol; };
    public query func icrc1_decimals() : async Nat8 { tokenConfig.decimals; };
    public query func icrc1_fee() : async Tokens { tokenConfig.transfer_fee; };
    public query func icrc1_minting_account() : async Account { tokenConfig.minting_account; };
    public query func icrc1_total_supply() : async Tokens {
        balance(tokenConfig.minting_account, log);
    };
    public query func icrc1_supported_standards() : async [{ name : Text; url : Text }] {
        return [
            {
                name = "ICRC-1";
                url = "https://github.com/dfinity/ICRC-1/tree/main/standards/ICRC-1";
            },
            {
                name = "ICRC-2";
                url = "https://github.com/dfinity/ICRC-1/tree/main/standards/ICRC-2";
            }
        ];
    };

    // ===== HELPERS FUNCTIONS =====
    private func accounts_equal(lhs : Account, rhs : Account) : Bool {
        let lhsSubaccount = Option.get(lhs.subaccount, defaultSubaccount);
        let rhsSubaccount = Option.get(rhs.subaccount, defaultSubaccount);
        Principal.equal(lhs.owner, rhs.owner) and Blob.equal(lhsSubaccount, rhsSubaccount);
    };

    private func balance(account : Account, log : TxLog) : Nat {
        var sum = 0;
        for (tx in log.vals()) {
            switch (tx.operation) {
                case (#Burn(args)) { if (accounts_equal(args.from, account)) { sum -= args.amount }; };
                case (#Mint(args)) { if (accounts_equal(args.to, account)) { sum += args.amount }; };
                case (#Transfer(args)) {
                    if (accounts_equal(args.from, account)) { sum -= args.amount + tx.fee; };
                    if (accounts_equal(args.to, account)) { sum += args.amount };
                };
                case (#Approve(args)) { if (accounts_equal(args.from, account)) { sum -= tx.fee }; };
            };
        };
        sum;
    };

    private func validate_subaccount(s : ?Subaccount) {
        let subaccount = Option.get(s, defaultSubaccount);
        assert (subaccount.size() == 32);
    };

    private func validate_memo(m : ?Memo) {
        switch (m) { 
            case (null) {}; 
            case (?memo) { 
                assert (memo.size() <= maxMemoSize) 
            }; 
        };
    };

    private func check_tx_time(created_at_time : ?Timestamp, now : Timestamp) : Result<(), TransferError> {
        let txTime : Timestamp = Option.get(created_at_time, now);
        if ((txTime > now) and (txTime - now > permittedDriftNanos)) {
            return #Err(#CreatedInFuture { ledger_time = now });
        };

        if ((txTime < now) and (now - txTime > transactionWindowNanos + permittedDriftNanos)) {
            return #Err(#TooOld);
        };

        #Ok(());
    };

    private func make_genesis_chain() : TxLog {
        validate_subaccount(tokenConfig.minting_account.subaccount);
        let now = Nat64.fromNat(Int.abs(Time.now()));
        let log = Buffer.Buffer<Transaction>(100);

        for ({ account; amount } in Array.vals(tokenConfig.initial_mints)) {
            validate_subaccount(account.subaccount);
            let tx : Transaction = {
                operation = #Mint({
                    spender = tokenConfig.minting_account;
                    source = #Init;
                    from = tokenConfig.minting_account;
                    to = account;
                    amount = amount;
                    fee = null;
                    memo = null;
                    created_at_time = ?now;
                });
                fee = 0;
                timestamp = now;
            };
            log.add(tx);
        };
        log;
    };

    private func classify_transfer(log : TxLog, transfer : Transfer) : Result<(Operation, Tokens), TransferError> {
        let minter = tokenConfig.minting_account;

        if (Option.isSome(transfer.created_at_time)) {
            switch (find_transfer(transfer, log)) {
                case (?txid) { return #Err(#Duplicate { duplicate_of = txid }) };
                case null {};
            };
        };

        let result = if (accounts_equal(transfer.from, minter) and transfer.source == #Init) {
            if (Option.get(transfer.fee, 0) != 0) { return #Err(#BadFee { expected_fee = 0 }); };
            (#Mint(transfer), 0);
        } else if (accounts_equal(transfer.to, minter) and transfer.source != #Icrc1Transfer) {
            if (Option.get(transfer.fee, 0) != 0) { return #Err(#BadFee { expected_fee = 0 }); };
            if (transfer.amount < tokenConfig.transfer_fee) { return #Err(#BadBurn { min_burn_amount = tokenConfig.transfer_fee }); };
            let debitBalance = balance(transfer.from, log);
            if (debitBalance < transfer.amount) { return #Err(#InsufficientFunds { balance = debitBalance }); };
            (#Burn(transfer), 0);
        } else {
            let effectiveFee = tokenConfig.transfer_fee;
            if (Option.get(transfer.fee, effectiveFee) != effectiveFee) { return #Err(#BadFee { expected_fee = tokenConfig.transfer_fee }); };
            let debitBalance = balance(transfer.from, log);
            if (debitBalance < transfer.amount + effectiveFee) { return #Err(#InsufficientFunds { balance = debitBalance }); };
            (#Transfer(transfer), effectiveFee);
        };

        #Ok(result);
    };

    private func find_transfer(transfer : Transfer, log : TxLog) : ?TxIndex {
        var i = 0;
        for (tx in log.vals()) {
            switch (tx.operation) {
                case (#Burn(args)) { if (args == transfer) { return ?i }; };
                case (#Mint(args)) { if (args == transfer) { return ?i }; };
                case (#Transfer(args)) { if (args == transfer) { return ?i }; };
                case (_) {};
            };
            i += 1;
        };
        null;
    };

    private func record_transaction(tx : Transaction) : TxIndex {
        let idx = log.size();
        log.add(tx);
        persistedLog := Buffer.toArray(log);
        idx;
    };

    private func apply_transfer(args : Transfer) : async Result<TxIndex, TransferError> {
        validate_subaccount(args.from.subaccount);
        validate_subaccount(args.to.subaccount);
        validate_memo(args.memo);
        let now = Nat64.fromNat(Int.abs(Time.now()));
        switch (check_tx_time(args.created_at_time, now)) {
            case (#Ok(_)) {};
            case (#Err(e)) { 
                return #Err(e); 
            };
        };

        switch (classify_transfer(log, args)) {
            case (#Ok((operation, effectiveFee))) {
                #Ok(record_transaction({ 
                    operation; 
                    fee = effectiveFee; 
                    timestamp = now 
                }));
            };
            case (#Err(e)) { 
                #Err(e); 
            };
        };
    };

    // ===== PUBLIC FUNCTIONS =====
    public func get_all_transactions() : async [Transaction] {
        Buffer.toArray(log);
    };  

    public func get_decimals() : async Nat8 {
        tokenConfig.decimals;
    };

    public func initialize_token({
        tokenName : Text;
        tokenSymbol : Text;
        initialSupply : Nat;
        tokenLogo : Text;
        principal : Principal;
    }) : async Result<Text, Text> {
        if (isInitialized) {
            return #Err("Token already created");
        };

        if (Principal.isAnonymous(principal)) {
            return #Err("Cannot create token with anonymous principal");
        };

        tokenConfig := {
            initial_mints = [{
                account = { owner = principal; subaccount = null };
                amount = initialSupply;
            }];
            minting_account = { owner = principal; subaccount = null };
            token_name = tokenName;
            token_symbol = tokenSymbol;
            decimals = 8;   
            transfer_fee = 0;
        };

        logo := tokenLogo;
        log := make_genesis_chain();

        isInitialized := true;

        #Ok("Token created");
    };

    public func transaction_history_of(account: Account) : async [Transaction] {
        let filteredTransactions = Buffer.Buffer<Transaction>(0);
        
        for (tx in log.vals()) {
            // Check if caller is involved in any transaction type
            let isInvolved = switch (tx.operation) {
                case (#Transfer { from; to; amount; }) {
                    from == account or to == account
                };
                case (#Mint { to; amount }) {
                    to == account
                };
                case (#Burn { from; amount }) {
                    from == account
                };
                case (#Approve { from; amount; }) {
                    from == account
                };
                // Add any other transaction types here
                case (_) { false };
            };

            if (isInvolved) {
                filteredTransactions.add(tx);
            };
        };
        
        Buffer.toArray(filteredTransactions);
    };

    public query func get_genesis_transaction() : async ?Transaction {
        if (log.size() > 0) {
            return ?log.get(0);
        };
        return null;
    };

    private func validate_approve_request(req : ApproveRequest) : ApproveResult {
        let fee = Option.get(req.fee, DEFAULT_FEE);
        if (fee != DEFAULT_FEE) {
            return #Err(#BadFee { expected_fee = DEFAULT_FEE });
        };

        // Add amount validation to prevent overflow
        if (req.amount == 0) {
            return #Err(#ApproveError("Amount must be greater than 0"));
        };

        let now = Nat64.fromNat(Int.abs(Time.now()));
        switch (req.created_at_time) {
            case (?created_at_time) {
                if (created_at_time > now + MAX_ALLOWED_TIME_DRIFT_NANOS) {
                    return #Err(#CreatedInFuture { ledger_time = now });
                };
                if (created_at_time < now - MAX_ALLOWED_TIME_DRIFT_NANOS) {
                    return #Err(#TooOld);
                };
            };
            case (null) {};
        };

        #Ok(0)
    };

    private func validate_transfer_from_request(req : TransferFromRequest, caller : Principal) : TransferFromResult {
        let fee = Option.get(req.fee, DEFAULT_FEE);
        if (fee != DEFAULT_FEE) {
            return #Err(#BadFee { expected_fee = DEFAULT_FEE });
        };

        let now = Nat64.fromIntWrap(Time.now());
        switch (req.created_at_time) {
            case (?created_at_time) {
                if (created_at_time > now + MAX_ALLOWED_TIME_DRIFT_NANOS) {
                    return #Err(#CreatedInFuture { ledger_time = now });
                };
                if (created_at_time < now - MAX_ALLOWED_TIME_DRIFT_NANOS) {
                    return #Err(#TooOld);
                };
            };
            case (null) {};
        };

        let fromAccount = req.from;

        let allowanceKey = (fromAccount, caller);
        let allowance = switch (allowancesMap.get(allowanceKey)) {
            case (?allowance) {
                switch (allowance.expires_at) {
                    case (?expires_at) {
                        if (expires_at < now) {
                            return #Err(#Expired { ledger_time = now });
                        };
                    };
                    case (null) {};
                };
                allowance;
            };
            case (null) {
                return #Err(#InsufficientAllowance { allowance = 0 });
            };
        };

        if (allowance.amount < req.amount) {
            return #Err(#InsufficientAllowance { allowance = allowance.amount });
        };

        #Ok(0)
    };

    public shared({ caller }) func icrc2_approve(request : ApproveRequest) : async ApproveResult {
        let from : Account = {
            owner = caller;
            subaccount = switch (request.from_subaccount) {
                case (?subaccount) ?Blob.fromArray(subaccount);
                case (null) null;
            };
        };

        // Validate request
        switch (validate_approve_request(request)) {
            case (#Err(err)) return #Err(err);
            case (#Ok(_)) {};
        };

        // Check if user has enough balance
        let balance = await icrc1_balance_of(from);
        if (balance < request.amount) {
            return #Err(#InsufficientFunds { balance });
        };

        // Create allowance record
        let allowance : Allowance = {
            amount = request.amount;
            expires_at = request.expires_at;
        };

        // Store allowance
        let key = (from, request.spender);
        allowancesMap.put(key, allowance);

        // Record transaction
        let now = Nat64.fromNat(Int.abs(Time.now()));
        let tx : Transaction = {
            operation = #Approve({
                from = from;
                spender = { owner = request.spender; subaccount = null };
                amount = request.amount;
                expires_at = request.expires_at;
                fee = ?DEFAULT_FEE;
                memo = switch (request.memo) {
                    case (?memo) ?Blob.fromArray(memo);
                    case (null) null;
                };
                created_at_time = request.created_at_time;
            });
            fee = DEFAULT_FEE;
            timestamp = now;
        };
        log.add(tx);

        #Ok(request.amount);
    };

    public shared({ caller }) func icrc2_transfer_from(request : TransferFromRequest) : async TransferFromResult {
        switch (validate_transfer_from_request(request, caller)) {
            case (#Err(err)) return #Err(err);
            case (#Ok(_)) {};
        };

        let fromAccount = request.from;
        let toAccount = request.to;
        let amount : Tokens = request.amount;
        let fee : Tokens = Option.get(request.fee, DEFAULT_FEE);

        let allowanceKey = (fromAccount, caller);
        let allowance = switch (allowancesMap.get(allowanceKey)) {
            case (?allowance) allowance;
            case (null) return #Err(#InsufficientAllowance { allowance = 0 });
        };

        if (allowance.amount < amount) {
            return #Err(#InsufficientAllowance { allowance = allowance.amount });
        };

        // Check spender's balance for fee
        let spenderAccount = { owner = caller; subaccount = switch (request.spender_subaccount) { case (?subaccount) ?Blob.fromArray(subaccount); case (null) null; } };
        let spenderBalance = await icrc1_balance_of(spenderAccount);
        if (spenderBalance < fee) {
            return #Err(#InsufficientFunds { balance = spenderBalance });
        };

        // Check from account's balance for amount
        let fromBalance = await icrc1_balance_of(fromAccount);

        Debug.print("From Balance: " # Nat.toText(fromBalance));
        Debug.print("From Principal: " # Principal.toText(fromAccount.owner));
        
        if (fromBalance < amount) {
            return #Err(#InsufficientFunds { balance = fromBalance });
        };

        let transferArgs : Transfer = {
            from = fromAccount;
            to = toAccount;
            amount = amount;
            fee = ?fee;
            memo = switch (request.memo) {
                case (?memo) ?Blob.fromArray(memo);
                case (null) null;
            };
            created_at_time = request.created_at_time;
            source = #Icrc2TransferFrom;
            spender = spenderAccount;
        };

        let transferResult = await apply_transfer(transferArgs);

        switch (transferResult) {
            case (#Ok(txIndex)) {
                let newAllowance = {
                    amount = allowance.amount - amount;
                    expires_at = allowance.expires_at;
                };
                allowancesMap.put(allowanceKey, newAllowance);
                #Ok(txIndex)
            };
            case (#Err(err)) #Err(err);
        }
    };

    public query func icrc2_allowance(request : AllowanceRequest) : async Allowance {
        let key = (request.account, request.spender);
        switch (allowancesMap.get(key)) {
            case (?allowance) allowance;
            case (null) { { amount = 0; expires_at = null } };
        }
    };
}; 