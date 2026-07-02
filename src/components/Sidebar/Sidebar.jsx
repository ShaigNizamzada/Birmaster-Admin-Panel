import React, { useContext, createContext } from "react";
import BirsaytLogo from "../../assets/images/Logo.webp";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCookies } from "react-cookie";
import "./Sidebar.scss";
import { toast } from "react-toastify";

export const SidebarContext = createContext();
export const useSidebar = () => useContext(SidebarContext);

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen, toggleSidebar, isMobileOpen, toggleMobileSidebar } =
    useSidebar();
  const [, , removeCookie] = useCookies(["token"]);
  const handleMenuItemClick = () => {
    if (window.innerWidth <= 768 && isMobileOpen) {
      toggleMobileSidebar();
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    removeCookie("token", {
      path: "/",
      sameSite: "lax",
      secure: import.meta.env.PROD || false,
    });
    toast.success("Çıxış edildi");
    navigate("/login");
  };
  return (
    <div
      className={`sidebar ${isOpen ? "open" : "closed"} ${isMobileOpen ? "mobile-open" : ""
        }`}
    >
      <div className="sidebar-content">
        <div className="top-side">
          <i
            className="fa-solid fa-bars text-dark desktop-toggle"
            onClick={toggleSidebar}
          ></i>

          {(isOpen || isMobileOpen) && (
            <>
              <img
                src={BirsaytLogo}
                alt="Birsayt Logo"
                className="birsayt-logo"
                title="birsayt"
                onClick={() => {
                  navigate("/dashboard");
                  handleMenuItemClick();
                }}
                style={{ cursor: "pointer" }}
              />
              <i
                className="fa-solid text-dark fa-xmark mobile-close"
                onClick={toggleMobileSidebar}
              ></i>
            </>
          )}
        </div>
        <div className="sidebar-menu">
          <ul>
            <Link
              to="/dashboard"
              className="link"
              onClick={handleMenuItemClick}
            >
              <li className={isActive("/dashboard") ? "active" : ""}>
                <i className="fa-solid fa-table-columns"></i>{" "}
                <span>Dashboard</span>
              </li>
            </Link>{" "}
            <Link to="/packages" className="link" onClick={handleMenuItemClick}>
              <li className={isActive("/packages") ? "active" : ""}>
                <i className="fa-solid fa-box"></i> <span>Paketlər</span>
              </li>
            </Link>{" "}
            <Link to="/services" className="link" onClick={handleMenuItemClick}>
              <li className={isActive("/services") ? "active" : ""}>
                <i className="fa-solid fa-screwdriver-wrench"></i> <span>Xidmətlər</span>
              </li>
            </Link>{" "}
            <Link to="/products" className="link" onClick={handleMenuItemClick}>
              <li className={isActive("/products") ? "active" : ""}>
                <i className="fa-solid fa-boxes-packing"></i>
                <span>Məhsul</span>
              </li>
            </Link>{" "}

            <Link to="/orders" className="link" onClick={handleMenuItemClick}>
              <li className={isActive("/orders") ? "active" : ""}>
                <i className="fa-solid fa-shopping-cart"></i> <span>Sifarişlər</span>
              </li>
            </Link>{" "}
            <Link to="/contacts" className="link" onClick={handleMenuItemClick}>
              <li className={isActive("/contacts") ? "active" : ""}>
                <i className="fa-solid fa-envelope"></i> <span>Əlaqələr</span>
              </li>
            </Link>{" "}
            <Link to="/settings" className="link" onClick={handleMenuItemClick}>
              <li className={isActive("/settings") ? "active" : ""}>
                <i className="fa-solid fa-gear"></i> <span>Tənzimləmələr</span>
              </li>
            </Link>
          </ul>
        </div>
        <div className="sidebar-footer">
          <div
            className="link"
            onClick={handleLogout}
            style={{ cursor: "pointer" }}
          >
            <li>
              <i className="fas fa-sign-out-alt"></i>
              <span>Çıxış</span>
            </li>
          </div>
        </div>
      </div>
      <div
        className="mobile-sidebar-overlay"
        onClick={toggleMobileSidebar}
      ></div>
    </div>
  );
};

export default Sidebar;
