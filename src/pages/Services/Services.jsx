import React, { useEffect, useState } from "react";
import axios from "axios";
import { useCookies } from "react-cookie";
import "./Services.scss";
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner";

const initialFormData = {
    nameAz: "",
    nameEn: "",
    nameRu: "",
    iconFile: null,
};

const initialItemFormData = {
    titleAz: "",
    titleEn: "",
    titleRu: "",
    individualPrice: "",
    corporatePrice: "",
};

const Services = () => {
    const [cookies] = useCookies(["token"]);
    const token = cookies?.token;
    const authHeaders = token
        ? {
            Authorization: `Bearer ${token}`,
        }
        : {};

    const [services, setServices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
    const [imagePreview, setImagePreview] = useState(null);

    const [expandedServiceId, setExpandedServiceId] = useState(null);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [isItemSubmitting, setIsItemSubmitting] = useState(false);
    const [activeService, setActiveService] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    const [itemFormData, setItemFormData] = useState(initialItemFormData);

    const fetchServices = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/Services`);
            setServices(Array.isArray(response?.data) ? response.data : []);
        } catch (error) {
            console.error("Failed to fetch services:", error);
            setServices([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleItemInputChange = (e) => {
        const { name, value } = e.target;
        setItemFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
        if (!validTypes.includes(file.type)) {
            alert("Yalnız şəkil faylları qəbul edilir (jpeg, png, gif, webp, svg).");
            return;
        }

        setFormData((prev) => ({
            ...prev,
            iconFile: file,
        }));
        setImagePreview(URL.createObjectURL(file));
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingService(null);
        setFormData(initialFormData);
        setImagePreview(null);
    };

    const handleItemModalClose = () => {
        setIsItemModalOpen(false);
        setActiveService(null);
        setEditingItem(null);
        setItemFormData(initialItemFormData);
    };

    const openAddModal = () => {
        setEditingService(null);
        setFormData(initialFormData);
        setImagePreview(null);
        setIsModalOpen(true);
    };

    const openEditModal = (service) => {
        setEditingService(service);
        setFormData({
            nameAz: service?.nameAz || "",
            nameEn: service?.nameEn || "",
            nameRu: service?.nameRu || "",
            iconFile: null,
        });
        setImagePreview(
            service?.iconPath ? `${import.meta.env.VITE_API_URL}${service.iconPath}` : null
        );
        setIsModalOpen(true);
    };

    const openAddItemModal = (service) => {
        setActiveService(service);
        setEditingItem(null);
        setItemFormData(initialItemFormData);
        setIsItemModalOpen(true);
    };

    const openEditItemModal = (service, item) => {
        setActiveService(service);
        setEditingItem(item);
        setItemFormData({
            titleAz: item?.titleAz || "",
            titleEn: item?.titleEn || "",
            titleRu: item?.titleRu || "",
            individualPrice: item?.individualPrice ?? "",
            corporatePrice: item?.corporatePrice ?? "",
        });
        setIsItemModalOpen(true);
    };

    const toggleExpand = (serviceId) => {
        setExpandedServiceId((prev) => (prev === serviceId ? null : serviceId));
    };

    const uploadIconAndGetPath = async (file) => {
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);

        const uploadResponse = await axios.post(
            `${import.meta.env.VITE_API_URL}/api/Upload`,
            uploadFormData,
            {
                headers: {
                    ...authHeaders,
                    "Content-Type": "multipart/form-data",
                },
            }
        );

        const iconUrl = uploadResponse?.data?.url;
        if (!iconUrl) {
            throw new Error("Upload response does not include url");
        }

        return iconUrl;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.iconFile && !editingService?.iconPath) {
            alert("Zəhmət olmasa icon şəkli seçin.");
            return;
        }

        setIsSubmitting(true);
        try {
            let iconPath = editingService?.iconPath || null;
            if (formData.iconFile) {
                iconPath = await uploadIconAndGetPath(formData.iconFile);
            }
            const payload = {
                nameAz: formData.nameAz.trim(),
                nameEn: formData.nameEn.trim(),
                nameRu: formData.nameRu.trim(),
                iconPath,
            };

            if (editingService?.id) {
                await axios.put(
                    `${import.meta.env.VITE_API_URL}/api/Services/category/${editingService.id}`,
                    payload,
                    { headers: authHeaders }
                );
            } else {
                await axios.post(
                    `${import.meta.env.VITE_API_URL}/api/Services/category`,
                    payload,
                    { headers: authHeaders }
                );
            }

            await fetchServices();
            handleModalClose();
        } catch (error) {
            console.error("Failed to save service category:", error);
            alert(`Kateqoriya ${editingService ? "yenilənmədi" : "yaradılmadı"}. Xəta baş verdi.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleItemSubmit = async (e) => {
        e.preventDefault();
        if (!activeService?.id) return;

        setIsItemSubmitting(true);
        try {
            const payload = {
                serviceCategoryId: activeService.id,
                titleAz: itemFormData.titleAz.trim(),
                titleEn: itemFormData.titleEn.trim(),
                titleRu: itemFormData.titleRu.trim(),
                individualPrice: Number(itemFormData.individualPrice),
                corporatePrice: Number(itemFormData.corporatePrice),
            };

            if (editingItem?.id) {
                await axios.put(
                    `${import.meta.env.VITE_API_URL}/api/Services/item/${editingItem.id}`,
                    payload,
                    { headers: authHeaders }
                );
            } else {
                await axios.post(
                    `${import.meta.env.VITE_API_URL}/api/Services/item`,
                    payload,
                    { headers: authHeaders }
                );
            }

            await fetchServices();
            handleItemModalClose();
        } catch (error) {
            console.error("Failed to save service item:", error);
            alert(`Item ${editingItem ? "yenilənmədi" : "yaradılmadı"}. Xəta baş verdi.`);
        } finally {
            setIsItemSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bu kateqoriyanı silməyə əminsiniz?")) return;
        try {
            await axios.delete(
                `${import.meta.env.VITE_API_URL}/api/Services/category/${id}`,
                { headers: authHeaders }
            );
            if (expandedServiceId === id) {
                setExpandedServiceId(null);
            }
            await fetchServices();
        } catch (error) {
            console.error("Failed to delete service category:", error);
            alert("Kateqoriya silinmədi. Xəta baş verdi.");
        }
    };

    const handleDeleteItem = async (itemId) => {
        if (!window.confirm("Bu item-i silməyə əminsiniz?")) return;
        try {
            await axios.delete(
                `${import.meta.env.VITE_API_URL}/api/Services/item/${itemId}`,
                { headers: authHeaders }
            );
            await fetchServices();
        } catch (error) {
            console.error("Failed to delete service item:", error);
            alert("Item silinmədi. Xəta baş verdi.");
        }
    };

    return (
        <div className="services-page-section">
            <div className="top-section">
                <div className="title-section">
                    <h1>Xidmətlər</h1>
                </div>
                <div className="button-section">
                    <button className="addition-button" onClick={openAddModal}>
                        + Əlavə et
                    </button>
                </div>
            </div>

            <div className="table-wrapper">
                <table className="services-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Icon</th>
                            <th>Ad (AZ)</th>
                            <th>Ad (EN)</th>
                            <th>Ad (RU)</th>
                            <th>Item sayı</th>
                            <th>Paket sayı</th>
                            <th>Əməliyyatlar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan="8" className="loading-cell">
                                    <LoadingSpinner />
                                </td>
                            </tr>
                        ) : services.length > 0 ? (
                            services.map((service) => {
                                const serviceItems = Array.isArray(service.services) ? service.services : [];
                                const isExpanded = expandedServiceId === service.id;

                                return (
                                    <React.Fragment key={service.id}>
                                        <tr>
                                            <td>{service.id}</td>
                                            <td>
                                                {service.iconPath ? (
                                                    <img
                                                        className="service-icon"
                                                        src={`${import.meta.env.VITE_API_URL}${service.iconPath}`}
                                                        alt={service.nameAz || "Service icon"}
                                                    />
                                                ) : (
                                                    <span className="no-icon">Yoxdur</span>
                                                )}
                                            </td>
                                            <td>{service.nameAz || "-"}</td>
                                            <td>{service.nameEn || "-"}</td>
                                            <td>{service.nameRu || "-"}</td>
                                            <td>{serviceItems.length}</td>
                                            <td>{Array.isArray(service.packages) ? service.packages.length : 0}</td>
                                            <td>
                                                <div className="actions-cell">
                                                    <button
                                                        type="button"
                                                        className="table-action-btn items"
                                                        onClick={() => toggleExpand(service.id)}
                                                    >
                                                        {isExpanded ? "Gizlət" : "Alt xidmətlər"}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="table-action-btn add-item"
                                                        onClick={() => openAddItemModal(service)}
                                                    >
                                                        + Alt xidmət
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="table-action-btn edit"
                                                        onClick={() => openEditModal(service)}
                                                    >
                                                        Redaktə
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="table-action-btn delete"
                                                        onClick={() => handleDelete(service.id)}
                                                    >
                                                        Sil
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr className="items-row">
                                                <td colSpan="8">
                                                    <div className="items-section">
                                                        <div className="items-section-header">
                                                            <h4>{service.nameAz} — Alt xidmətlər</h4>
                                                            <button
                                                                type="button"
                                                                className="table-action-btn add-item"
                                                                onClick={() => openAddItemModal(service)}
                                                            >
                                                                + Alt xidmət əlavə et
                                                            </button>
                                                        </div>
                                                        {serviceItems.length > 0 ? (
                                                            <table className="items-table">
                                                                <thead>
                                                                    <tr>
                                                                        <th>ID</th>
                                                                        <th>Başlıq (AZ)</th>
                                                                        <th>Başlıq (EN)</th>
                                                                        <th>Başlıq (RU)</th>
                                                                        <th>Fərdi qiymət</th>
                                                                        <th>Korporativ qiymət</th>
                                                                        <th>Əməliyyatlar</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {serviceItems.map((item) => (
                                                                        <tr key={item.id}>
                                                                            <td>{item.id}</td>
                                                                            <td>{item.titleAz || "-"}</td>
                                                                            <td>{item.titleEn || "-"}</td>
                                                                            <td>{item.titleRu || "-"}</td>
                                                                            <td>{item.individualPrice ?? "-"}</td>
                                                                            <td>{item.corporatePrice ?? "-"}</td>
                                                                            <td>
                                                                                <div className="actions-cell">
                                                                                    <button
                                                                                        type="button"
                                                                                        className="table-action-btn edit"
                                                                                        onClick={() => openEditItemModal(service, item)}
                                                                                    >
                                                                                        Redaktə
                                                                                    </button>
                                                                                    <button
                                                                                        type="button"
                                                                                        className="table-action-btn delete"
                                                                                        onClick={() => handleDeleteItem(item.id)}
                                                                                    >
                                                                                        Sil
                                                                                    </button>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        ) : (
                                                            <p className="no-items-text">Bu kateqoriyada hələ item yoxdur.</p>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="8" className="no-data-cell">
                                    Service tapılmadı
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="modal-overlay" onClick={handleModalClose}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingService ? "Service Kateqoriyasını Dəyişdir" : "Yeni Service Kateqoriyası"}</h2>
                            <button className="close-button" onClick={handleModalClose}>
                                &times;
                            </button>
                        </div>
                        <form className="modal-body" onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label htmlFor="nameAz">Ad (AZ) *</label>
                                    <input
                                        id="nameAz"
                                        name="nameAz"
                                        type="text"
                                        value={formData.nameAz}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="nameEn">Ad (EN) *</label>
                                    <input
                                        id="nameEn"
                                        name="nameEn"
                                        type="text"
                                        value={formData.nameEn}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="nameRu">Ad (RU) *</label>
                                    <input
                                        id="nameRu"
                                        name="nameRu"
                                        type="text"
                                        value={formData.nameRu}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="iconPath">Icon şəkli {!editingService && "*"}</label>
                                <input
                                    id="iconPath"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    required={!editingService}
                                />
                                {imagePreview && (
                                    <img className="preview-image" src={imagePreview} alt="Preview" />
                                )}
                            </div>

                            <div className="modal-footer">
                                <button type="button" onClick={handleModalClose}>
                                    İmtina
                                </button>
                                <button type="submit" className="primary" disabled={isSubmitting}>
                                    {isSubmitting ? "Göndərilir..." : editingService ? "Dəyişdir" : "Yarat"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isItemModalOpen && (
                <div className="modal-overlay" onClick={handleItemModalClose}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>
                                {editingItem ? "Alt xidmət-i Dəyişdir" : "Yeni Alt xidmət"} — {activeService?.nameAz}
                            </h2>
                            <button className="close-button" onClick={handleItemModalClose}>
                                &times;
                            </button>
                        </div>
                        <form className="modal-body" onSubmit={handleItemSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label htmlFor="titleAz">Başlıq (AZ) *</label>
                                    <input
                                        id="titleAz"
                                        name="titleAz"
                                        type="text"
                                        value={itemFormData.titleAz}
                                        onChange={handleItemInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="titleEn">Başlıq (EN) *</label>
                                    <input
                                        id="titleEn"
                                        name="titleEn"
                                        type="text"
                                        value={itemFormData.titleEn}
                                        onChange={handleItemInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="titleRu">Başlıq (RU) *</label>
                                    <input
                                        id="titleRu"
                                        name="titleRu"
                                        type="text"
                                        value={itemFormData.titleRu}
                                        onChange={handleItemInputChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-grid form-grid-2">
                                <div className="form-group">
                                    <label htmlFor="individualPrice">Fərdi qiymət *</label>
                                    <input
                                        id="individualPrice"
                                        name="individualPrice"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={itemFormData.individualPrice}
                                        onChange={handleItemInputChange}
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="corporatePrice">Korporativ qiymət *</label>
                                    <input
                                        id="corporatePrice"
                                        name="corporatePrice"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={itemFormData.corporatePrice}
                                        onChange={handleItemInputChange}
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" onClick={handleItemModalClose}>
                                    İmtina
                                </button>
                                <button type="submit" className="primary" disabled={isItemSubmitting}>
                                    {isItemSubmitting ? "Göndərilir..." : editingItem ? "Dəyişdir" : "Əlavə et"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Services;
