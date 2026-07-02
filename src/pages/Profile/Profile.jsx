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

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileData, setProfileData] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    birthday: "",
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  // Original data for comparison
  const [originalData, setOriginalData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Toggle password visibility handlers
  const toggleCurrentPassword = () =>
    setShowCurrentPassword(!showCurrentPassword);
  const toggleNewPassword = () => setShowNewPassword(!showNewPassword);
  const toggleConfirmPassword = () =>
    setShowConfirmPassword(!showConfirmPassword);

  // Handle input changes
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id === "name"
        ? "first_name"
        : id === "surname"
          ? "last_name"
          : id === "current-password"
            ? "current_password"
            : id === "new-password"
              ? "new_password"
              : id === "confirm-password"
                ? "confirm_password"
                : id]: value,
    }));
    setError("");
    setSuccess("");
  };


  // Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const userData = response.data.user || response.data.data;
        setProfileData(userData);

        // Format birthday for input (YYYY-MM-DD)
        const birthday = userData?.birthday
          ? new Date(userData.birthday).toISOString().split("T")[0]
          : "";

        // Set form data and original data
        const initialData = {
          first_name: userData?.first_name || "",
          last_name: userData?.last_name || "",
          email: userData?.email || "",
          phone: userData?.phone || "",
          birthday: birthday,
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

  // Get only changed profile fields
  const getChangedProfileFields = () => {
    const changes = {};

    // Check personal information changes
    if (formData.first_name !== originalData.first_name) {
      changes.first_name = formData.first_name;
    }
    if (formData.last_name !== originalData.last_name) {
      changes.last_name = formData.last_name;
    }
    if (formData.email !== originalData.email) {
      changes.email = formData.email;
    }
    if (formData.phone !== originalData.phone) {
      changes.phone = formData.phone;
    }
    if (formData.birthday !== originalData.birthday) {
      changes.birthday = formData.birthday;
    }

    return changes;
  };

  // Validate password change
  const validatePasswordChange = () => {
    if (!formData.current_password) {
      throw new Error("Mövcud şifrə tələb olunur");
    }
    if (!formData.new_password) {
      throw new Error("Yeni şifrə tələb olunur");
    }
    if (formData.new_password.length < 6) {
      throw new Error("Yeni şifrə ən azı 6 simvol olmalıdır");
    }
    if (formData.new_password !== formData.confirm_password) {
      throw new Error("Yeni şifrə və təsdiq şifrəsi eyni olmalıdır");
    }
  };

  // Handle profile update
  const handleUpdateProfile = async () => {
    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      const profileChanges = getChangedProfileFields();

      if (Object.keys(profileChanges).length === 0) {
        setError("Heç bir dəyişiklik edilməyib");
        return;
      }

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/auth/profile`,
        profileChanges,
        {
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setSuccess("Profil uğurla yeniləndi");

        // Update original data with new values
        setOriginalData((prev) => ({
          ...prev,
          ...profileChanges,
        }));

        // Refresh profile data
        const profileResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/auth/me`,
          { headers }
        );
        const updatedUserData = profileResponse.data.user || profileResponse.data.data;
        setProfileData(updatedUserData);
      }
    } catch (error) {
      console.error("Profile update error:", error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("Profil yenilənərkən xəta baş verdi");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password change
  const handleChangePassword = async () => {
    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      validatePasswordChange();

      const passwordPayload = {
        old_password: formData.current_password,
        new_password: formData.new_password,
      };

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/auth/change-password`,
        passwordPayload,
        {
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setSuccess("Şifrə uğurla dəyişdirildi");

        // Clear password fields
        setFormData((prev) => ({
          ...prev,
          current_password: "",
          new_password: "",
          confirm_password: "",
        }));
      }
    } catch (error) {
      console.error("Password change error:", error);
      if (error.message) {
        setError(error.message);
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("Şifrə dəyişdirilərkən xəta baş verdi");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle save (both profile and password)
  const handleSave = async () => {
    const profileChanges = getChangedProfileFields();
    const hasPasswordChange =
      formData.current_password || formData.new_password || formData.confirm_password;

    // If only password change
    if (Object.keys(profileChanges).length === 0 && hasPasswordChange) {
      await handleChangePassword();
      return;
    }

    // If only profile change
    if (Object.keys(profileChanges).length > 0 && !hasPasswordChange) {
      await handleUpdateProfile();
      return;
    }

    // If both changes
    if (Object.keys(profileChanges).length > 0 && hasPasswordChange) {
      await handleUpdateProfile();
      await handleChangePassword();
      return;
    }

    setError("Heç bir dəyişiklik edilməyib");
  };

  // Handle cancel
  const handleCancel = () => {
    setFormData((prev) => ({
      ...prev,
      ...originalData,
      current_password: "",
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
              </div>
            </div>
            <div className="col-xxl-8 col-xl-8 col-lg-8 col-md-9 col-sm-12 col-12">
              <div className="form-section right-section">
                <form action="">
                  <div className="row g-4">
                    <div className="col-xxl-6 col-xl-6 col-lg-6 col-lg-6 col-md-6 col-sm-12 col-12">
                      <label htmlFor="name">Ad</label>
                      <input
                        type="text"
                        id="name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-xxl-6 col-xl-6 col-lg-6 col-lg-6 col-md-6 col-sm-12 col-12">
                      <label htmlFor="surname">Soyad</label>
                      <input
                        type="text"
                        id="surname"
                        value={formData.last_name}
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
                      <label htmlFor="birthday">Doğum tarixi</label>
                      <input
                        type="date"
                        id="birthday"
                        value={formData.birthday}
                        onChange={handleInputChange}
                      />
                    </div>
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
                      <label htmlFor="current-password">Mövcud şifrə</label>
                      <div className="password-input-section">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          id="current-password"
                          value={formData.current_password}
                          onChange={handleInputChange}
                        />
                        <i
                          className={
                            showCurrentPassword
                              ? "fa-solid fa-eye"
                              : "fa-solid fa-eye-slash"
                          }
                          onClick={toggleCurrentPassword}
                        />
                      </div>
                    </div>
                    <div className="col-xxl-6 col-xl-6 col-lg-6 col-lg-6 col-md-6 col-sm-12 col-12"></div>
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

        {/* Error and Success Messages */}
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