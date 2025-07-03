import React from "react";
import Navbar from "@/core/components/Navbar";
// import Footer from "@/core/components/Footer"; // jika sudah ada

const HomeLayout = ({ children }) => {
  return (
    <>
      <Navbar />
      {children}
      {/* <Footer /> */}
    </>
  );
};

export default HomeLayout;
