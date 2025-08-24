import React from "react";
import Navbar from "@/core/components/Navbar";
import Footer from "../components/Footer";
// import Footer from "@/core/components/Footer"; // jika sudah ada

const HomeLayout = ({ children }) => {
  return (
    <>
      <Navbar />
      {children}
      {/* <Footer /> */}
      <Footer className="mt-28"></Footer>
    </>
  );
};

export default HomeLayout;
