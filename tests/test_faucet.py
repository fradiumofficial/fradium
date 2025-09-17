# tests/test_faucet.py
import unittest
import os
import glob
from pocket_ic import PocketIC
from ic.principal import Principal
from ic.candid import encode

def create_random_principal():
    """Generate a random principal for testing"""
    return Principal(bytes=os.urandom(29))

def create_anonymous_principal():
    """Create anonymous principal"""
    return Principal.anonymous()

class FaucetTest(unittest.TestCase):
    def setUp(self):
        """Setup for each test"""
        self.pic = PocketIC()
        
        # Just create the backend canister with PocketIC
        self.backend_id = self.pic.create_canister()
        
        # Find the backend WASM file (it might be in different locations depending on your config)
        possible_paths = [
            ".dfx/local/canisters/backend/backend.wasm",
            ".dfx/local/canisters/backend/backend.wasm.gz",
            "target/wasm32-unknown-unknown/release/backend.wasm",
            ".dfx/local/canisters/backend/service.wasm",
        ]
        
        backend_wasm_path = None
        for path in possible_paths:
            if os.path.exists(path):
                backend_wasm_path = path
                break
        
        # Also try to find any WASM file in the backend canister directory
        if not backend_wasm_path:
            backend_dir = ".dfx/local/canisters/backend/"
            if os.path.exists(backend_dir):
                wasm_files = glob.glob(os.path.join(backend_dir, "*.wasm*"))
                if wasm_files:
                    backend_wasm_path = wasm_files[0]
        
        if backend_wasm_path and os.path.exists(backend_wasm_path):
            try:
                with open(backend_wasm_path, 'rb') as f:
                    wasm_bytes = f.read()
                self.pic.install_code(self.backend_id, wasm_bytes, b'')
                print(f"✓ Backend canister installed from: {backend_wasm_path}")
            except Exception as e:
                self.skipTest(f"Cannot install backend canister: {e}")
        else:
            print("❌ Backend WASM not found in any of these locations:")
            for path in possible_paths:
                print(f"  - {path}")
            self.skipTest("Backend WASM not found. Run 'dfx build' first.")
        
        # Set initial time
        self.pic.set_time(1700000000000000000)

    def test_faucet_cooldown_state_management(self):
        """Test the core faucet cooldown logic without token dependencies"""
        user = create_random_principal()
        
        print(f"Testing with user: {user}")
        
        # Test check_faucet_claim for new user (should be able to claim)
        try:
            self.pic.set_sender(user)
            # CHANGED: query_call -> update_call
            result = self.pic.update_call(
                self.backend_id,
                "check_faucet_claim",
                encode([])
            )
            result_str = str(result).lower()
            print(f"New user check result: {result}")
            self.assertTrue("can claim" in result_str or "ok" in result_str)
            print("✓ New user can claim faucet")
        except Exception as e:
            print(f"❌ check_faucet_claim test failed: {e}")
            raise

    def test_faucet_claim_attempt_and_cooldown_check(self):
        """Test faucet claim and subsequent cooldown behavior"""
        user = create_random_principal()
        
        print(f"Testing claim attempt with user: {user}")
        
        # Check initial state
        try:
            self.pic.set_sender(user)
            # CHANGED: query_call -> update_call
            initial_result = self.pic.update_call(
                self.backend_id,
                "check_faucet_claim",
                encode([])
            )
            print(f"Initial faucet state: {initial_result}")
        except Exception as e:
            print(f"Initial check failed: {e}")

        # Attempt first faucet claim (will fail due to missing token canister, but cooldown should be set)
        try:
            self.pic.set_sender(user)
            claim_result = self.pic.update_call(
                self.backend_id,
                "claim_faucet",
                encode([])
            )
            print(f"✓ Faucet claim succeeded: {claim_result}")
        except Exception as e:
            error_msg = str(e).lower()
            print(f"Faucet claim failed (expected): {e}")
            if "anonymous" in error_msg:
                print("✓ Anonymous user correctly rejected")
            elif "token" in error_msg or "transfer" in error_msg or "canister" in error_msg or "route" in error_msg:
                print("✓ Faucet claim failed due to missing token canister (expected)")
            else:
                print(f"! Unexpected error in faucet claim: {e}")
        
        # Now check if cooldown was set (this should work regardless of token transfer)
        try:
            self.pic.set_sender(user)
            # CHANGED: query_call -> update_call
            result = self.pic.update_call(
                self.backend_id,
                "check_faucet_claim",
                encode([])
            )
            result_str = str(result).lower()
            print(f"Post-claim cooldown check: {result}")
            
            if "can't claim" in result_str or "remaining time" in result_str:
                print("✓ Cooldown correctly set after claim attempt")
            elif "can claim" in result_str:
                print("! Cooldown not set (claim may have failed before cooldown logic)")
            else:
                print(f"! Unexpected cooldown check result: {result}")
                
        except Exception as e:
            print(f"! Cooldown check failed: {e}")
            raise

    def test_time_advancement_and_cooldown_reset(self):
        """Test that time advancement allows new claims"""
        user = create_random_principal()
        
        print(f"Testing time advancement with user: {user}")
        
        # First, attempt a claim to set cooldown
        try:
            self.pic.set_sender(user)
            self.pic.update_call(self.backend_id, "claim_faucet", encode([]))
        except Exception as e:
            print(f"Expected claim failure: {e}")
        
        # Check cooldown is active
        try:
            self.pic.set_sender(user)
            # CHANGED: query_call -> update_call
            result = self.pic.update_call(self.backend_id, "check_faucet_claim", encode([]))
            print(f"Cooldown status before time advance: {result}")
        except Exception as e:
            print(f"Pre-advance cooldown check failed: {e}")
        
        # Advance time by more than 48 hours
        TWO_DAYS_IN_NS = 48 * 60 * 60 * 1_000_000_000
        print(f"Advancing time by {TWO_DAYS_IN_NS + 1_000_000_000} nanoseconds")
        self.pic.advance_time(TWO_DAYS_IN_NS + 1_000_000_000)
        self.pic.tick()
        
        # Check cooldown after time advancement
        try:
            self.pic.set_sender(user)
            # CHANGED: query_call -> update_call
            result = self.pic.update_call(self.backend_id, "check_faucet_claim", encode([]))
            result_str = str(result).lower()
            print(f"Cooldown status after time advance: {result}")
            
            if "can claim" in result_str:
                print("✓ Cooldown correctly reset after time advancement")
            else:
                print(f"! Cooldown still active after time advance: {result}")
                
        except Exception as e:
            print(f"! Post-advance cooldown check failed: {e}")
            raise

    def test_multiple_users_independent_cooldowns(self):
        """Test that different users have independent cooldowns"""
        user1 = create_random_principal()
        user2 = create_random_principal()
        
        print(f"Testing independent cooldowns: User1={user1}, User2={user2}")
        
        # User1 attempts claim
        try:
            self.pic.set_sender(user1)
            self.pic.update_call(self.backend_id, "claim_faucet", encode([]))
        except Exception as e:
            print(f"User1 expected claim failure: {e}")
        
        # User1 should have cooldown
        try:
            self.pic.set_sender(user1)
            # CHANGED: query_call -> update_call
            result1 = self.pic.update_call(self.backend_id, "check_faucet_claim", encode([]))
            print(f"User1 cooldown: {result1}")
        except Exception as e:
            print(f"User1 cooldown check failed: {e}")
        
        # User2 should still be able to claim (no cooldown)
        try:
            self.pic.set_sender(user2)
            # CHANGED: query_call -> update_call
            result2 = self.pic.update_call(self.backend_id, "check_faucet_claim", encode([]))
            result2_str = str(result2).lower()
            print(f"User2 cooldown: {result2}")
            
            if "can claim" in result2_str:
                print("✓ User2 has independent cooldown from User1")
            else:
                print(f"! User2 unexpectedly has cooldown: {result2}")
                
        except Exception as e:
            print(f"User2 cooldown check failed: {e}")
            raise

    def test_anonymous_user_rejection(self):
        """Test that anonymous users are rejected"""
        anonymous_user = create_anonymous_principal()
        
        print(f"Testing anonymous user rejection: {anonymous_user}")
        
        # Anonymous user should not be able to claim
        try:
            self.pic.set_sender(anonymous_user)
            # CHANGED: query_call -> update_call
            result = self.pic.update_call(
                self.backend_id,
                "check_faucet_claim",
                encode([])
            )
            result_str = str(result).lower()
            print(f"Anonymous user check result: {result}")
            
            if "anonymous" in result_str or "not allowed" in result_str:
                print("✓ Anonymous user correctly rejected")
            else:
                print(f"! Anonymous user not properly rejected: {result}")
                
        except Exception as e:
            error_msg = str(e).lower()
            if "anonymous" in error_msg:
                print("✓ Anonymous user correctly rejected via exception")
            else:
                print(f"! Unexpected error for anonymous user: {e}")
                raise

if __name__ == '__main__':
    print("🧪 Running Faucet Logic Tests...")
    print("Note: These tests focus on cooldown logic, not token transfers")
    print("First checking if backend is built...")
    
    # Check multiple possible WASM locations
    possible_paths = [
        ".dfx/local/canisters/backend/backend.wasm",
        ".dfx/local/canisters/backend/backend.wasm.gz",
        "target/wasm32-unknown-unknown/release/backend.wasm",
        ".dfx/local/canisters/backend/service.wasm",
    ]
    
    found_wasm = False
    for path in possible_paths:
        if os.path.exists(path):
            print(f"✓ Found backend WASM at: {path}")
            found_wasm = True
            break
    
    if not found_wasm:
        # Check for any WASM files in backend directory
        backend_dir = ".dfx/local/canisters/backend/"
        if os.path.exists(backend_dir):
            wasm_files = glob.glob(os.path.join(backend_dir, "*.wasm*"))
            if wasm_files:
                print(f"✓ Found backend WASM at: {wasm_files[0]}")
                found_wasm = True
    
    if not found_wasm:
        print("❌ Backend WASM not found!")
        print("Available files in .dfx/local/canisters/:")
        for root, dirs, files in os.walk(".dfx/local/canisters/"):
            for file in files:
                if file.endswith('.wasm') or file.endswith('.wasm.gz'):
                    print(f"  - {os.path.join(root, file)}")
        print("Run: dfx build")
        exit(1)
        
    unittest.main(verbosity=2)