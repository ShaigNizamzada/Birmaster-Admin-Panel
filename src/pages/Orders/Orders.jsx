import React, { useEffect, useState } from "react";
import "./Orders.scss";
import axios from "axios";
import { useCookies } from "react-cookie";
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner";

const ITEMS_PER_PAGE = 20;

const Orders = () => {
  const [cookies] = useCookies(["token"]);
  const token = cookies?.token;
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const [orders, setOrders] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: ITEMS_PER_PAGE,
  });
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const fetchOrders = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin/orders`,
        {
          headers,
          params: {
            page,
            limit: ITEMS_PER_PAGE,
          },
        }
      );

      const responseData = response?.data || {};
      setOrders(responseData?.data || responseData || []);

      if (responseData?.pagination) {
        setPagination((prev) => ({
          ...prev,
          ...responseData.pagination,
        }));
      } else {
        // Fallback when pagination is not returned from API
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
      console.error("Failed to fetch orders:", error);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);


  const fetchOrderDetails = async (orderId) => {
    setIsLoadingDetails(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin/orders/${orderId}`,
        { headers }
      );

      const responseData = response?.data || {};
      setOrderDetails(responseData?.data || null);
    } catch (error) {
      console.error("Failed to fetch order details:", error);
      setOrderDetails(null);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleViewOrder = (orderId) => {
    setSelectedOrderId(orderId);
    setIsModalOpen(true);
    fetchOrderDetails(orderId);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrderId(null);
    setOrderDetails(null);
  };

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
    return `${amount} ₼`;
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchOrders(newPage);
  };

  return (
    <div className="orders-page-section">
      <div className="top-section">
        <div className="title-section">
          <h1>Sifarişlər</h1>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="orders-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>İnvoys ID</th>
              <th>İstifadəçi</th>
              <th>E-mail</th>
              <th>İstifadəçi adı</th>
              <th>Məhsul sayı</th>
              <th>Məbləğ</th>
              <th>Tarix</th>
              <th>Əməliyyatlar</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="9" className="loading-cell">
                  <LoadingSpinner />
                </td>
              </tr>
            ) : orders && orders.length > 0 ? (
              orders.map((order, index) => (
                <tr key={order.id}>
                  <td>
                    {(pagination.itemsPerPage || ITEMS_PER_PAGE) *
                      ((pagination.currentPage || 1) - 1) +
                      index +
                      1}
                  </td>
                  <td className="invoice-cell">{order.invoiceID || "-"}</td>
                  <td>
                    {`${order.first_name || ""} ${order.last_name || ""}`.trim() ||
                      "-"}
                  </td>
                  <td>{order.email || "-"}</td>
                  <td>{order.username || "-"}</td>
                  <td className="center-cell">{order.productCount || 0}</td>
                  <td className="amount-cell">
                    {formatCurrency(order.amount || order.total || 0)}
                  </td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => handleViewOrder(order.id)}
                      >
                        Bax
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="no-data-cell">
                  Sifariş tapılmadı
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
          onClick={() =>
            handlePageChange((pagination.currentPage || 1) - 1)
          }
          disabled={isLoading || (pagination.currentPage || 1) <= 1}
        >
          Əvvəlki
        </button>

        <span className="pagination-info">
          Səhifə {pagination.currentPage || 1} /{" "}
          {pagination.totalPages || 1}
        </span>

        <button
          type="button"
          className="pagination-button"
          onClick={() =>
            handlePageChange((pagination.currentPage || 1) + 1)
          }
          disabled={
            isLoading ||
            (pagination.currentPage || 1) >= (pagination.totalPages || 1)
          }
        >
          Sonrakı
        </button>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Sifariş Detalları</h2>
              <button
                type="button"
                className="close-button"
                onClick={handleCloseModal}
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              {isLoadingDetails ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <LoadingSpinner />
                </div>
              ) : orderDetails ? (
                <>
                  <div className="order-detail-section">
                    <h3>Ümumi Məlumat</h3>
                    <div className="detail-row">
                      <span className="detail-label">Sifariş ID:</span>
                      <span className="detail-value">{orderDetails.id}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">İnvoys ID:</span>
                      <span className="detail-value">
                        {orderDetails.invoiceID}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Məbləğ:</span>
                      <span className="detail-value">
                        {formatCurrency(orderDetails.amount)}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Tarix:</span>
                      <span className="detail-value">
                        {formatDate(orderDetails.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="order-detail-section">
                    <h3>İstifadəçi Məlumatları</h3>
                    <div className="detail-row">
                      <span className="detail-label">Ad:</span>
                      <span className="detail-value">
                        {orderDetails.first_name}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Soyad:</span>
                      <span className="detail-value">
                        {orderDetails.last_name}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">E-mail:</span>
                      <span className="detail-value">{orderDetails.email}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">İstifadəçi adı:</span>
                      <span className="detail-value">
                        {orderDetails.username}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Telefon:</span>
                      <span className="detail-value">
                        {orderDetails.phone || "-"}
                      </span>
                    </div>
                  </div>

                  <div className="order-detail-section">
                    <h3>Məhsullar</h3>
                    {orderDetails.products && orderDetails.products.length > 0 ? (
                      <div className="products-list">
                        {orderDetails.products.map((product) => (
                          <div key={product.id} className="product-item">
                            <div className="product-image">
                              {product.productTitleImage ? (
                                <img
                                  src={`${import.meta.env.VITE_API_URL}${product.productTitleImage}`}
                                  alt={product.productName}
                                />
                              ) : (
                                <div className="no-image">Şəkil yoxdur</div>
                              )}
                            </div>
                            <div className="product-details">
                              <div className="detail-row">
                                <span className="detail-label">Məhsul adı:</span>
                                <span className="detail-value">
                                  {product.productName}
                                </span>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label">Qiymət:</span>
                                <span className="detail-value">
                                  {formatCurrency(product.cost)}
                                </span>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label">Təsvir:</span>
                                <span className="detail-value">
                                  {product.shortDescription || "-"}
                                </span>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label">Əlavə tarixi:</span>
                                <span className="detail-value">
                                  {formatDate(product.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-products">Məhsul tapılmadı</div>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
                  Məlumat tapılmadı
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" onClick={handleCloseModal}>
                Bağla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
