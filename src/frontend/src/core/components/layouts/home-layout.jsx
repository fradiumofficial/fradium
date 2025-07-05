import React from "react";
import Navbar from "@/core/components/Navbar";
import Footer from "@/core/components/Footer";

const HomeLayout = ({ children }) => {
    return (
        <>
            <Navbar />
            {children}
            <Footer />
        </>
    );
};

export default HomeLayout;
