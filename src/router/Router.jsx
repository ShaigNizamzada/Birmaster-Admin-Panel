import { Route, Routes, BrowserRouter, Navigate } from "react-router-dom";
import Login from "../pages/Login/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import MainLayout from "../layouts/MainLayout";
import ProtectedRoute from "../utils/ProtectedRoute";
import Products from "../pages/Products/Products";
import Orders from "../pages/Orders/Orders";
import Contacts from "../pages/Contacts/Contacts";
import Profile from "../pages/Profile/Profile";
import Settings from "../pages/Settings/Settings";
import Packages from "../pages/Packages/Packages";
import Services from "../pages/Services/Services";

const WithLayout = ({ component: Component }) => {
  return (
    <MainLayout>
      <Component />
    </MainLayout>
  );
};

const AppContent = () => {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route element={<ProtectedRoute />}>
          <Route
            path="/dashboard"
            element={<WithLayout component={Dashboard} />}
          />
          <Route
            path="/products"
            element={<WithLayout component={Products} />}
          />
          <Route path="/packages" element={<WithLayout component={Packages} />} />
          <Route path="/services" element={<WithLayout component={Services} />} />
          <Route path="/orders" element={<WithLayout component={Orders} />} />
          <Route
            path="/contacts"
            element={<WithLayout component={Contacts} />}
          />
          <Route path="/profile" element={<WithLayout component={Profile} />} />
          <Route
            path="/settings"
            element={<WithLayout component={Settings} />}
          />
        </Route>
      </Routes>
    </>
  );
};

const AppRouter = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default AppRouter;
