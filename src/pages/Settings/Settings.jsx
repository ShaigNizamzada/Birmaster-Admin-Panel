import React, { useEffect, useState } from "react";
import "./Settings.scss";
import axios from "axios";
import { useCookies } from "react-cookie";
import { Editor } from "primereact/editor";

const Settings = () => {
    const [cookies] = useCookies(["token"]);
    const token = cookies?.token;
    const headers = {
        Authorization: `Bearer ${token}`,
    };

    const [settingsMap, setSettingsMap] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        contact_phone_number: "",
        contact_email: "",
        contact_address: "",
        instagram: "",
        facebook: "",
        whatsapp: "",
    });

    // Fetch settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/api/admin/settings`,
                    { headers }
                );
                if (response.data.success && response.data.data) {
                    const data = response.data.data;

                    const map = {};
                    data.forEach((item) => {
                        if (item?.section) {
                            map[item.section] = {
                                id: item.id,
                                text: item.text || "",
                            };
                        }
                    });
                    setSettingsMap(map);

                    setFormData({
                        contact_phone_number: map.contact_phone_number?.text || "",
                        contact_email: map.contact_email?.text || "",
                        contact_address: map.contact_address?.text || "",
                        instagram: map.instagram?.text || "",
                        facebook: map.facebook?.text || "",
                        whatsapp: map.whatsapp?.text || "",
                    });
                }
            } catch (error) {
                console.error("Failed to fetch settings:", error);
            }
        };

        fetchSettings();
    }, []);

    // Input change handler
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Submit handler
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const sections = [
                "contact_phone_number",
                "contact_email",
                "contact_address",
                "instagram",
                "facebook",
                "whatsapp",
            ];

            // Prepare individual update requests for existing settings
            const updates = sections
                .map((section) => {
                    const existing = settingsMap[section] || {};
                    if (!existing.id) return null;

                    return {
                        id: existing.id,
                        section,
                        text: formData[section] ?? existing.text ?? "",
                    };
                })
                .filter(Boolean);

            // Call PUT /api/admin/settings/{id} for each setting
            await Promise.all(
                updates.map((item) =>
                    axios.put(
                        `${import.meta.env.VITE_API_URL}/api/admin/settings/${item.id}`,
                        {
                            text: item.text,
                            section: item.section,
                        },
                        { headers }
                    )
                )
            );

            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/admin/settings`,
                { headers }
            );
            if (response.data.success && response.data.data) {
                const updatedData = response.data.data;

                const updatedMap = {};
                updatedData.forEach((item) => {
                    if (item?.section) {
                        updatedMap[item.section] = {
                            id: item.id,
                            text: item.text || "",
                        };
                    }
                });
                setSettingsMap(updatedMap);

                setFormData({
                    contact_phone_number: updatedMap.contact_phone_number?.text || "",
                    contact_email: updatedMap.contact_email?.text || "",
                    contact_address: updatedMap.contact_address?.text || "",
                    instagram: updatedMap.instagram?.text || "",
                    facebook: updatedMap.facebook?.text || "",
                    whatsapp: updatedMap.whatsapp?.text || "",
                });
            }
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update settings:", error);
        }
    };

    // Cancel editing
    const handleCancel = () => {
        if (settingsMap) {
            setFormData({
                contact_phone_number: settingsMap.contact_phone_number?.text || "",
                contact_email: settingsMap.contact_email?.text || "",
                contact_address: settingsMap.contact_address?.text || "",
                instagram: settingsMap.instagram?.text || "",
                facebook: settingsMap.facebook?.text || "",
                whatsapp: settingsMap.whatsapp?.text || "",
            });
        }
        setIsEditing(false);
    };
    return (
        <div className="contact-page-section">
            <div className="top-section">
                <div className="title-section">
                    <h1>Əlaqə Məlumatları</h1>
                </div>
                {!isEditing && (
                    <div className="button-section">
                        <button className="edit-button" onClick={() => setIsEditing(true)}>
                            Redaktə et
                        </button>
                    </div>
                )}
            </div>

            <div className="contact-form-container">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="contact_phone_number">Telefon Nömrəsi</label>
                        <input
                            id="contact_phone_number"
                            name="contact_phone_number"
                            type="text"
                            value={formData.contact_phone_number}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="contact_email">Email</label>
                        <input
                            id="contact_email"
                            name="contact_email"
                            type="email"
                            value={formData.contact_email}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="contact_address">Ünvan</label>
                        <textarea
                            id="contact_address"
                            name="contact_address"
                            value={formData.contact_address}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            rows={3}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="instagram">Instagram</label>
                        <input
                            id="instagram"
                            name="instagram"
                            type="text"
                            value={formData.instagram}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="facebook">Facebook</label>
                        <input
                            id="facebook"
                            name="facebook"
                            type="text"
                            value={formData.facebook}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="whatsapp">WhatsApp</label>
                        <input
                            id="whatsapp"
                            name="whatsapp"
                            type="text"
                            value={formData.whatsapp}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                        />
                    </div>
                    {isEditing && (
                        <div className="form-actions">
                            <button
                                type="button"
                                className="cancel-button"
                                onClick={handleCancel}
                            >
                                İmtina
                            </button>
                            <button type="submit" className="save-button">
                                Yadda saxla
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default Settings;