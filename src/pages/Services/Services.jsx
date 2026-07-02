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

    const handleDelete = async (id) => {
        if (!window.confirm("Bu kateqoriyanı silməyə əminsiniz?")) return;
        try {
            await axios.delete(
                `${import.meta.env.VITE_API_URL}/api/Services/category/${id}`,
                { headers: authHeaders }
            );
            await fetchServices();
        } catch (error) {
            console.error("Failed to delete service category:", error);
            alert("Kateqoriya silinmədi. Xəta baş verdi.");
        }
    };

    return (
        <div className="services-page-section">
            <div className="top-section">
                <div className="title-section">
                    <h1>Services</h1>
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
                            <th>Paket sayı</th>
                            <th>Əməliyyatlar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan="7" className="loading-cell">
                                    <LoadingSpinner />
                                </td>
                            </tr>
                        ) : services.length > 0 ? (
                            services.map((service) => (
                                <tr key={service.id}>
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
                                    <td>{Array.isArray(service.packages) ? service.packages.length : 0}</td>
                                    <td>
                                        <div className="actions-cell">
                                            <button
                                                type="button"
                                                className="table-action-btn edit"
                                                onClick={() => openEditModal(service)}
                                            >
                                                Redaktə et
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
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="no-data-cell">
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
        </div>
    );
};

export default Services;
