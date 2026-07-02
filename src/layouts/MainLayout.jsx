import React from "react";
import Header from "../components/Header/Header";
import Sidebar, { SidebarContext } from "../components/Sidebar/Sidebar";
import { useState } from "react";
import "./_MainLayout.scss";

const MainLayout = ({ children }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  return (
    <SidebarContext.Provider
      value={{ isOpen, toggleSidebar, isMobileOpen, toggleMobileSidebar }}
    >
      <div className="main-layout">
        <Sidebar />
        <div
          className={`content-wrapper ${!isOpen ? "closed" : ""} ${
            isMobileOpen ? "mobile-sidebar-open" : ""
          }`}
        >
          <Header />
          <main className="main-content">{children}</main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
};

export default MainLayout;
