import React, { useEffect, useState } from "react";
import "./Contacts.scss";
import axios from "axios";
import { useCookies } from "react-cookie";
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner";

const ITEMS_PER_PAGE = 20;

const Contacts = () => {
  const [cookies] = useCookies(["token"]);
  const token = cookies?.token;
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const [contacts, setContacts] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: ITEMS_PER_PAGE,
  });

  const fetchContacts = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin/contacts`,
        {
          headers,
          params: {
            page,
            limit: ITEMS_PER_PAGE,
          },
        }
      );
      const responseData = response?.data || {};
      setContacts(responseData?.data || responseData || []);

      if (responseData?.pagination) {
        setPagination((prev) => ({
          ...prev,
          ...responseData.pagination,
        }));
      } else {
        setPagination((prev) => ({
          ...prev,
          currentPage: page,
          totalItems: Array.isArray(responseData?.data)
            ? responseData.data.length
            : Array.isArray(responseData)
              ? responseData.length
              : 0,
          totalPages: 1,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
      setContacts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Format date
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

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchContacts(newPage);
  };

  return (
    <div className="contacts-page-section">
      <div className="top-section">
        <div className="title-section">
          <h1>Əlaqələr</h1>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="contacts-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Ad</th>
              <th>E-mail</th>
              <th>Mesaj</th>
              <th>Tarix</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="7" className="loading-cell">
                  <LoadingSpinner />
                </td>
              </tr>
            ) : contacts && contacts.length > 0 ? (
              contacts.map((contact, index) => (
                <tr key={contact.id}>
                  <td>
                    {((pagination.itemsPerPage || ITEMS_PER_PAGE) * ((pagination.currentPage || 1) - 1)) + index + 1}
                  </td>
                  <td>{contact.name || "-"}</td>
                  <td>{contact.email || "-"}</td>
                  <td className="message-cell">
                    <div className="message-content">
                      {contact.message || "-"}
                    </div>
                  </td>
                  <td>{formatDate(contact.createdAt)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-data-cell">
                  Əlaqə tapılmadı
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="pagination-controls">
        <button
          type="button"
          className="pagination-button"
          onClick={() => handlePageChange((pagination.currentPage || 1) - 1)}
          disabled={isLoading || (pagination.currentPage || 1) <= 1}
        >
          Əvvəlki
        </button>

        <span className="pagination-info">
          Səhifə {pagination.currentPage || 1} / {pagination.totalPages || 1}
        </span>

        <button
          type="button"
          className="pagination-button"
          onClick={() => handlePageChange((pagination.currentPage || 1) + 1)}
          disabled={
            isLoading ||
            (pagination.currentPage || 1) >= (pagination.totalPages || 1)
          }
        >
          Sonrakı
        </button>
      </div>
    </div>
  );
};

export default Contacts;
