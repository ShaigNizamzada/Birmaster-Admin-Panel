import React, { useEffect, useState } from "react";
import "./Products.scss";
import axios from "axios";
import { useCookies } from "react-cookie";
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner";
import { Editor } from "primereact/editor";

const Products = () => {
  const [cookies] = useCookies(["token"]);
  const token = cookies?.token;
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const [products, setProducts] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [formData, setFormData] = useState({
    productName: "",
    cost: "",
    shortDescription: "",
    Description: "",
    productTitleImage: null,
    Images: [],
  });

  const [titleImagePreview, setTitleImagePreview] = useState(null);
  const [imagesPreview, setImagesPreview] = useState([]);

  // Filters
  const [filters, setFilters] = useState({
    search: "",
  });

  // Fetch products
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (filters.search) params.search = filters.search;

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin/products`,
        { headers, params }
      );
      setProducts(response?.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle title image
  const handleTitleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, productTitleImage: file }));
      const reader = new FileReader();
      reader.onloadend = () => setTitleImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Handle multiple images
  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData((prev) => ({ ...prev, Images: [...prev.Images, ...files] }));

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagesPreview((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove title image
  const removeTitleImage = () => {
    setFormData((prev) => ({ ...prev, productTitleImage: null }));
    setTitleImagePreview(null);
  };

  // Remove additional image
  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      Images: prev.Images.filter((_, i) => i !== index),
    }));
    setImagesPreview((prev) => prev.filter((_, i) => i !== index));
  };

  // Modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData({
      productName: "",
      cost: "",
      shortDescription: "",
      Description: "",
      productTitleImage: null,
      Images: [],
    });
    setTitleImagePreview(null);
    setImagesPreview([]);
  };

  // Open add modal
  const openAddModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      productName: product.productName || "",
      cost: product.cost || "",
      shortDescription: product.shortDescription || "",
      Description: product.Description || "",
      productTitleImage: null,
      Images: [],
    });
    setTitleImagePreview(product.productTitleImage || null);
    setIsModalOpen(true);
  };

  // Submit product
  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    const isEditMode = Boolean(editingProduct?.id);
    const productId = editingProduct?.id;

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("productName", formData.productName);
      formDataToSend.append("cost", formData.cost);
      formDataToSend.append("shortDescription", formData.shortDescription);
      formDataToSend.append("Description", formData.Description);

      if (formData.productTitleImage) {
        formDataToSend.append("productTitleImage", formData.productTitleImage);
      }

      formData.Images.forEach((image) => {
        formDataToSend.append("Images", image);
      });

      const config = {
        headers: {
          ...headers,
          "Content-Type": "multipart/form-data",
        },
      };

      if (isEditMode) {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/api/admin/products/${productId}`,
          formDataToSend,
          config
        );
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/admin/products`,
          formDataToSend,
          config
        );
      }

      await fetchProducts();
      handleModalClose();
    } catch (error) {
      console.error(`Failed to ${isEditMode ? "update" : "create"} product:`, error);
      alert(`Məhsul ${isEditMode ? "yenilənmədi" : "əlavə edilmədi"}. Xəta baş verdi.`);
    }
  };

  // Delete product
  const handleDelete = async (id) => {
    if (!window.confirm("Məhsulu silməyə əminsiniz?")) return;
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/admin/products/${id}`,
        { headers }
      );
      setProducts((prev) => prev.filter((product) => product.id !== id));
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
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
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
              <th>Məhsul Adı</th>
              <th>Qiymət</th>
              <th>Qısa Təsvir</th>
              <th>Tam Təsvir</th>
              <th>Əlavə Şəkillər</th>
              <th>Yaradılma Tarixi</th>
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
            ) : products && products.length > 0 ? (
              products.map((product, index) => (
                <tr key={product.id}>
                  <td>{index + 1}</td>
                  <td>
                    {product.productTitleImage ? (
                      <img
                        src={product.productTitleImage}
                        alt={product.productName || "Product"}
                        className="product-image"
                      />
                    ) : (
                      <span className="no-image">Şəkil yoxdur</span>
                    )}
                  </td>
                  <td>{product.productName || "-"}</td>
                  <td>{product.cost ? `${product.cost} ₼` : "-"}</td>
                  <td className="text-cell">
                    {product.shortDescription ? (
                      <div
                        className="description-content"
                        dangerouslySetInnerHTML={{ __html: product.shortDescription }}
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="text-cell">
                    {product.Description ? (
                      <div
                        className="description-content"
                        dangerouslySetInnerHTML={{ __html: product.Description }}
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    {(() => {
                      const images = product.Images
                        ? (typeof product.Images === 'string'
                          ? product.Images.split(',').filter(img => img.trim())
                          : product.Images)
                        : [];

                      return images.length > 0 ? (
                        <div className="images-list">
                          {images.map((image, idx) => (
                            <img
                              key={idx}
                              src={image}
                              alt={`${product.productName} ${idx + 1}`}
                              className="additional-image"
                            />
                          ))}
                        </div>
                      ) : (
                        "-"
                      );
                    })()}
                  </td>
                  <td>{product.createdAt ? new Date(product.createdAt).toLocaleString('az-AZ') : "-"}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-outline-dark"
                        onClick={() => openEditModal(product)}
                      >
                        Redaktə et
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(product.id)}
                      >
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))
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
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="productName">Məhsul Adı *</label>
                  <input
                    id="productName"
                    name="productName"
                    type="text"
                    value={formData.productName}
                    onChange={handleInputChange}
                    placeholder="Məhsul adını daxil edin"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="cost">Qiymət *</label>
                  <input
                    id="cost"
                    name="cost"
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={handleInputChange}
                    placeholder="Məhsul qiymətini daxil edin"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="shortDescription">Qısa Təsvir *</label>
                <div className="rich-text-editor-wrapper">
                  <Editor
                    id="shortDescription"
                    value={formData.shortDescription}
                    onTextChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        shortDescription: e.htmlValue,
                      }))
                    }
                    style={{ height: "200px" }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="Description">Tam Təsvir *</label>
                <div className="rich-text-editor-wrapper">
                  <Editor
                    id="Description"
                    value={formData.Description}
                    onTextChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        Description: e.htmlValue,
                      }))
                    }
                    style={{ height: "200px" }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Əsas Şəkil {!editingProduct && "*"}</label>
                <div className="file-upload-wrapper">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleTitleImageChange}
                    className="file-input"
                    id="productTitleImage"
                    required={!editingProduct}
                  />
                  <label htmlFor="productTitleImage" className="file-upload-label">
                    <i>📁</i>
                    <span>Əsas şəkil seçin</span>
                  </label>
                  {titleImagePreview && (
                    <div className="image-preview">
                      <img src={titleImagePreview} alt="Preview" />
                      <button type="button" className="remove-image" onClick={removeTitleImage}>
                        <i>✕</i>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Əlavə Şəkillər</label>
                <div className="file-upload-wrapper">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImagesChange}
                    className="file-input"
                    id="Images"
                  />
                  <label htmlFor="Images" className="file-upload-label">
                    <i>📁</i>
                    <span>Əlavə şəkillər seçin (çoxlu)</span>
                  </label>
                  {imagesPreview.length > 0 && (
                    <div className="images-preview-grid">
                      {imagesPreview.map((preview, index) => (
                        <div key={index} className="image-preview-item">
                          <img src={preview} alt={`Preview ${index}`} />
                          <button
                            type="button"
                            className="remove-image-small"
                            onClick={() => removeImage(index)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={handleModalClose}>
                  İmtina
                </button>
                <button type="submit" className="primary">
                  {editingProduct ? "Dəyişdir" : "Əlavə et"}
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
