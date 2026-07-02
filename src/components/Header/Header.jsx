import React, { useContext } from "react";
import "./_Header.scss";
import NotificationIcon from "../../assets/icons/NotificationIcon.svg";
import { SidebarContext } from "../Sidebar/Sidebar";
import { Link } from "react-router-dom";

const Header = () => {
  const { toggleMobileSidebar } = useContext(SidebarContext);

  return (
    <header className="header">
      <div className="header-content">
        <div className="left-content">
          <i
            className="fa-solid fa-bars mobile-menu-icon"
            onClick={toggleMobileSidebar}
          ></i>
        </div>
        <div className="right-content">
          <Link to="/profile">
            <div className="profile-section">
              <i className="fa-solid fa-user"></i>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
