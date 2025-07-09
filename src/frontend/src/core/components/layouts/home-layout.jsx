import React from "react";
import Navbar from "@/core/components/Navbar";
import NavbarLogined from "@/core/components/NavbarLogined";
import Footer from "@/core/components/Footer";
import { Outlet } from "react-router";

const HomeLayout = () => {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
};

export default HomeLayout;
