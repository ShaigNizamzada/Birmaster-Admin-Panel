
import { useCookies } from "react-cookie";
import "./Dashboard.scss";
const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="welcome-section">
          <h2>Xoş gəlmisiniz, Admin! 🎉</h2>
          <p>Admin panelinə uğurla daxil oldunuz.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
