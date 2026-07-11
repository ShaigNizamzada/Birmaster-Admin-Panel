import React, { useEffect, useState } from "react";
import "./Orders.scss";
import axios from "axios";
import { useCookies } from "react-cookie";
import { toast } from "react-toastify";
import { Dropdown } from "antd";
import { DownOutlined } from "@ant-design/icons";
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner";

const ITEMS_PER_PAGE = 20;
const COUNTDOWN_MINUTES = 60;

const STATUS_OPTIONS = [
  { value: "Pending", label: "Gözləyir" },
  { value: "Paid", label: "Ödənilib" },
  { value: "MasterAssigned", label: "Usta təyin olundu" },
  { value: "MasterOnTheWay", label: "Usta yoldadır" },
  { value: "InProgress", label: "İş görülür" },
  { value: "Completed", label: "Tamamlandı" },
  { value: "Cancelled", label: "Ləğv edildi" },
];

const STATUS_FLOW = [
  "Pending",
  "Paid",
  "MasterAssigned",
  "MasterOnTheWay",
  "InProgress",
  "Completed",
];

const TERMINAL_STATUSES = ["Completed", "Cancelled"];

const getStatusClass = (status) => {
  const normalized = (status || "").toLowerCase();
  if (normalized === "pending") return "pending";
  if (normalized === "paid") return "paid";
  if (normalized === "masterassigned") return "master-assigned";
  if (normalized === "masterontheway") return "master-on-the-way";
  if (normalized === "inprogress") return "in-progress";
  if (normalized === "completed") return "completed";
  if (normalized === "canceled" || normalized === "cancelled") return "canceled";
  return "default";
};

const getStatusLabel = (status) => {
  const match = STATUS_OPTIONS.find(
    (opt) => opt.value.toLowerCase() === (status || "").toLowerCase()
  );
  return match?.label || status || "-";
};

const normalizeStatus = (status) => {
  const normalized = (status || "").toLowerCase();
  if (normalized === "canceled") return "Cancelled";
  const match = STATUS_OPTIONS.find(
    (opt) => opt.value.toLowerCase() === normalized
  );
  return match?.value || status || "Pending";
};

const getAllowedStatuses = (currentStatus) => {
  const current = normalizeStatus(currentStatus);

  if (TERMINAL_STATUSES.includes(current)) {
    return [current];
  }

  const currentIndex = STATUS_FLOW.indexOf(current);
  const nextStatus =
    currentIndex >= 0 && currentIndex < STATUS_FLOW.length - 1
      ? STATUS_FLOW[currentIndex + 1]
      : null;

  const options = [current];
  if (nextStatus) options.push(nextStatus);
  if (!options.includes("Cancelled")) options.push("Cancelled");
  return options;
};

const getRemainingMs = (masterAssignedAt) => {
  if (!masterAssignedAt) return null;
  const assignedAt = new Date(masterAssignedAt).getTime();
  if (Number.isNaN(assignedAt)) return null;
  const elapsed = Date.now() - assignedAt;
  return COUNTDOWN_MINUTES * 60 * 1000 - elapsed;
};

const formatCountdown = (remainingMs) => {
  if (remainingMs == null) return null;
  if (remainingMs <= 0) return "00:00";

  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const shouldShowCountdown = (status) => {
  const current = normalizeStatus(status);
  return (
    current === "MasterAssigned" ||
    current === "MasterOnTheWay" ||
    current === "InProgress"
  );
};

const StatusTag = ({ status, showArrow = false, className = "" }) => {
  const statusClass = getStatusClass(status);
  return (
    <span className={`status-tag status-tag-${statusClass} ${className}`}>
      <span className="status-dot" />
      <span className="status-tag-label">{getStatusLabel(status)}</span>
      {showArrow && <DownOutlined className="status-tag-arrow" />}
    </span>
  );
};

const CountdownTimer = ({ masterAssignedAt, status }) => {
  const [remainingMs, setRemainingMs] = useState(() =>
    getRemainingMs(masterAssignedAt)
  );

  useEffect(() => {
    if (!shouldShowCountdown(status) || !masterAssignedAt) {
      setRemainingMs(null);
      return undefined;
    }

    const update = () => setRemainingMs(getRemainingMs(masterAssignedAt));
    update();
    const intervalId = setInterval(update, 1000);
    return () => clearInterval(intervalId);
  }, [masterAssignedAt, status]);

  if (!shouldShowCountdown(status) || remainingMs == null) return null;

  const isExpired = remainingMs <= 0;

  return (
    <span className={`countdown-timer ${isExpired ? "expired" : ""}`}>
      {isExpired ? "Vaxt bitdi" : formatCountdown(remainingMs)}
    </span>
  );
};

const StatusDropdown = ({ status, disabled, onChange }) => {
  const currentStatus = normalizeStatus(status);
  const isTerminal = TERMINAL_STATUSES.includes(currentStatus);
  const allowedStatuses = getAllowedStatuses(currentStatus);

  const menuItems = allowedStatuses
    .filter((value) => value !== currentStatus)
    .map((value) => {
      const opt = STATUS_OPTIONS.find((item) => item.value === value);
      return {
        key: value,
        label: (
          <div className="status-menu-item">
            <span
              className={`status-dot status-dot-${getStatusClass(value)}`}
            />
            <span className="status-menu-label">{opt?.label || value}</span>
          </div>
        ),
      };
    });

  if (isTerminal || menuItems.length === 0) {
    return <StatusTag status={currentStatus} />;
  }

  return (
    <Dropdown
      menu={{
        items: menuItems,
        onClick: ({ key }) => {
          if (key !== currentStatus) onChange(key);
        },
      }}
      trigger={["click"]}
      disabled={disabled}
      placement="bottomLeft"
      overlayClassName="status-dropdown-menu"
    >
      <button
        type="button"
        className="status-dropdown-btn"
        disabled={disabled}
      >
        <StatusTag status={currentStatus} showArrow />
      </button>
    </Dropdown>
  );
};

const Orders = () => {
  const [cookies] = useCookies(["token"]);
  const token = cookies?.token;
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/Bookings`,
        { headers }
      );
      const data = Array.isArray(response?.data)
        ? response.data
        : response?.data?.data || [];
      setBookings(data);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      setBookings([]);
      toast.error("Sifarişlər yüklənərkən xəta baş verdi");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBookingById = async (bookingId) => {
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/Bookings/${bookingId}`,
      { headers }
    );
    return response?.data?.data || response?.data;
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const totalPages = Math.max(1, Math.ceil(bookings.length / ITEMS_PER_PAGE));
  const paginatedBookings = bookings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const updateBookingStatus = async (bookingId, newStatus) => {
    setUpdatingStatusId(bookingId);
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/Bookings/${bookingId}/status`,
        JSON.stringify(newStatus),
        {
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
        }
      );

      let updatedBooking = { status: newStatus };

      try {
        const freshBooking = await fetchBookingById(bookingId);
        if (freshBooking) {
          updatedBooking = freshBooking;
        }
      } catch (refreshError) {
        console.error("Failed to refresh booking after status update:", refreshError);
        if (newStatus === "MasterAssigned") {
          updatedBooking = {
            status: newStatus,
            masterAssignedAt: new Date().toISOString(),
          };
        }
      }

      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, ...updatedBooking } : b
        )
      );

      if (selectedBooking?.id === bookingId) {
        setSelectedBooking((prev) => ({ ...prev, ...updatedBooking }));
      }

      toast.success("Status uğurla yeniləndi");
    } catch (error) {
      console.error("Failed to update booking status:", error);
      toast.error("Status yenilənərkən xəta baş verdi");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleViewBooking = async (booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
    setIsModalLoading(true);

    try {
      const freshBooking = await fetchBookingById(booking.id);
      if (freshBooking) {
        setSelectedBooking(freshBooking);
        setBookings((prev) =>
          prev.map((b) => (b.id === booking.id ? { ...b, ...freshBooking } : b))
        );
      }
    } catch (error) {
      console.error("Failed to fetch booking details:", error);
      toast.error("Sifariş detalları yüklənərkən xəta baş verdi");
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
    setIsModalLoading(false);
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
    if (amount == null) return "-";
    return `${amount} ₼`;
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };

  const renderImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${import.meta.env.VITE_API_URL}${path}`;
  };

  const getMasterAssignedAt = (booking) =>
    booking?.masterAssignedAt || booking?.MasterAssignedAt || null;

  const getAssignedMasterName = (booking) =>
    booking?.assignedMasterName || booking?.AssignedMasterName || null;

  const getAssignedMasterPhone = (booking) =>
    booking?.assignedMasterPhone || booking?.AssignedMasterPhone || null;

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
              <th>№</th>
              <th>İstifadəçi</th>
              <th>E-mail</th>
              <th>Telefon</th>
              <th>Xidmət</th>
              <th>Qiymət</th>
              <th>Randevu</th>
              <th>Status</th>
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
            ) : paginatedBookings.length > 0 ? (
              paginatedBookings.map((booking, index) => (
                <tr key={booking.id}>
                  <td>
                    {ITEMS_PER_PAGE * (currentPage - 1) + index + 1}
                  </td>
                  <td>
                    {booking.user?.fullName || "-"}
                    {booking.user?.isCorporate && booking.user?.companyName
                      ? ` (${booking.user.companyName})`
                      : ""}
                  </td>
                  <td>{booking.user?.email || "-"}</td>
                  <td>{booking.user?.phone || "-"}</td>
                  <td>{booking.serviceName || "-"}</td>
                  <td className="amount-cell">
                    {formatCurrency(booking.price)}
                  </td>
                  <td>{formatDate(booking.appointmentDate)}</td>
                  <td>
                    <div className="status-cell">
                      <StatusDropdown
                        status={booking.status}
                        disabled={updatingStatusId === booking.id}
                        onChange={(newStatus) =>
                          updateBookingStatus(booking.id, newStatus)
                        }
                      />
                      <CountdownTimer
                        masterAssignedAt={getMasterAssignedAt(booking)}
                        status={booking.status}
                      />
                    </div>
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => handleViewBooking(booking)}
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

      {bookings.length > ITEMS_PER_PAGE && (
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

      {isModalOpen && selectedBooking && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Sifariş Detalları #{selectedBooking.id}</h2>
              <button
                type="button"
                className="close-button"
                onClick={handleCloseModal}
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              {isModalLoading ? (
                <div className="modal-loading">
                  <LoadingSpinner />
                </div>
              ) : (
                <>
                  <div className="order-detail-section">
                    <h3>Ümumi Məlumat</h3>
                    <div className="detail-row">
                      <span className="detail-label">Xidmət:</span>
                      <span className="detail-value">
                        {selectedBooking.serviceName || "-"}
                        {selectedBooking.serviceListName?.length > 0 && (
                          <ul className="service-list">
                            {selectedBooking.serviceListName.map((service, idx) => (
                              <li key={idx}>{service}</li>
                            ))}
                          </ul>
                        )}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Qiymət:</span>
                      <span className="detail-value">
                        {formatCurrency(selectedBooking.price)}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Randevu tarixi:</span>
                      <span className="detail-value">
                        {formatDate(selectedBooking.appointmentDate)}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Randevu vaxtı:</span>
                      <span className="detail-value">
                        {selectedBooking.appointmentSlot || "-"}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Status:</span>
                      <span className="detail-value status-detail-value">
                        <StatusDropdown
                          status={selectedBooking.status}
                          disabled={updatingStatusId === selectedBooking.id}
                          onChange={(newStatus) =>
                            updateBookingStatus(selectedBooking.id, newStatus)
                          }
                        />
                        <CountdownTimer
                          masterAssignedAt={getMasterAssignedAt(selectedBooking)}
                          status={selectedBooking.status}
                        />
                      </span>
                    </div>
                    {getMasterAssignedAt(selectedBooking) && (
                      <div className="detail-row">
                        <span className="detail-label">Usta təyin tarixi:</span>
                        <span className="detail-value">
                          {formatDate(getMasterAssignedAt(selectedBooking))}
                        </span>
                      </div>
                    )}
                    <div className="detail-row">
                      <span className="detail-label">Yaradılma tarixi:</span>
                      <span className="detail-value">
                        {formatDate(selectedBooking.createdAt)}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Qeyd:</span>
                      <span className="detail-value">
                        {selectedBooking.note || "-"}
                      </span>
                    </div>
                  </div>

                  {(getAssignedMasterName(selectedBooking) ||
                    getAssignedMasterPhone(selectedBooking)) && (
                    <div className="order-detail-section">
                      <h3>Təyin olunmuş usta</h3>
                      <div className="detail-row">
                        <span className="detail-label">Ad:</span>
                        <span className="detail-value">
                          {getAssignedMasterName(selectedBooking) || "-"}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Telefon:</span>
                        <span className="detail-value">
                          {getAssignedMasterPhone(selectedBooking) || "-"}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="order-detail-section">
                    <h3>İstifadəçi Məlumatları</h3>
                    <div className="detail-row">
                      <span className="detail-label">Ad:</span>
                      <span className="detail-value">
                        {selectedBooking.user?.fullName || "-"}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">E-mail:</span>
                      <span className="detail-value">
                        {selectedBooking.user?.email || "-"}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Telefon:</span>
                      <span className="detail-value">
                        {selectedBooking.user?.phone || "-"}
                      </span>
                    </div>
                    {selectedBooking.user?.isCorporate && (
                      <div className="detail-row">
                        <span className="detail-label">Şirkət:</span>
                        <span className="detail-value">
                          {selectedBooking.user?.companyName || "-"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="order-detail-section">
                    <h3>Ünvan Məlumatları</h3>
                    <div className="detail-row">
                      <span className="detail-label">Küçə:</span>
                      <span className="detail-value">
                        {selectedBooking.street || "-"}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Məkan növü:</span>
                      <span className="detail-value">
                        {selectedBooking.locationType || "-"}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Giriş:</span>
                      <span className="detail-value">
                        {selectedBooking.entrance || "-"}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Mərtəbə:</span>
                      <span className="detail-value">
                        {selectedBooking.floor || "-"}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Mənzil:</span>
                      <span className="detail-value">
                        {selectedBooking.apartment || "-"}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">İşarə:</span>
                      <span className="detail-value">
                        {selectedBooking.landmark || "-"}
                      </span>
                    </div>
                  </div>

                  {selectedBooking.selectedProducts?.length > 0 && (
                    <div className="order-detail-section">
                      <h3>Seçilmiş Məhsullar</h3>
                      <div className="products-list">
                        {selectedBooking.selectedProducts.map((product, idx) => (
                          <div key={product.id || idx} className="product-item">
                            {product.imagePath && (
                              <div className="product-image">
                                <img
                                  src={renderImageUrl(product.imagePath)}
                                  alt={product.nameAz || "Məhsul"}
                                />
                              </div>
                            )}
                            <div className="product-details">
                              <div className="detail-row">
                                <span className="detail-label">Məhsul:</span>
                                <span className="detail-value">
                                  {product.nameAz || "-"}
                                </span>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label">Qiymət:</span>
                                <span className="detail-value">
                                  {formatCurrency(product.price)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(selectedBooking.images?.length > 0 ||
                    selectedBooking.productImagePath) && (
                    <div className="order-detail-section">
                      <h3>Şəkillər</h3>
                      <div className="booking-images">
                        {selectedBooking.productImagePath && (
                          <div className="booking-image-item">
                            <img
                              src={renderImageUrl(
                                selectedBooking.productImagePath
                              )}
                              alt="Məhsul şəkli"
                            />
                          </div>
                        )}
                        {selectedBooking.images?.map((img) => (
                          <div key={img.id} className="booking-image-item">
                            <img
                              src={renderImageUrl(img.imagePath)}
                              alt={`Şəkil ${img.id}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedBooking.productLink && (
                    <div className="order-detail-section">
                      <h3>Məhsul Linki</h3>
                      <div className="detail-row">
                        <a
                          href={selectedBooking.productLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="product-link"
                        >
                          {selectedBooking.productLink}
                        </a>
                      </div>
                    </div>
                  )}
                </>
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
