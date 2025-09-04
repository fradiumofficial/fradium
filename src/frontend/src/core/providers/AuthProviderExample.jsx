import React from "react";
import { AuthProvider } from "./AuthProvider";
import { backend } from "declarations/backend";
import { bitcoin } from "declarations/bitcoin";

// Example usage for the current project
export const FradiumAuthProvider = ({ children }) => {
  // Define canisters for this project
  const canisters = {
    backend,
    bitcoin,
  };

  // Custom profile function for this project
  const getProfileFunction = async () => {
    return await backend.get_profile();
  };

  // Custom login success handler (optional)
  const handleLoginSuccess = ({ user, isAuthenticated }) => {
    console.log("Login successful:", { user, isAuthenticated });
    // You can add custom logic here
  };

  // Custom logout handler (optional)
  const handleLogout = () => {
    console.log("User logged out");
    // You can add custom logic here
  };

  return (
    <AuthProvider canisters={canisters} getProfileFunction={getProfileFunction} onLoginSuccess={handleLoginSuccess} onLogout={handleLogout} redirectAfterLogin="/dashboard" redirectAfterLogout="/">
      {children}
    </AuthProvider>
  );
};

// Example for a different project
export const DifferentProjectAuthProvider = ({ children }) => {
  // Import different canisters for different project
  // import { userService } from "declarations/userService";
  // import { paymentService } from "declarations/paymentService";

  const canisters = {
    // userService,
    // paymentService,
  };

  const getProfileFunction = async () => {
    // return await userService.get_user_profile();
    return null;
  };

  return (
    <AuthProvider canisters={canisters} getProfileFunction={getProfileFunction} redirectAfterLogin="/home" redirectAfterLogout="/login">
      {children}
    </AuthProvider>
  );
};
