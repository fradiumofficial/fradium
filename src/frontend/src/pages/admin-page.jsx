import React from "react";
import { useAuth } from "../core/providers/auth-provider";
import { backend } from "declarations/backend";

const AdminPage = () => {
  const { user, isAuthenticated, handleLogin, handleLogout, isLoading } =
    useAuth();

  console.log("user", user);
  console.log("isAuthenticated", isAuthenticated);

  async function handleCreateProfile() {
    try {
      const name = document.getElementById("name").value;
      const profilePicture = document.getElementById("profilePicture").value;

      const result = await backend.create_profile({
        name: name,
        profile_picture: profilePicture ? [profilePicture] : [],
      });

      if ("Ok" in result) {
        window.location.reload();
      }
    } catch (err) {
      console.error("Error creating profile:", err);
    }
  }

  if (isLoading) {
    return <div className="text-2xl font-bold container mt-5">Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="text-2xl font-bold container mt-5">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-md"
          onClick={handleLogin}
        >
          Login
        </button>
      </div>
    );
  }

  if (isAuthenticated && !user) {
    return (
      <div className="container mt-5">
        <input
          type="text"
          placeholder="Name"
          id="name"
          className="border-2 border-gray-300 rounded-md p-2"
        />
        <input
          type="text"
          placeholder="Profile Picture"
          id="profilePicture"
          className="border-2 border-gray-300 rounded-md p-2"
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-md"
          onClick={handleCreateProfile}
        >
          Create Profile
        </button>
      </div>
    );
  }

  return (
    <div className="text-2xl font-bold container mt-5">
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded-md"
        onClick={handleLogin}
      >
        Login
      </button>
    </div>
  );
};

export default HomePage;
