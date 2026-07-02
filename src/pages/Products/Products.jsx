import React, { useEffect, useMemo, useState } from "react";
import "./Products.scss";
import axios from "axios";
import { useCookies } from "react-cookie";
import { Select } from "antd";
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner";

const initialFormData = {
    nameAz: "",
    nameEn: "",
    nameRu: "",
    descriptionAz: "",
    descriptionEn: "",
    descriptionRu: "",
    price: "",
    serviceCategoryId: "",
    mainImageFile: null,
    additionalImageFiles: [],
};

const Products = () => {
    const [cookies] = useCookies(["token"]);
    const token = cookies?.token;
    const authHeaders = token
        ? {
            Authorization: `Bearer ${token}`,
        }
        : {};

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
    const [mainImagePreview, setMainImagePreview] = useState(null);
    const [existingMainImagePath, setExistingMainImagePath] = useState(null);
    const [additionalPreviews, setAdditionalPreviews] = useState([]);
    const [existingAdditionalImages, setExistingAdditionalImages] = useState([]);
    const [search, setSearch] = useState("");

    const categoryNameMap = useMemo(() => {
        return categories.reduce((acc, category) => {
            acc[category.id] = category.nameAz || category.nameEn || category.nameRu || `ID: ${category.id}`;
            return acc;
        }, {});
    }, [categories]);

    const filteredProducts = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return products;

        return products.filter((product) => {
            const fields = [product.nameAz, product.nameEn, product.nameRu]
                .filter(Boolean)
                .map((value) => value.toLowerCase());
            return fields.some((value) => value.includes(query));
        });
    }, [products, search]);

    const categoryOptions = categories.map((category) => ({
        value: String(category.id),
        label: category.nameAz || category.nameEn || category.nameRu || `ID: ${category.id}`,
    }));

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [productsResponse, categoriesResponse] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/Products`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/Services`),
            ]);

            setProducts(Array.isArray(productsResponse?.data) ? productsResponse.data : []);
            setCategories(Array.isArray(categoriesResponse?.data) ? categoriesResponse.data : []);
        } catch (error) {
            console.error("Failed to fetch products or categories:", error);
            setProducts([]);
            setCategories([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const resolveImagePath = (value) => {
        if (!value) return null;
        if (typeof value === "string") return value;
        if (typeof value === "object") {
            return value.imagePath || value.url || value.path || value.imageUrl || null;
        }
        return null;
    };

    const getImageSrc = (path) => {
        const resolved = resolveImagePath(path);
        if (!resolved) return null;
        if (resolved.startsWith("http")) return resolved;
        return `${import.meta.env.VITE_API_URL}${resolved}`;
    };

    const normalizeImageList = (images) => {
        if (!Array.isArray(images)) return [];
        return images.map(resolveImagePath).filter(Boolean);
    };

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

    const handleMainImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFormData((prev) => ({
            ...prev,
            mainImageFile: file,
        }));
        setMainImagePreview(URL.createObjectURL(file));
    };

    const handleAdditionalImagesChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        setFormData((prev) => ({
            ...prev,
            additionalImageFiles: [...prev.additionalImageFiles, ...files],
        }));
        setAdditionalPreviews((prev) => [
            ...prev,
            ...files.map((file) => ({
                url: URL.createObjectURL(file),
                isNew: true,
            })),
        ]);
    };

    const removeMainImage = () => {
        setFormData((prev) => ({
            ...prev,
            mainImageFile: null,
        }));
        setMainImagePreview(null);
        setExistingMainImagePath(null);
    };

    const removeAdditionalImage = (index) => {
        const preview = additionalPreviews[index];
        if (!preview) return;

        if (preview.isNew) {
            const newFileIndex = additionalPreviews
                .slice(0, index)
                .filter((item) => item.isNew).length;

            setFormData((prev) => ({
                ...prev,
                additionalImageFiles: prev.additionalImageFiles.filter((_, i) => i !== newFileIndex),
            }));
        } else {
            setExistingAdditionalImages((prev) =>
                prev.filter((url) => url !== preview.sourceUrl)
            );
        }

        setAdditionalPreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        setFormData(initialFormData);
        setMainImagePreview(null);
        setExistingMainImagePath(null);
        setAdditionalPreviews([]);
        setExistingAdditionalImages([]);
    };

    const openAddModal = () => {
        setEditingProduct(null);
        setFormData(initialFormData);
        setMainImagePreview(null);
        setExistingMainImagePath(null);
        setAdditionalPreviews([]);
        setExistingAdditionalImages([]);
        setIsModalOpen(true);
    };

    const openEditModal = (product) => {
        const existingImages = normalizeImageList(product.images);
        const mainImagePath = resolveImagePath(product?.imagePath);

        setEditingProduct(product);
        setFormData({
            nameAz: product?.nameAz || "",
            nameEn: product?.nameEn || "",
            nameRu: product?.nameRu || "",
            descriptionAz: product?.descriptionAz || "",
            descriptionEn: product?.descriptionEn || "",
            descriptionRu: product?.descriptionRu || "",
            price: product?.price ?? "",
            serviceCategoryId: product?.serviceCategoryId != null ? String(product.serviceCategoryId) : "",
            mainImageFile: null,
            additionalImageFiles: [],
        });
        setMainImagePreview(getImageSrc(mainImagePath));
        setExistingMainImagePath(mainImagePath);
        setExistingAdditionalImages(existingImages);
        setAdditionalPreviews(
            existingImages.map((url) => ({
                url: getImageSrc(url),
                sourceUrl: url,
                isNew: false,
            }))
        );
        setIsModalOpen(true);
    };

    const uploadMainImage = async (file) => {
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);

        const response = await axios.post(
            `${import.meta.env.VITE_API_URL}/api/Upload`,
            uploadFormData,
            {
                headers: {
                    ...authHeaders,
                    "Content-Type": "multipart/form-data",
                },
            }
        );

        const imagePath = response?.data?.url;
        if (!imagePath) {
            throw new Error("Upload response does not include url");
        }

        return imagePath;
    };

    const uploadAdditionalImages = async (files) => {
        if (!files.length) return [];

        const uploadFormData = new FormData();
        files.forEach((file) => uploadFormData.append("files", file));

        const response = await axios.post(
            `${import.meta.env.VITE_API_URL}/api/Upload/multiple`,
            uploadFormData,
            {
                headers: {
                    ...authHeaders,
                    "Content-Type": "multipart/form-data",
                },
            }
        );

        return Array.isArray(response?.data?.urls) ? response.data.urls : [];
    };

    const handleSubmitProduct = async (e) => {
        e.preventDefault();
        if (!formData.serviceCategoryId) {
            alert("Zəhmət olmasa kateqoriya seçin.");
            return;
        }
        if (!formData.mainImageFile && !existingMainImagePath) {
            alert("Zəhmət olmasa əsas şəkil seçin.");
            return;
        }

        setIsSubmitting(true);
        try {
            let imagePath = existingMainImagePath;
            if (formData.mainImageFile) {
                imagePath = await uploadMainImage(formData.mainImageFile);
            }

            const newAdditionalUrls = await uploadAdditionalImages(formData.additionalImageFiles);
            const additionalImages = [...existingAdditionalImages, ...newAdditionalUrls];

            const payload = {
                nameAz: formData.nameAz.trim(),
                nameEn: formData.nameEn.trim(),
                nameRu: formData.nameRu.trim(),
                descriptionAz: formData.descriptionAz.trim(),
                descriptionEn: formData.descriptionEn.trim(),
                descriptionRu: formData.descriptionRu.trim(),
                price: Number(formData.price),
                imagePath,
                serviceCategoryId: Number(formData.serviceCategoryId),
                additionalImages,
            };

            if (editingProduct?.id) {
                await axios.put(
                    `${import.meta.env.VITE_API_URL}/api/Products/${editingProduct.id}`,
                    payload,
                    { headers: authHeaders }
                );
            } else {
                await axios.post(
                    `${import.meta.env.VITE_API_URL}/api/Products`,
                    payload,
                    { headers: authHeaders }
                );
            }

            await fetchData();
            handleModalClose();
        } catch (error) {
            console.error("Failed to save product:", error);
            alert(`Məhsul ${editingProduct ? "yenilənmədi" : "yaradılmadı"}. Xəta baş verdi.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Məhsulu silməyə əminsiniz?")) return;
        try {
            await axios.delete(
                `${import.meta.env.VITE_API_URL}/api/Products/${id}`,
                { headers: authHeaders }
            );
            await fetchData();
        } catch (error) {
            console.error("Failed to delete product:", error);
            alert("Məhsul silinmədi. Xəta baş verdi.");
        }
    };

    return (
        <div className="products-page-section">
            <div className="top-section">
                <div className="top-row">
                    <div className="title-section">
                        <h1>Məhsullar</h1>
                    </div>
                    <div className="button-section">
                        <button className="addition-button" onClick={openAddModal}>
                            + Əlavə et
                        </button>
                    </div>
                </div>
                <div className="bottom-row">
                    <div className="filter-search-section">
                        <input
                            type="text"
                            placeholder="Axtar..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="search-input"
                        />
                    </div>
                </div>
            </div>

            <div className="table-wrapper">
                <table className="products-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Şəkil</th>
                            <th>Ad (AZ)</th>
                            <th>Qiymət</th>
                            <th>Təsvir (AZ)</th>
                            <th>Kateqoriya</th>
                            <th>Əlavə şəkillər</th>
                            <th>Yaradılma tarixi</th>
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
                        ) : filteredProducts.length > 0 ? (
                            filteredProducts.map((product) => {
                                const additionalImages = normalizeImageList(product.images);
                                const mainImagePath = resolveImagePath(product.imagePath);

                                return (
                                    <tr key={product.id}>
                                        <td>{product.id}</td>
                                        <td>
                                            {mainImagePath ? (
                                                <img
                                                    src={getImageSrc(mainImagePath)}
                                                    alt={product.nameAz || "Product"}
                                                    className="product-image"
                                                />
                                            ) : (
                                                <span className="no-image">Şəkil yoxdur</span>
                                            )}
                                        </td>
                                        <td>{product.nameAz || "-"}</td>
                                        <td>{product.price != null ? `${product.price} ₼` : "-"}</td>
                                        <td className="text-cell">{product.descriptionAz || "-"}</td>
                                        <td>
                                            {product.serviceCategoryId != null
                                                ? (categoryNameMap[product.serviceCategoryId] || `ID: ${product.serviceCategoryId}`)
                                                : "-"}
                                        </td>
                                        <td>
                                            {additionalImages.length > 0 ? (
                                                <div className="images-list">
                                                    {additionalImages.map((image, idx) => (
                                                        <img
                                                            key={`${product.id}-${idx}`}
                                                            src={getImageSrc(image)}
                                                            alt={`${product.nameAz} ${idx + 1}`}
                                                            className="additional-image"
                                                        />
                                                    ))}
                                                </div>
                                            ) : (
                                                "-"
                                            )}
                                        </td>
                                        <td>
                                            {product.createdAt
                                                ? new Date(product.createdAt).toLocaleString("az-AZ")
                                                : "-"}
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-dark"
                                                    onClick={() => openEditModal(product)}
                                                >
                                                    Redaktə et
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-danger"
                                                    onClick={() => handleDelete(product.id)}
                                                >
                                                    Sil
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="9" className="no-data-cell">
                                    Məhsul tapılmadı
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="modal-overlay" onClick={handleModalClose}>
                    <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingProduct ? "Məhsulu Dəyişdir" : "Yeni Məhsul"}</h2>
                            <button className="close-button" onClick={handleModalClose}>
                                &times;
                            </button>
                        </div>
                        <form className="modal-body" onSubmit={handleSubmitProduct}>
                            <div className="form-section">
                                <h3 className="form-section-title">Əsas məlumat</h3>
                                <div className="form-group">
                                    <label htmlFor="serviceCategoryId">Kateqoriya *</label>
                                    <Select
                                        id="serviceCategoryId"
                                        className="product-category-select"
                                        value={formData.serviceCategoryId || undefined}
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
                                    <label htmlFor="price">Qiymət *</label>
                                    <input
                                        id="price"
                                        name="price"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                        required
                                    />
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
                                            rows={4}
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
                                            rows={4}
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
                                            rows={4}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-section">
                                <h3 className="form-section-title">Şəkillər</h3>
                                <div className="form-group">
                                    <label>Əsas şəkil {!editingProduct && "*"}</label>
                                    <div className="file-upload-wrapper">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleMainImageChange}
                                            className="file-input"
                                            id="mainImage"
                                            required={!editingProduct && !existingMainImagePath}
                                        />
                                        <label htmlFor="mainImage" className="file-upload-label">
                                            <i>📁</i>
                                            <span>Əsas şəkil seçin</span>
                                        </label>
                                        {mainImagePreview && (
                                            <div className="image-preview">
                                                <img src={mainImagePreview} alt="Preview" />
                                                <button
                                                    type="button"
                                                    className="remove-image"
                                                    onClick={removeMainImage}
                                                >
                                                    <i>✕</i>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Əlavə şəkillər</label>
                                    <div className="file-upload-wrapper">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleAdditionalImagesChange}
                                            className="file-input"
                                            id="additionalImages"
                                        />
                                        <label htmlFor="additionalImages" className="file-upload-label">
                                            <i>📁</i>
                                            <span>Əlavə şəkillər seçin (çoxlu)</span>
                                        </label>
                                        {additionalPreviews.length > 0 && (
                                            <div className="images-preview-grid">
                                                {additionalPreviews.map((preview, index) => (
                                                    <div key={`${preview.url}-${index}`} className="image-preview-item">
                                                        <img src={preview.url} alt={`Preview ${index}`} />
                                                        <button
                                                            type="button"
                                                            className="remove-image-small"
                                                            onClick={() => removeAdditionalImage(index)}
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" onClick={handleModalClose}>
                                    İmtina
                                </button>
                                <button type="submit" className="primary" disabled={isSubmitting}>
                                    {isSubmitting ? "Göndərilir..." : editingProduct ? "Dəyişdir" : "Əlavə et"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
