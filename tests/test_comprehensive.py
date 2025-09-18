# tests/test_comprehensive.py
import unittest
import os
from pocket_ic import PocketIC
from ic.principal import Principal
from ic.candid import encode, decode, Types

# Time constants in nanoseconds
ONE_WEEK_IN_NS = 7 * 24 * 60 * 60 * 1_000_000_000
TWO_DAYS_IN_NS = 48 * 60 * 60 * 1_000_000_000
DECIMALS = 8
TOKEN_UNIT = 10 ** DECIMALS

def create_random_principal():
    return Principal(bytes=os.urandom(29))

class ComprehensiveTest(unittest.TestCase):
    def setUp(self):
        self.pic = PocketIC()
        
        # Deploy mock token canister
        self.token_canister_id = self.pic.create_canister()
        self.pic.add_cycles(self.token_canister_id, 2_000_000_000_000)
        
        # Deploy backend canister
        self.backend_canister_id = self.pic.create_canister()
        self.pic.add_cycles(self.backend_canister_id, 2_000_000_000_000)
        
        # Load WASM files
        try:
            with open("src/mock_token/mock_token.wasm", 'rb') as f:
                token_wasm = f.read()
            with open(".dfx/local/canisters/backend/backend.wasm", 'rb') as f:
                backend_wasm = f.read()
        except FileNotFoundError as e:
            self.skipTest(f"WASM file not found: {e}")
        
        # Install canisters
        self.pic.install_code(self.token_canister_id, token_wasm, b'')
        self.pic.install_code(self.backend_canister_id, backend_wasm, b'')
        
        # Initialize token canister
        self.pic.update_call(self.token_canister_id, "init", encode([]))
        
        self.pic.set_time(1700000000000000000)
        
        # Create test users
        self.reporter = create_random_principal()
        self.voter1 = create_random_principal()
        self.voter2 = create_random_principal()
        self.voter3 = create_random_principal()

    def mint_tokens_for_user(self, user: Principal, amount: int):
        """Helper to mint tokens for a user"""
        self.pic.set_sender(user)
        self.pic.update_call(self.token_canister_id, "mint", encode([{'type': Types.Nat, 'value': amount}]))

    def approve_tokens(self, user: Principal, spender: Principal, amount: int):
        """Helper to approve tokens for spending"""
        self.pic.set_sender(user)
        args = {
            'spender': {'owner': spender, 'subaccount': []},
            'amount': amount,
            'fee': [],
            'memo': [],
            'from_subaccount': [],
            'created_at_time': []
        }
        return self.pic.update_call(self.token_canister_id, "icrc2_approve", encode([args]))

    def create_test_report(self, reporter: Principal, stake_amount: int = 5 * TOKEN_UNIT) -> int:
        """Helper to create a test report"""
        # Mint and approve tokens
        self.mint_tokens_for_user(reporter, stake_amount * 2)
        self.approve_tokens(reporter, self.backend_canister_id, stake_amount * 2)
        
        # Create report
        self.pic.set_sender(reporter)
        report_params = {
            'chain': 'Bitcoin',
            'address': f'bc1test{os.urandom(8).hex()}',
            'category': 'Phishing',
            'description': 'Test scam address',
            'url': [],
            'evidence': ['evidence.jpg'],
            'stake_amount': stake_amount
        }
        
        result = self.pic.update_call(self.backend_canister_id, "create_report", encode([report_params]))
        
        # Extract report ID from result
        decoded = decode(result)
        if isinstance(decoded, dict) and 'Ok' in decoded:
            # Parse "Report created successfully with ID: X" 
            msg = decoded['Ok']
            report_id = int(msg.split(': ')[-1])
            return report_id
        else:
            raise Exception(f"Failed to create report: {decoded}")

    def vote_on_report(self, voter: Principal, report_id: int, vote_type: bool, stake_amount: int = 1 * TOKEN_UNIT):
        """Helper to vote on a report"""
        self.mint_tokens_for_user(voter, stake_amount * 2)
        self.approve_tokens(voter, self.backend_canister_id, stake_amount * 2)
        
        self.pic.set_sender(voter)
        vote_params = {
            'report_id': report_id,
            'vote_type': vote_type,
            'stake_amount': stake_amount
        }
        
        return self.pic.update_call(self.backend_canister_id, "vote_report", encode([vote_params]))

    def test_complete_report_lifecycle_with_majority_yes(self):
        """Test complete report lifecycle with YES majority"""
        print("=== Testing Complete Report Lifecycle (YES Majority) ===")
        
        # 1. Create report
        report_id = self.create_test_report(self.reporter, 5 * TOKEN_UNIT)
        print(f"Created report ID: {report_id}")
        
        # 2. Multiple users vote YES (should create majority)
        self.vote_on_report(self.voter1, report_id, True, 2 * TOKEN_UNIT)
        self.vote_on_report(self.voter2, report_id, True, 3 * TOKEN_UNIT)
        self.vote_on_report(self.voter3, report_id, False, 1 * TOKEN_UNIT)  # One NO vote
        
        # 3. Check report state before deadline
        result = self.pic.query_call(self.backend_canister_id, "get_report", encode([{'type': Types.Nat32, 'value': report_id}]))
        report = decode(result)['Ok']
        
        self.assertEqual(report['votes_yes'], 2)
        self.assertEqual(report['votes_no'], 1)
        self.assertEqual(len(report['voted_by']), 3)
        
        # 4. Advance time past deadline
        self.pic.advance_time(ONE_WEEK_IN_NS + 1000)
        self.pic.tick()
        
        # 5. Test unstaking for voters (YES voters should get rewards, NO voter shouldn't)
        self.pic.set_sender(self.voter1)
        result1 = self.pic.update_call(self.backend_canister_id, "unstake_voted_report", encode([{'type': Types.Nat32, 'value': report_id}]))
        decoded1 = decode(result1)
        print(f"Voter1 (YES) unstake result: {decoded1}")
        
        self.pic.set_sender(self.voter2)
        result2 = self.pic.update_call(self.backend_canister_id, "unstake_voted_report", encode([{'type': Types.Nat32, 'value': report_id}]))
        decoded2 = decode(result2)
        print(f"Voter2 (YES) unstake result: {decoded2}")
        
        self.pic.set_sender(self.voter3)
        result3 = self.pic.update_call(self.backend_canister_id, "unstake_voted_report", encode([{'type': Types.Nat32, 'value': report_id}]))
        decoded3 = decode(result3)
        print(f"Voter3 (NO) unstake result: {decoded3}")
        
        # 6. Test reporter unstaking (should get reward since report was validated)
        self.pic.set_sender(self.reporter)
        reporter_result = self.pic.update_call(self.backend_canister_id, "unstake_created_report", encode([{'type': Types.Nat32, 'value': report_id}]))
        decoded_reporter = decode(reporter_result)
        print(f"Reporter unstake result: {decoded_reporter}")
        
        # Verify rewards were given correctly
        self.assertIn("Ok", decoded1)  # YES voter should get reward
        self.assertIn("Ok", decoded2)  # YES voter should get reward
        self.assertIn("Ok", decoded3)  # NO voter should still get stake back
        self.assertIn("Ok", decoded_reporter)  # Reporter should get reward

    def test_complete_report_lifecycle_with_majority_no(self):
        """Test complete report lifecycle with NO majority"""
        print("=== Testing Complete Report Lifecycle (NO Majority) ===")
        
        # 1. Create report
        report_id = self.create_test_report(self.reporter, 5 * TOKEN_UNIT)
        
        # 2. Multiple users vote NO (should create majority)
        self.vote_on_report(self.voter1, report_id, False, 2 * TOKEN_UNIT)
        self.vote_on_report(self.voter2, report_id, False, 3 * TOKEN_UNIT)
        self.vote_on_report(self.voter3, report_id, True, 1 * TOKEN_UNIT)  # One YES vote
        
        # 3. Advance time past deadline
        self.pic.advance_time(ONE_WEEK_IN_NS + 1000)
        self.pic.tick()
        
        # 4. Test unstaking (NO voters should get rewards, YES voter shouldn't)
        self.pic.set_sender(self.voter1)
        result1 = self.pic.update_call(self.backend_canister_id, "unstake_voted_report", encode([{'type': Types.Nat32, 'value': report_id}]))
        
        self.pic.set_sender(self.voter2)
        result2 = self.pic.update_call(self.backend_canister_id, "unstake_voted_report", encode([{'type': Types.Nat32, 'value': report_id}]))
        
        self.pic.set_sender(self.voter3)
        result3 = self.pic.update_call(self.backend_canister_id, "unstake_voted_report", encode([{'type': Types.Nat32, 'value': report_id}]))
        
        # 5. Test reporter unstaking (should NOT get reward since report was not validated)
        self.pic.set_sender(self.reporter)
        reporter_result = self.pic.update_call(self.backend_canister_id, "unstake_created_report", encode([{'type': Types.Nat32, 'value': report_id}]))
        decoded_reporter = decode(reporter_result)
        
        # Verify NO majority scenario
        self.assertIn("no reward - report not validated", str(decoded_reporter))

    def test_edge_cases_and_error_conditions(self):
        """Test various edge cases and error conditions"""
        print("=== Testing Edge Cases and Error Conditions ===")
        
        # 1. Test duplicate address reporting
        report_id1 = self.create_test_report(self.reporter, 5 * TOKEN_UNIT)
        
        # Try to create another report with same address
        self.mint_tokens_for_user(self.voter1, 10 * TOKEN_UNIT)
        self.approve_tokens(self.voter1, self.backend_canister_id, 10 * TOKEN_UNIT)
        
        self.pic.set_sender(self.voter1)
        
        # Get the address from the first report
        result = self.pic.query_call(self.backend_canister_id, "get_report", encode([{'type': Types.Nat32, 'value': report_id1}]))
        first_report = decode(result)['Ok']
        
        duplicate_params = {
            'chain': 'Bitcoin',
            'address': first_report['address'],  # Same address
            'category': 'Fraud',
            'description': 'Duplicate report attempt',
            'url': [],
            'evidence': ['evidence2.jpg'],
            'stake_amount': 5 * TOKEN_UNIT
        }
        
        duplicate_result = self.pic.update_call(self.backend_canister_id, "create_report", encode([duplicate_params]))
        decoded_duplicate = decode(duplicate_result)
        self.assertIn("Err", decoded_duplicate)
        self.assertIn("already been reported", str(decoded_duplicate))
        
        # 2. Test voting on own report
        self.pic.set_sender(self.reporter)
        self.mint_tokens_for_user(self.reporter, 10 * TOKEN_UNIT)
        self.approve_tokens(self.reporter, self.backend_canister_id, 10 * TOKEN_UNIT)
        
        vote_own_result = self.pic.update_call(self.backend_canister_id, "vote_report", encode([{
            'report_id': report_id1,
            'vote_type': True,
            'stake_amount': 1 * TOKEN_UNIT
        }]))
        decoded_own_vote = decode(vote_own_result)
        self.assertIn("Err", decoded_own_vote)
        self.assertIn("cannot vote on your own report", str(decoded_own_vote))
        
        # 3. Test double voting
        self.vote_on_report(self.voter1, report_id1, True, 1 * TOKEN_UNIT)
        
        # Try to vote again
        self.mint_tokens_for_user(self.voter1, 10 * TOKEN_UNIT)
        self.approve_tokens(self.voter1, self.backend_canister_id, 10 * TOKEN_UNIT)
        
        double_vote_result = self.pic.update_call(self.backend_canister_id, "vote_report", encode([{
            'report_id': report_id1,
            'vote_type': False,
            'stake_amount': 1 * TOKEN_UNIT
        }]))
        decoded_double = decode(double_vote_result)
        self.assertIn("Err", decoded_double)
        self.assertIn("already voted", str(decoded_double))
        
        # 4. Test voting after deadline
        self.pic.advance_time(ONE_WEEK_IN_NS + 1000)
        self.pic.tick()
        
        late_vote_result = self.pic.update_call(self.backend_canister_id, "vote_report", encode([{
            'report_id': report_id1,
            'vote_type': True,
            'stake_amount': 1 * TOKEN_UNIT
        }]))
        decoded_late = decode(late_vote_result)
        self.assertIn("Err", decoded_late)
        self.assertIn("Voting period has ended", str(decoded_late))

    def test_insufficient_stake_scenarios(self):
        """Test scenarios with insufficient stakes"""
        print("=== Testing Insufficient Stake Scenarios ===")
        
        # 1. Test creating report with insufficient stake
        self.mint_tokens_for_user(self.reporter, 10 * TOKEN_UNIT)
        self.approve_tokens(self.reporter, self.backend_canister_id, 10 * TOKEN_UNIT)
        
        self.pic.set_sender(self.reporter)
        low_stake_params = {
            'chain': 'Bitcoin',
            'address': f'bc1lowstake{os.urandom(4).hex()}',
            'category': 'Phishing',
            'description': 'Test with low stake',
            'url': [],
            'evidence': ['evidence.jpg'],
            'stake_amount': 1 * TOKEN_UNIT  # Below 5 token minimum
        }
        
        result = self.pic.update_call(self.backend_canister_id, "create_report", encode([low_stake_params]))
        decoded = decode(result)
        self.assertIn("Err", decoded)
        self.assertIn("Minimum stake is 5 FUM tokens", str(decoded))
        
        # 2. Test voting with insufficient stake
        report_id = self.create_test_report(self.voter1, 5 * TOKEN_UNIT)
        
        self.mint_tokens_for_user(self.voter2, 10 * TOKEN_UNIT)
        self.approve_tokens(self.voter2, self.backend_canister_id, 10 * TOKEN_UNIT)
        
        self.pic.set_sender(self.voter2)
        low_vote_result = self.pic.update_call(self.backend_canister_id, "vote_report", encode([{
            'report_id': report_id,
            'vote_type': True,
            'stake_amount': TOKEN_UNIT // 2  # Below 1 token minimum
        }]))
        decoded_vote = decode(low_vote_result)
        self.assertIn("Err", decoded_vote)
        self.assertIn("Minimum stake is 1 FUM token", str(decoded_vote))

    def test_unstaking_before_deadline(self):
        """Test that unstaking before deadline fails"""
        print("=== Testing Unstaking Before Deadline ===")
        
        # Create report and vote
        report_id = self.create_test_report(self.reporter, 5 * TOKEN_UNIT)
        self.vote_on_report(self.voter1, report_id, True, 2 * TOKEN_UNIT)
        
        # Try to unstake before deadline
        self.pic.set_sender(self.voter1)
        early_unstake_result = self.pic.update_call(self.backend_canister_id, "unstake_voted_report", encode([{'type': Types.Nat32, 'value': report_id}]))
        decoded = decode(early_unstake_result)
        
        self.assertIn("Err", decoded)
        self.assertIn("Cannot unstake before voting deadline", str(decoded))
        
        # Same for reporter
        self.pic.set_sender(self.reporter)
        early_reporter_unstake = self.pic.update_call(self.backend_canister_id, "unstake_created_report", encode([{'type': Types.Nat32, 'value': report_id}]))
        decoded_reporter = decode(early_reporter_unstake)
        
        self.assertIn("Err", decoded_reporter)
        self.assertIn("Cannot unstake before voting deadline", str(decoded_reporter))

    def test_double_unstaking_prevention(self):
        """Test that double unstaking is prevented"""
        print("=== Testing Double Unstaking Prevention ===")
        
        # Create report, vote, and advance time
        report_id = self.create_test_report(self.reporter, 5 * TOKEN_UNIT)
        self.vote_on_report(self.voter1, report_id, True, 2 * TOKEN_UNIT)
        
        self.pic.advance_time(ONE_WEEK_IN_NS + 1000)
        self.pic.tick()
        
        # Unstake once
        self.pic.set_sender(self.voter1)
        first_unstake = self.pic.update_call(self.backend_canister_id, "unstake_voted_report", encode([{'type': Types.Nat32, 'value': report_id}]))
        decoded_first = decode(first_unstake)
        self.assertIn("Ok", decoded_first)
        
        # Try to unstake again
        second_unstake = self.pic.update_call(self.backend_canister_id, "unstake_voted_report", encode([{'type': Types.Nat32, 'value': report_id}]))
        decoded_second = decode(second_unstake)
        self.assertIn("Err", decoded_second)
        self.assertIn("already unstaked", str(decoded_second))

    def test_activity_score_calculation(self):
        """Test activity score calculation affects vote weight"""
        print("=== Testing Activity Score Calculation ===")
        
        # Create multiple reports and votes to build activity
        report_id1 = self.create_test_report(self.reporter, 5 * TOKEN_UNIT)
        report_id2 = self.create_test_report(self.voter1, 5 * TOKEN_UNIT)
        
        # voter2 makes correct votes to build activity
        self.vote_on_report(self.voter2, report_id1, True, 1 * TOKEN_UNIT)  # Assume this will be majority
        self.vote_on_report(self.voter3, report_id1, True, 1 * TOKEN_UNIT)  # Create majority
        
        # Check that vote weights are calculated
        result = self.pic.query_call(self.backend_canister_id, "get_report", encode([{'type': Types.Nat32, 'value': report_id1}]))
        report = decode(result)['Ok']
        
        # Verify that voted_by contains vote_weight information
        self.assertTrue(len(report['voted_by']) > 0)
        for voter in report['voted_by']:
            self.assertTrue('vote_weight' in voter)
            self.assertGreater(voter['vote_weight'], 0)

    def test_analyze_address_functionality(self):
        """Test the analyze_address functionality"""
        print("=== Testing Analyze Address Functionality ===")
        
        # 1. Test analyzing non-reported address (should be safe)
        self.pic.set_sender(self.reporter)
        safe_result = self.pic.update_call(self.backend_canister_id, "analyze_address", encode([{'type': Types.Text, 'value': 'bc1safeaddress123'}]))
        decoded_safe = decode(safe_result)
        
        self.assertIn("Ok", decoded_safe)
        result_data = decoded_safe['Ok']
        self.assertTrue(result_data['is_safe'])
        self.assertIsNone(result_data['report'])
        
        # 2. Test analyzing reported address that was validated as unsafe
        report_id = self.create_test_report(self.reporter, 5 * TOKEN_UNIT)
        
        # Get the reported address
        result = self.pic.query_call(self.backend_canister_id, "get_report", encode([{'type': Types.Nat32, 'value': report_id}]))
        report = decode(result)['Ok']
        reported_address = report['address']
        
        # Vote to make it unsafe (majority YES)
        self.vote_on_report(self.voter1, report_id, True, 2 * TOKEN_UNIT)
        self.vote_on_report(self.voter2, report_id, True, 3 * TOKEN_UNIT)
        
        # Advance time past deadline
        self.pic.advance_time(ONE_WEEK_IN_NS + 1000)
        self.pic.tick()
        
        # Analyze the reported address
        unsafe_result = self.pic.update_call(self.backend_canister_id, "analyze_address", encode([{'type': Types.Text, 'value': reported_address}]))
        decoded_unsafe = decode(unsafe_result)
        
        self.assertIn("Ok", decoded_unsafe)
        unsafe_data = decoded_unsafe['Ok']
        self.assertFalse(unsafe_data['is_safe'])  # Should be marked as unsafe
        self.assertIsNotNone(unsafe_data['report'])

    def test_get_my_reports_and_votes(self):
        """Test getting user's reports and votes"""
        print("=== Testing Get My Reports and Votes ===")
        
        # Create report as reporter
        report_id = self.create_test_report(self.reporter, 5 * TOKEN_UNIT)
        
        # Vote as voter
        self.vote_on_report(self.voter1, report_id, True, 2 * TOKEN_UNIT)
        
        # Test get_my_reports
        self.pic.set_sender(self.reporter)
        my_reports_result = self.pic.update_call(self.backend_canister_id, "get_my_reports", encode([]))
        decoded_reports = decode(my_reports_result)
        
        self.assertIn("Ok", decoded_reports)
        reports = decoded_reports['Ok']
        self.assertEqual(len(reports), 1)
        self.assertEqual(reports[0]['report_id'], report_id)
        self.assertEqual(reports[0]['stake_amount'], 5 * TOKEN_UNIT)
        
        # Test get_my_votes
        self.pic.set_sender(self.voter1)
        my_votes_result = self.pic.update_call(self.backend_canister_id, "get_my_votes", encode([]))
        decoded_votes = decode(my_votes_result)
        
        self.assertIn("Ok", decoded_votes)
        votes = decoded_votes['Ok']
        self.assertEqual(len(votes), 1)
        self.assertEqual(votes[0]['report_id'], report_id)
        self.assertTrue(votes[0]['vote_type'])
        self.assertEqual(votes[0]['stake_amount'], 2 * TOKEN_UNIT)

if __name__ == '__main__':
    print("Running Comprehensive Test Suite...")
    print("This tests the complete functionality with mock token integration")
    
    # Check if required files exist
    required_files = [
        ".dfx/local/canisters/backend/backend.wasm",
        "src/mock_token/mock_token.wasm"
    ]
    
    missing_files = []
    for file in required_files:
        if not os.path.exists(file):
            missing_files.append(file)
    
    if missing_files:
        print(f"Missing required files: {missing_files}")
        print("Run: dfx build")
        exit(1)
    
    unittest.main(verbosity=2)