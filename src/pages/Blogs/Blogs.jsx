import React, { useEffect, useState } from "react";
import "./Blogs.scss";
import axios from "axios";
import { useCookies } from "react-cookie";
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner";
import { Editor } from "primereact/editor";

const ITEMS_PER_PAGE = 50;

const Blogs = () => {
    const [cookies] = useCookies(["token"]);
    const token = cookies?.token;
    const headers = {
        Authorization: `Bearer ${token}`,
    };

    const [blogs, setBlogs] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBlog, setEditingBlog] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [formData, setFormData] = useState({
        blogName: "",
        blogDescription: "",
        blogTitleImage: null,
    });

    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: ITEMS_PER_PAGE,
    });

    const fetchBlogs = async (page = 1) => {
        setIsLoading(true);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/admin/blogs`,
                {
                    headers,
                    params: {
                        page,
                        limit: ITEMS_PER_PAGE,
                    },
                }
            );
            const responseData = response?.data || {};
            setBlogs(responseData?.data || responseData || []);

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
            console.error("Failed to fetch blogs:", error);
            setBlogs([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch blogs
    useEffect(() => {
        fetchBlogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Input change handler
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Image file handler
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert("Şəkil ölçüsü maksimum 5MB ola bilər");
                return;
            }
            // Validate file type
            const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
            if (!validTypes.includes(file.type)) {
                alert("Yalnız JPEG, PNG, GIF və WebP formatları qəbul edilir");
                return;
            }
            setFormData((prev) => ({
                ...prev,
                blogTitleImage: file,
            }));
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Remove image
    const handleRemoveImage = () => {
        setFormData((prev) => ({
            ...prev,
            blogTitleImage: null,
        }));
        setImagePreview(null);
    };

    // Modal close
    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingBlog(null);
        setImagePreview(null);
        setFormData({
            blogName: "",
            blogDescription: "",
            blogTitleImage: null,
        });
    };

    // Open add modal
    const openAddModal = () => {
        setEditingBlog(null);
        setImagePreview(null);
        setFormData({
            blogName: "",
            blogDescription: "",
            blogTitleImage: null,
        });
        setIsModalOpen(true);
    };

    // Open edit modal
    const openEditModal = (blog) => {
        setEditingBlog(blog);
        setFormData({
            blogName: blog?.blogName || "",
            blogDescription: blog?.blogDescription || "",
            blogTitleImage: null,
        });
        // Set existing image as preview
        if (blog?.blogTitleImage) {
            setImagePreview(blog.blogTitleImage);
        } else {
            setImagePreview(null);
        }
        setIsModalOpen(true);
    };

    // Submit blog (POST/PUT)
    const handleSubmitBlog = async (e) => {
        e.preventDefault();
        const isEditMode = Boolean(editingBlog?.id);
        const blogId = editingBlog?.id;

        try {
            const formDataToSend = new FormData();
            formDataToSend.append("blogName", formData.blogName);
            formDataToSend.append("blogDescription", formData.blogDescription);
            if (formData.blogTitleImage) {
                formDataToSend.append("blogTitleImage", formData.blogTitleImage);
            }

            const config = {
                headers: {
                    ...headers,
                    "Content-Type": "multipart/form-data",
                },
            };

            if (isEditMode) {
                await axios.put(
                    `${import.meta.env.VITE_API_URL}/api/admin/blogs/${blogId}`,
                    formDataToSend,
                    config
                );
            } else {
                await axios.post(
                    `${import.meta.env.VITE_API_URL}/api/admin/blogs`,
                    formDataToSend,
                    config
                );
            }

            // Refresh blogs list
            await fetchBlogs(pagination.currentPage || 1);
            handleModalClose();
        } catch (error) {
            console.error(
                `Failed to ${isEditMode ? "update" : "create"} blog:`,
                error
            );
            alert(
                `Bloq ${isEditMode ? "yenilənmədi" : "əlavə edilmədi"
                }. Xəta baş verdi.`
            );
        }
    };

    // Delete blog
    const handleDelete = async (id) => {
        if (!window.confirm("Silməyə əminsiniz?")) return;
        try {
            await axios.delete(
                `${import.meta.env.VITE_API_URL}/api/admin/blogs/${id}`,
                { headers }
            );
            // Refresh current page after delete
            await fetchBlogs(pagination.currentPage || 1);
        } catch (error) {
            console.error("Failed to delete blog:", error);
            alert("Bloq silinmədi. Xəta baş verdi.");
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > pagination.totalPages) return;
        fetchBlogs(newPage);
    };

    return (
        <div className="blogs-page-section">
            <div className="top-section">
                <div className="title-section">
                    <h1>Bloqlar</h1>
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
                            <th>Şəkil</th>
                            <th>Başlıq</th>
                            <th>Təsvir</th>
                            <th>Yaradılma Tarixi</th>
                            <th>Əməliyyatlar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan="6" className="loading-cell">
                                    <LoadingSpinner />
                                </td>
                            </tr>
                        ) : blogs && blogs.length > 0 ? (
                            blogs.map((blog, index) => (
                                <tr key={blog.id}>
                                    <td>
                                        {((pagination.itemsPerPage || ITEMS_PER_PAGE) * ((pagination.currentPage || 1) - 1)) + index + 1}
                                    </td>
                                    <td>
                                        {blog.blogTitleImage ? (
                                            <img
                                                src={blog.blogTitleImage}
                                                alt={blog.blogName || "Blog"}
                                                className="catering-image"
                                            />
                                        ) : (
                                            <span className="no-image">Şəkil yoxdur</span>
                                        )}
                                    </td>
                                    <td>{blog.blogName || "-"}</td>
                                    <td className="text-cell">
                                        {blog.blogDescription ? (
                                            <div
                                                className="description-content"
                                                dangerouslySetInnerHTML={{ __html: blog.blogDescription }}
                                            />
                                        ) : (
                                            "-"
                                        )}
                                    </td>
                                    <td>{blog.createdAt ? new Date(blog.createdAt).toLocaleDateString("az-AZ") : "-"}</td>
                                    <td>
                                        <div className="d-flex gap-2">
                                            <button
                                                className="btn btn-outline-dark"
                                                onClick={() => openEditModal(blog)}
                                            >
                                                Redaktə et
                                            </button>
                                            <button
                                                className="btn btn-danger"
                                                onClick={() => handleDelete(blog.id)}
                                            >
                                                Sil
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr >
                                <td colSpan="6" className="no-data-cell">
                                    Bloq tapılmadı
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

            {
                isModalOpen && (
                    <div className="modal-overlay" onClick={handleModalClose}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>
                                    {editingBlog
                                        ? "Bloqu Dəyişdir"
                                        : "Yeni Bloq"}
                                </h2>
                                <button className="close-button" onClick={handleModalClose}>
                                    &times;
                                </button>
                            </div>
                            <form className="modal-body" onSubmit={handleSubmitBlog}>
                                <div className="form-group">
                                    <label htmlFor="blogName">Bloq Başlığı *</label>
                                    <input
                                        id="blogName"
                                        name="blogName"
                                        type="text"
                                        value={formData.blogName}
                                        onChange={handleInputChange}
                                        placeholder="Bloq başlığı daxil edin"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="blogDescription">Bloq Təsviri *</label>
                                    <div className="rich-text-editor-wrapper">
                                        <Editor
                                            id="blogDescription"
                                            value={formData.blogDescription}
                                            onTextChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    blogDescription: e.htmlValue,
                                                }))
                                            }
                                            style={{ height: "220px" }}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Bloq Şəkli {!editingBlog && "*"}</label>
                                    <p className="file-info">JPEG, PNG, GIF, WebP formatları qəbul edilir (maksimum 5MB)</p>
                                    <div className="file-upload-wrapper">
                                        <input
                                            type="file"
                                            id="blogTitleImage"
                                            name="blogTitleImage"
                                            accept="image/jpeg,image/png,image/gif,image/webp"
                                            onChange={handleImageChange}
                                            className="file-input"
                                            required={!editingBlog}
                                        />
                                        <label htmlFor="blogTitleImage" className="file-upload-label">
                                            <i className="upload-icon">📁</i>
                                            <span>
                                                {formData.blogTitleImage
                                                    ? formData.blogTitleImage.name
                                                    : "Şəkil seçin (klik edin)"}
                                            </span>
                                        </label>
                                        {imagePreview && (
                                            <div className="image-preview">
                                                <img src={imagePreview} alt="Preview" />
                                                <button
                                                    type="button"
                                                    className="remove-image"
                                                    onClick={handleRemoveImage}
                                                >
                                                    <i>✕</i>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button type="button" onClick={handleModalClose}>
                                        İmtina
                                    </button>
                                    <button type="submit" className="primary">
                                        {editingBlog ? "Dəyişdir" : "Əlavə et"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Blogs;