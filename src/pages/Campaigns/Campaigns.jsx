import React, { useEffect, useState } from "react";
import axios from "axios";
import { useCookies } from "react-cookie";
import { Switch } from "antd";
import "./Campaigns.scss";
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner";

const initialFormData = {
    titleAz: "",
    titleEn: "",
    titleRu: "",
    descriptionAz: "",
    descriptionEn: "",
    descriptionRu: "",
    imageFile: null,
    individualPrice: "",
    corporatePrice: "",
    isActive: true,
};

const Campaigns = () => {
    const [cookies] = useCookies(["token"]);
    const token = cookies?.token;
    const authHeaders = token
        ? {
            Authorization: `Bearer ${token}`,
        }
        : {};

    const [campaigns, setCampaigns] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
    const [imagePreview, setImagePreview] = useState(null);

    const fetchCampaigns = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/Services/campaigns`);
            setCampaigns(Array.isArray(response?.data) ? response.data : []);
        } catch (error) {
            console.error("Failed to fetch campaigns:", error);
            setCampaigns([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
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
            imageFile: file,
        }));
        setImagePreview(URL.createObjectURL(file));
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingCampaign(null);
        setFormData(initialFormData);
        setImagePreview(null);
    };

    const openAddModal = () => {
        setEditingCampaign(null);
        setFormData(initialFormData);
        setImagePreview(null);
        setIsModalOpen(true);
    };

    const openEditModal = (campaign) => {
        setEditingCampaign(campaign);
        setFormData({
            titleAz: campaign?.titleAz || "",
            titleEn: campaign?.titleEn || "",
            titleRu: campaign?.titleRu || "",
            descriptionAz: campaign?.descriptionAz || "",
            descriptionEn: campaign?.descriptionEn || "",
            descriptionRu: campaign?.descriptionRu || "",
            imageFile: null,
            individualPrice: campaign?.individualPrice ?? campaign?.price ?? "",
            corporatePrice: campaign?.corporatePrice ?? "",
            isActive: campaign?.isActive ?? true,
        });
        setImagePreview(
            campaign?.imageUrl ? `${import.meta.env.VITE_API_URL}${campaign.imageUrl}` : null
        );
        setIsModalOpen(true);
    };

    const uploadImageAndGetUrl = async (file) => {
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

        const imageUrl = uploadResponse?.data?.url;
        if (!imageUrl) {
            throw new Error("Upload response does not include url");
        }

        return imageUrl;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.imageFile && !editingCampaign?.imageUrl) {
            alert("Zəhmət olmasa şəkil seçin.");
            return;
        }

        setIsSubmitting(true);
        try {
            let imageUrl = editingCampaign?.imageUrl || null;
            if (formData.imageFile) {
                imageUrl = await uploadImageAndGetUrl(formData.imageFile);
            }

            const payload = {
                titleAz: formData.titleAz.trim(),
                titleEn: formData.titleEn.trim(),
                titleRu: formData.titleRu.trim(),
                descriptionAz: formData.descriptionAz.trim(),
                descriptionEn: formData.descriptionEn.trim(),
                descriptionRu: formData.descriptionRu.trim(),
                imageUrl,
                individualPrice: Number(formData.individualPrice),
                corporatePrice: Number(formData.corporatePrice),
                isActive: formData.isActive,
            };

            if (editingCampaign?.id) {
                await axios.put(
                    `${import.meta.env.VITE_API_URL}/api/Services/campaign/${editingCampaign.id}`,
                    payload,
                    { headers: authHeaders }
                );
            } else {
                await axios.post(
                    `${import.meta.env.VITE_API_URL}/api/Services/campaign`,
                    payload,
                    { headers: authHeaders }
                );
            }

            await fetchCampaigns();
            handleModalClose();
        } catch (error) {
            console.error("Failed to save campaign:", error);
            alert(`Kampaniya ${editingCampaign ? "yenilənmədi" : "yaradılmadı"}. Xəta baş verdi.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bu kampaniyanı silməyə əminsiniz?")) return;
        try {
            await axios.delete(
                `${import.meta.env.VITE_API_URL}/api/Services/campaign/${id}`,
                { headers: authHeaders }
            );
            await fetchCampaigns();
        } catch (error) {
            console.error("Failed to delete campaign:", error);
            alert("Kampaniya silinmədi. Xəta baş verdi.");
        }
    };

    const getImageSrc = (imageUrl) => {
        if (!imageUrl) return null;
        if (imageUrl.startsWith("http")) return imageUrl;
        return `${import.meta.env.VITE_API_URL}${imageUrl}`;
    };

    return (
        <div className="campaigns-page-section">
            <div className="top-section">
                <div className="title-section">
                    <h1>Kampaniyalar</h1>
                </div>
                <div className="button-section">
                    <button className="addition-button" onClick={openAddModal}>
                        + Əlavə et
                    </button>
                </div>
            </div>

            <div className="table-wrapper">
                <table className="campaigns-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Şəkil</th>
                            <th>Başlıq (AZ)</th>
                            <th>Təsvir (AZ)</th>
                            <th>Qiymət</th>
                            <th>Status</th>
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
                        ) : campaigns.length > 0 ? (
                            campaigns.map((campaign) => (
                                <tr key={campaign.id}>
                                    <td>{campaign.id}</td>
                                    <td>
                                        {campaign.imageUrl ? (
                                            <img
                                                className="campaign-image"
                                                src={getImageSrc(campaign.imageUrl)}
                                                alt={campaign.titleAz || "Campaign"}
                                            />
                                        ) : (
                                            <span className="no-image">Yoxdur</span>
                                        )}
                                    </td>
                                    <td>{campaign.titleAz || "-"}</td>
                                    <td className="description-cell">
                                        {campaign.descriptionAz || "-"}
                                    </td>
                                    <td>
                                        {campaign.individualPrice ?? campaign.price ?? "-"}
                                        {campaign.corporatePrice != null && (
                                            <span className="price-sub">
                                                / {campaign.corporatePrice} (korporativ)
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`status-badge ${campaign.isActive !== false ? "active" : "inactive"}`}>
                                            {campaign.isActive !== false ? "Aktiv" : "Deaktiv"}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="actions-cell">
                                            <button
                                                type="button"
                                                className="table-action-btn edit"
                                                onClick={() => openEditModal(campaign)}
                                            >
                                                Redaktə
                                            </button>
                                            <button
                                                type="button"
                                                className="table-action-btn delete"
                                                onClick={() => handleDelete(campaign.id)}
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
                                    Kampaniya tapılmadı
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
                            <h2>{editingCampaign ? "Kampaniyanı Dəyişdir" : "Yeni Kampaniya"}</h2>
                            <button className="close-button" onClick={handleModalClose}>
                                &times;
                            </button>
                        </div>
                        <form className="modal-body" onSubmit={handleSubmit}>
                            <div className="form-section">
                                <h3 className="form-section-title">Başlıq</h3>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label htmlFor="titleAz">Başlıq (AZ) *</label>
                                        <input
                                            id="titleAz"
                                            name="titleAz"
                                            type="text"
                                            value={formData.titleAz}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="titleEn">Başlıq (EN) *</label>
                                        <input
                                            id="titleEn"
                                            name="titleEn"
                                            type="text"
                                            value={formData.titleEn}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="titleRu">Başlıq (RU) *</label>
                                        <input
                                            id="titleRu"
                                            name="titleRu"
                                            type="text"
                                            value={formData.titleRu}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-section">
                                <h3 className="form-section-title">Təsvir</h3>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label htmlFor="descriptionAz">Təsvir (AZ) *</label>
                                        <textarea
                                            id="descriptionAz"
                                            name="descriptionAz"
                                            value={formData.descriptionAz}
                                            onChange={handleInputChange}
                                            rows={3}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="descriptionEn">Təsvir (EN) *</label>
                                        <textarea
                                            id="descriptionEn"
                                            name="descriptionEn"
                                            value={formData.descriptionEn}
                                            onChange={handleInputChange}
                                            rows={3}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="descriptionRu">Təsvir (RU) *</label>
                                        <textarea
                                            id="descriptionRu"
                                            name="descriptionRu"
                                            value={formData.descriptionRu}
                                            onChange={handleInputChange}
                                            rows={3}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-section">
                                <h3 className="form-section-title">Qiymət və status</h3>
                                <div className="form-grid form-grid-2">
                                    <div className="form-group">
                                        <label htmlFor="individualPrice">Fərdi qiymət *</label>
                                        <input
                                            id="individualPrice"
                                            name="individualPrice"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={formData.individualPrice}
                                            onChange={handleInputChange}
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
                                            value={formData.corporatePrice}
                                            onChange={handleInputChange}
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-group switch-group">
                                    <label>Aktiv</label>
                                    <Switch
                                        checked={formData.isActive}
                                        onChange={(checked) =>
                                            setFormData((prev) => ({ ...prev, isActive: checked }))
                                        }
                                    />
                                </div>
                            </div>

                            <div className="form-section">
                                <h3 className="form-section-title">Şəkil</h3>
                                <div className="form-group">
                                    <label htmlFor="imageUrl">Kampaniya şəkli {!editingCampaign && "*"}</label>
                                    <input
                                        id="imageUrl"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        required={!editingCampaign}
                                    />
                                    {imagePreview && (
                                        <img className="preview-image" src={imagePreview} alt="Preview" />
                                    )}
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" onClick={handleModalClose}>
                                    İmtina
                                </button>
                                <button type="submit" className="primary" disabled={isSubmitting}>
                                    {isSubmitting ? "Göndərilir..." : editingCampaign ? "Dəyişdir" : "Yarat"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Campaigns;
