import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import BirsaytLogo from "../../assets/images/Logo.webp";
import "./Login.scss";
import axios from "axios";
import { toast } from "react-toastify";
import { useCookies } from "react-cookie";

const Login = () => {
  const phoneRef = useRef(null);
  const passwordRef = useRef(null);
  const [, setCookie] = useCookies(["token"]);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    axios
      .post(`${import.meta.env.VITE_API_URL}/api/Auth/login`, {
        phone: phoneRef.current.value,
        password: passwordRef.current.value,
      })
      .then((res) => {
        toast.success(res.data.message);
        const token = res?.data?.token;
        if (token) {
          const isSecure = window.location.protocol === "https:";
          setCookie("token", token, {
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
            sameSite: "lax",
            secure: isSecure,
            domain: window.location.hostname.includes("birmaster.az")
              ? ".birmaster.az"
              : undefined,
          });
        }
        navigate("/dashboard");
      })
      .catch((err) => {
        toast.error(
          err.response?.data?.message || "Yanlış istifadəçi adı və ya şifrə"
        );
      });
  };

  return (
    <div className="login-page-section">
      <div className="login-page-container">
        <section className="top-section">
          <img src={BirsaytLogo} alt="Birsayt Logo" className="birsayt-logo" />
          <h1>Xoş gəlmisiniz! 👋</h1>
        </section>
        <section className="form-section">
          <form onSubmit={handleSubmit}>
            <div className="row g-4">
              <div className="col-12">
                <label>Telefon</label>
                <input
                  ref={phoneRef}
                  type="text"
                  id="phone"
                  placeholder="Telefon"
                  required
                />
              </div>
              <div className="col-12">
                <label>Şifrə</label>
                <input
                  ref={passwordRef}
                  type="password"
                  id="password"
                  placeholder="Şifrə"
                  required
                />
              </div>
              <div className="col-12">
                <button type="submit">Daxil ol </button>
              </div>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Login;
