import React, { useEffect, useState } from "react";
import "./Users.scss";
import axios from "axios";
import { useCookies } from "react-cookie";
import { toast } from "react-toastify";
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner";

const ITEMS_PER_PAGE = 20;

const Users = () => {
  const [cookies] = useCookies(["token"]);
  const token = cookies?.token;
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/Users`,
        { headers }
      );
      const data = Array.isArray(response?.data)
        ? response.data
        : response?.data?.data || [];
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setUsers([]);
      toast.error("İstifadəçilər yüklənərkən xəta baş verdi");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const totalPages = Math.max(1, Math.ceil(users.length / ITEMS_PER_PAGE));
  const paginatedUsers = users.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("az-AZ", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    if (amount == null) return "-";
    return `${amount} ₼`;
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };

  return (
    <div className="users-page-section">
      <div className="top-section">
        <div className="title-section">
          <h1>İstifadəçilər</h1>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>№</th>
              <th>Ad Soyad</th>
              <th>E-mail</th>
              <th>Telefon</th>
              <th>Növ</th>
              <th>Şirkət</th>
              <th>Rol</th>
              <th>Balans</th>
              <th>Təsdiqlənib</th>
              <th>Tarix</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="10" className="loading-cell">
                  <LoadingSpinner />
                </td>
              </tr>
            ) : paginatedUsers.length > 0 ? (
              paginatedUsers.map((user, index) => (
                <tr key={user.id}>
                  <td>
                    {ITEMS_PER_PAGE * (currentPage - 1) + index + 1}
                  </td>
                  <td>{user.fullName || "-"}</td>
                  <td>{user.email || "-"}</td>
                  <td>{user.phone || "-"}</td>
                  <td>
                    <span
                      className={`type-badge ${user.isCorporate ? "corporate" : "individual"}`}
                    >
                      {user.isCorporate ? "Korporativ" : "Fərdi"}
                    </span>
                  </td>
                  <td>{user.companyName || "-"}</td>
                  <td>
                    <span
                      className={`role-badge ${(user.role || "").toLowerCase() === "admin" ? "admin" : "user"}`}
                    >
                      {user.role || "-"}
                    </span>
                  </td>
                  <td className="balance-cell">
                    {formatCurrency(user.balance)}
                  </td>
                  <td>
                    <span
                      className={`verified-badge ${user.isVerified ? "verified" : "unverified"}`}
                    >
                      {user.isVerified ? "Bəli" : "Xeyr"}
                    </span>
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" className="no-data-cell">
                  İstifadəçi tapılmadı
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {users.length > ITEMS_PER_PAGE && (
        <div className="pagination-controls">
          <button
            type="button"
            className="pagination-button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={isLoading || currentPage <= 1}
          >
            Əvvəlki
          </button>

          <span className="pagination-info">
            Səhifə {currentPage} / {totalPages}
          </span>

          <button
            type="button"
            className="pagination-button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={isLoading || currentPage >= totalPages}
          >
            Sonrakı
          </button>
        </div>
      )}
    </div>
  );
};

export default Users;
