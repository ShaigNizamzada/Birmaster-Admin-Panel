import React, { useState, useEffect } from "react";
import axios from "axios";
import { useCookies } from "react-cookie";
import "./Profile.scss";

const Profile = () => {
  const [cookies] = useCookies(["token"]);
  const token = cookies?.token;
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileData, setProfileData] = useState(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    isCorporate: false,
    companyName: "",
    new_password: "",
    confirm_password: "",
  });

  const [originalData, setOriginalData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const toggleNewPassword = () => setShowNewPassword(!showNewPassword);
  const toggleConfirmPassword = () =>
    setShowConfirmPassword(!showConfirmPassword);

  const handleInputChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id === "new-password"
        ? "new_password"
        : id === "confirm-password"
          ? "confirm_password"
          : id === "isCorporate"
            ? "isCorporate"
            : id]: type === "checkbox" ? checked : value,
    }));
    setError("");
    setSuccess("");
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/Auth/profile`,
          { headers }
        );
        const userData = response.data.user;
        setProfileData(userData);

        const initialData = {
          fullName: userData?.fullName || "",
          email: userData?.email || "",
          phone: userData?.phone || "",
          isCorporate: userData?.isCorporate || false,
          companyName: userData?.companyName || "",
        };

        setFormData((prev) => ({
          ...prev,
          ...initialData,
        }));
        setOriginalData(initialData);
      } catch (error) {
        console.error("Profile data fetch error:", error);
        setError("Profil məlumatları yüklənərkən xəta baş verdi");
      }
    };

    if (token) {
      fetchProfileData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const getChangedProfileFields = () => {
    const changes = {};

    if (formData.fullName !== originalData.fullName) {
      changes.fullName = formData.fullName;
    }
    if (formData.email !== originalData.email) {
      changes.email = formData.email;
    }
    if (formData.phone !== originalData.phone) {
      changes.phone = formData.phone;
    }
    if (formData.isCorporate !== originalData.isCorporate) {
      changes.isCorporate = formData.isCorporate;
    }
    if (formData.companyName !== originalData.companyName) {
      changes.companyName = formData.companyName;
    }
    if (formData.new_password) {
      changes.password = formData.new_password;
    }

    return changes;
  };

  const validatePasswordChange = () => {
    if (!formData.new_password) return;

    if (formData.new_password.length < 6) {
      throw new Error("Yeni şifrə ən azı 6 simvol olmalıdır");
    }
    if (formData.new_password !== formData.confirm_password) {
      throw new Error("Yeni şifrə və təsdiq şifrəsi eyni olmalıdır");
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      validatePasswordChange();

      const profileChanges = getChangedProfileFields();

      if (Object.keys(profileChanges).length === 0) {
        setError("Heç bir dəyişiklik edilməyib");
        return;
      }

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/Auth/profile`,
        profileChanges,
        {
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200 || response.data) {
        setSuccess("Profil uğurla yeniləndi");

        const updatedFields = { ...profileChanges };
        delete updatedFields.password;

        setOriginalData((prev) => ({
          ...prev,
          ...updatedFields,
        }));

        setFormData((prev) => ({
          ...prev,
          ...updatedFields,
          new_password: "",
          confirm_password: "",
        }));

        const profileResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/Auth/profile`,
          { headers }
        );
        setProfileData(profileResponse.data.user);
      }
    } catch (error) {
      console.error("Profile update error:", error);
      if (error.message) {
        setError(error.message);
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("Profil yenilənərkən xəta baş verdi");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData((prev) => ({
      ...prev,
      ...originalData,
      new_password: "",
      confirm_password: "",
    }));
    setError("");
    setSuccess("");
  };

  return (
    <div className="profile-page-section">
      <h3>Şəxsi kabinet</h3>
      <section className="profile-information-section">
        <div className="personal-information-section">
          <div className="row g-4">
            <div className="col-xxl-4 col-xl-4 col-lg-4 col-md-3 col-sm-12 col-12">
              <div className="left-section">
                <h4>Şəxsi məlumatlar</h4>
                {profileData && (
                  <p className="profile-meta">
                    Rol: {profileData.role} | Balans: {profileData.balance}
                  </p>
                )}
              </div>
            </div>
            <div className="col-xxl-8 col-xl-8 col-lg-8 col-md-9 col-sm-12 col-12">
              <div className="form-section right-section">
                <form action="">
                  <div className="row g-4">
                    <div className="col-xxl-6 col-xl-6 col-lg-6 col-lg-6 col-md-6 col-sm-12 col-12">
                      <label htmlFor="fullName">Ad və soyad</label>
                      <input
                        type="text"
                        id="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-xxl-6 col-xl-6 col-lg-6 col-lg-6 col-md-6 col-sm-12 col-12">
                      <label htmlFor="email">E-mail</label>
                      <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-xxl-6 col-xl-6 col-lg-6 col-lg-6 col-md-6 col-sm-12 col-12">
                      <label htmlFor="phone">Mobil nömrə</label>
                      <input
                        type="text"
                        id="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-xxl-6 col-xl-6 col-lg-6 col-lg-6 col-md-6 col-sm-12 col-12">
                      <label htmlFor="isCorporate" className="checkbox-label">
                        <input
                          type="checkbox"
                          id="isCorporate"
                          checked={formData.isCorporate}
                          onChange={handleInputChange}
                        />
                        Korporativ hesab
                      </label>
                    </div>
                    {formData.isCorporate && (
                      <div className="col-xxl-6 col-xl-6 col-lg-6 col-lg-6 col-md-6 col-sm-12 col-12">
                        <label htmlFor="companyName">Şirkət adı</label>
                        <input
                          type="text"
                          id="companyName"
                          value={formData.companyName}
                          onChange={handleInputChange}
                        />
                      </div>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        <div className="password-information-section">
          <div className="row g-4">
            <div className="col-xxl-4 col-xl-4 col-lg-4 col-md-3 col-sm-12 col-12">
              <div className="left-section">
                <h4>Şifrə dəyişmək</h4>
              </div>
            </div>
            <div className="col-xxl-8 col-xl-8 col-lg-8 col-md-9 col-sm-12 col-12">
              <div className="form-section right-section">
                <form action="">
                  <div className="row g-4">
                    <div className="col-xxl-6 col-xl-6 col-lg-6 col-lg-6 col-md-6 col-sm-12 col-12">
                      <label htmlFor="new-password">Yeni şifrə</label>
                      <div className="password-input-section">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          id="new-password"
                          value={formData.new_password}
                          onChange={handleInputChange}
                        />
                        <i
                          className={
                            showNewPassword
                              ? "fa-solid fa-eye"
                              : "fa-solid fa-eye-slash"
                          }
                          onClick={toggleNewPassword}
                        />
                      </div>
                    </div>
                    <div className="col-xxl-6 col-xl-6 col-lg-6 col-lg-6 col-md-6 col-sm-12 col-12">
                      <label htmlFor="confirm-password">Təsdiq şifrəsi</label>
                      <div className="password-input-section">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          id="confirm-password"
                          value={formData.confirm_password}
                          onChange={handleInputChange}
                        />
                        <i
                          className={
                            showConfirmPassword
                              ? "fa-solid fa-eye"
                              : "fa-solid fa-eye-slash"
                          }
                          onClick={toggleConfirmPassword}
                        />
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert-section error">
            <p>{error}</p>
          </div>
        )}
        {success && (
          <div className="alert-section success">
            <p>{success}</p>
          </div>
        )}

        <div className="save-information-section">
          <div className="row g-4">
            <div className="col-xxl-4 col-xl-4 col-lg-4 col-md-3 col-sm-12 col-12"></div>{" "}
            <div className="col-xxl-8 col-xl-8 col-lg-8 col-md-9 col-sm-12 col-12">
              <div className="right-section">
                {" "}
                <button
                  className="btn cancel-information"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  Ləğv et
                </button>
                <button
                  className="btn save-information"
                  onClick={handleSave}
                  disabled={isLoading}
                >
                  {isLoading ? "Yenilənir..." : "Yadda saxla"}
                </button>
              </div>
            </div>
          </div>
        </div>
        <hr />
      </section>
    </div>
  );
};

export default Profile;
