import React, { useEffect, useMemo, useState } from "react";
import "./Packages.scss";
import axios from "axios";
import { useCookies } from "react-cookie";
import { Select } from "antd";
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner";

const ITEMS_PER_PAGE = 20;

const initialFormData = {
    serviceCategoryId: "general",
    nameAz: "",
    nameEn: "",
    nameRu: "",
    monthlyPrice: "",
    quarterlyPrice: "",
    yearlyPrice: "",
    monthlyCorporatePrice: "",
    quarterlyCorporatePrice: "",
    yearlyCorporatePrice: "",
    featuresAz: "",
    featuresEn: "",
    featuresRu: "",
};

const Packages = () => {
    const [cookies] = useCookies(["token"]);
    const token = cookies?.token;
    const headers = {
        Authorization: `Bearer ${token}`,
    };

    const [packages, setPackages] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
    const [currentPage, setCurrentPage] = useState(1);

    const categoryNameMap = useMemo(() => {
        return categories.reduce((acc, category) => {
            acc[category.id] = category.nameAz || category.nameEn || category.nameRu || `ID: ${category.id}`;
            return acc;
        }, {});
    }, [categories]);

    const totalPages = Math.max(1, Math.ceil(packages.length / ITEMS_PER_PAGE));
    const paginatedPackages = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        return packages.slice(start, end);
    }, [packages, currentPage]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [packagesResponse, categoriesResponse] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/Services/packages/all`, { headers }),
                axios.get(`${import.meta.env.VITE_API_URL}/api/Services`, { headers }),
            ]);

            setPackages(Array.isArray(packagesResponse?.data) ? packagesResponse.data : []);
            setCategories(Array.isArray(categoriesResponse?.data) ? categoriesResponse.data : []);
        } catch (error) {
            console.error("Failed to fetch packages or categories:", error);
            setPackages([]);
            setCategories([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleCategoryChange = (value) => {
        setFormData((prev) => ({
            ...prev,
            serviceCategoryId: value,
        }));
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingPackage(null);
        setFormData(initialFormData);
    };

    const openAddModal = () => {
        setEditingPackage(null);
        setFormData(initialFormData);
        setIsModalOpen(true);
    };

    const openEditModal = (pkg) => {
        setEditingPackage(pkg);
        setFormData({
            serviceCategoryId: pkg?.serviceCategoryId == null ? "general" : String(pkg.serviceCategoryId),
            nameAz: pkg?.nameAz || "",
            nameEn: pkg?.nameEn || "",
            nameRu: pkg?.nameRu || "",
            monthlyPrice: pkg?.monthlyPrice ?? "",
            quarterlyPrice: pkg?.quarterlyPrice ?? "",
            yearlyPrice: pkg?.yearlyPrice ?? "",
            monthlyCorporatePrice: pkg?.monthlyCorporatePrice ?? "",
            quarterlyCorporatePrice: pkg?.quarterlyCorporatePrice ?? "",
            yearlyCorporatePrice: pkg?.yearlyCorporatePrice ?? "",
            featuresAz: pkg?.featuresAz || "",
            featuresEn: pkg?.featuresEn || "",
            featuresRu: pkg?.featuresRu || "",
        });
        setIsModalOpen(true);
    };

    const buildPayload = () => ({
        serviceCategoryId: formData.serviceCategoryId === "general" ? null : Number(formData.serviceCategoryId),
        nameAz: formData.nameAz.trim(),
        nameEn: formData.nameEn.trim(),
        nameRu: formData.nameRu.trim(),
        monthlyPrice: Number(formData.monthlyPrice),
        quarterlyPrice: Number(formData.quarterlyPrice),
        yearlyPrice: Number(formData.yearlyPrice),
        monthlyCorporatePrice: Number(formData.monthlyCorporatePrice),
        quarterlyCorporatePrice: Number(formData.quarterlyCorporatePrice),
        yearlyCorporatePrice: Number(formData.yearlyCorporatePrice),
        featuresAz: formData.featuresAz.trim(),
        featuresEn: formData.featuresEn.trim(),
        featuresRu: formData.featuresRu.trim(),
    });

    const handleSubmitPackage = async (e) => {
        e.preventDefault();
        const isEditMode = Boolean(editingPackage?.id);
        const packageId = editingPackage?.id;
        setIsSubmitting(true);

        try {
            const payload = buildPayload();
            if (isEditMode) {
                await axios.put(
                    `${import.meta.env.VITE_API_URL}/api/Services/package/${packageId}`,
                    payload,
                    { headers }
                );
            } else {
                await axios.post(
                    `${import.meta.env.VITE_API_URL}/api/Services/package`,
                    payload,
                    { headers }
                );
            }

            await fetchData();
            handleModalClose();
        } catch (error) {
            console.error(`Failed to ${isEditMode ? "update" : "create"} package:`, error);
            alert(`Paket ${isEditMode ? "yenilənmədi" : "yaradılmadı"}. Xəta baş verdi.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Silməyə əminsiniz?")) return;
        try {
            await axios.delete(
                `${import.meta.env.VITE_API_URL}/api/Services/package/${id}`,
                { headers }
            );
            await fetchData();
        } catch (error) {
            console.error("Failed to delete package:", error);
            alert("Paket silinmədi. Xəta baş verdi.");
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > totalPages) return;
        setCurrentPage(newPage);
    };

    const categoryOptions = [
        { value: "general", label: "Ümumi" },
        ...categories.map((category) => ({
            value: String(category.id),
            label: category.nameAz || category.nameEn || category.nameRu || `ID: ${category.id}`,
        })),
    ];

    return (
        <div className="blogs-page-section">
            <div className="top-section">
                <div className="title-section">
                    <h1>Paketlər</h1>
                </div>
                <div className="button-section">
                    <button className="addition-button" onClick={openAddModal}>
                        + Əlavə et
                    </button>
                </div>
            </div>

            <div className="table-wrapper">
                <table className="catering-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Kateqoriya</th>
                            <th>Ad (AZ)</th>
                            <th>Aylıq</th>
                            <th>Rüblük</th>
                            <th>İllik</th>
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
                        ) : paginatedPackages.length > 0 ? (
                            paginatedPackages.map((pkg, index) => (
                                <tr key={pkg.id}>
                                    <td>
                                        {((currentPage - 1) * ITEMS_PER_PAGE) + index + 1}
                                    </td>
                                    <td>
                                        {pkg.serviceCategoryId == null
                                            ? "Ümumi"
                                            : (categoryNameMap[pkg.serviceCategoryId] || `ID: ${pkg.serviceCategoryId}`)}
                                    </td>
                                    <td>{pkg.nameAz || "-"}</td>
                                    <td>{pkg.monthlyPrice ?? "-"}</td>
                                    <td>{pkg.quarterlyPrice ?? "-"}</td>
                                    <td>{pkg.yearlyPrice ?? "-"}</td>
                                    <td>
                                        <div className="d-flex gap-2">
                                            <button
                                                className="btn btn-outline-dark"
                                                onClick={() => openEditModal(pkg)}
                                            >
                                                Redaktə et
                                            </button>
                                            <button
                                                className="btn btn-danger"
                                                onClick={() => handleDelete(pkg.id)}
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
                                    Paket tapılmadı
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

            {isModalOpen && (
                <div className="modal-overlay" onClick={handleModalClose}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingPackage ? "Paketi Dəyişdir" : "Yeni Paket"}</h2>
                            <button className="close-button" onClick={handleModalClose}>
                                &times;
                            </button>
                        </div>
                        <form className="modal-body" onSubmit={handleSubmitPackage}>
                            <div className="form-section">
                                <h3 className="form-section-title">Əsas məlumat</h3>
                                <div className="form-group">
                                    <label htmlFor="serviceCategoryId">Kateqoriya *</label>
                                    <Select
                                        id="serviceCategoryId"
                                        className="package-category-select"
                                        value={formData.serviceCategoryId}
                                        onChange={handleCategoryChange}
                                        options={categoryOptions}
                                        placeholder="Kateqoriya seçin"
                                        showSearch
                                        optionFilterProp="label"
                                        size="large"
                                    />
                                </div>

                                <div className="form-grid">
                                    <div className="form-group">
                                        <label htmlFor="nameAz">Ad (AZ) *</label>
                                        <input
                                            id="nameAz"
                                            name="nameAz"
                                            type="text"
                                            value={formData.nameAz}
                                            onChange={handleInputChange}
                                            placeholder="Paket adı (AZ)"
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
                                            placeholder="Package name (EN)"
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
                                            placeholder="Название пакета (RU)"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-section">
                                <h3 className="form-section-title">Qiymətlər</h3>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label htmlFor="monthlyPrice">Aylıq qiymət *</label>
                                        <input
                                            id="monthlyPrice"
                                            name="monthlyPrice"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={formData.monthlyPrice}
                                            onChange={handleInputChange}
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="quarterlyPrice">Rüblük qiymət *</label>
                                        <input
                                            id="quarterlyPrice"
                                            name="quarterlyPrice"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={formData.quarterlyPrice}
                                            onChange={handleInputChange}
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="yearlyPrice">İllik qiymət *</label>
                                        <input
                                            id="yearlyPrice"
                                            name="yearlyPrice"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={formData.yearlyPrice}
                                            onChange={handleInputChange}
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-section">
                                <h3 className="form-section-title">Korporativ qiymətlər</h3>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label htmlFor="monthlyCorporatePrice">Aylıq korporativ *</label>
                                        <input
                                            id="monthlyCorporatePrice"
                                            name="monthlyCorporatePrice"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={formData.monthlyCorporatePrice}
                                            onChange={handleInputChange}
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="quarterlyCorporatePrice">Rüblük korporativ *</label>
                                        <input
                                            id="quarterlyCorporatePrice"
                                            name="quarterlyCorporatePrice"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={formData.quarterlyCorporatePrice}
                                            onChange={handleInputChange}
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="yearlyCorporatePrice">İllik korporativ *</label>
                                        <input
                                            id="yearlyCorporatePrice"
                                            name="yearlyCorporatePrice"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={formData.yearlyCorporatePrice}
                                            onChange={handleInputChange}
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-section">
                                <h3 className="form-section-title">Xüsusiyyətlər</h3>
                                <p className="field-info">
                                    Hər xüsusiyyəti vergüllə ayırın. Məsələn: <em>24/7 dəstək, Pulsuz çağırış, Prioritet xidmət</em>
                                </p>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label htmlFor="featuresAz">Xüsusiyyətlər (AZ) *</label>
                                        <textarea
                                            id="featuresAz"
                                            name="featuresAz"
                                            value={formData.featuresAz}
                                            onChange={handleInputChange}
                                            placeholder="Xidmət 1, Xidmət 2, Xidmət 3"
                                            rows={3}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="featuresEn">Xüsusiyyətlər (EN) *</label>
                                        <textarea
                                            id="featuresEn"
                                            name="featuresEn"
                                            value={formData.featuresEn}
                                            onChange={handleInputChange}
                                            placeholder="Service 1, Service 2, Service 3"
                                            rows={3}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="featuresRu">Xüsusiyyətlər (RU) *</label>
                                        <textarea
                                            id="featuresRu"
                                            name="featuresRu"
                                            value={formData.featuresRu}
                                            onChange={handleInputChange}
                                            placeholder="Услуга 1, Услуга 2, Услуга 3"
                                            rows={3}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" onClick={handleModalClose}>
                                    İmtina
                                </button>
                                <button type="submit" className="primary" disabled={isSubmitting}>
                                    {isSubmitting ? "Göndərilir..." : editingPackage ? "Dəyişdir" : "Əlavə et"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Packages;