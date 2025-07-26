import React, { useState } from "react";
import "./SignInUpForm.css";
import axios from "axios";
const Base_Url = import.meta.env.VITE_BASE_URL;
function SignInUpForm({ onLogin }) {
  const [login, setLogin] = useState(false);
  const [username, setusername] = useState("");
  const [email, setemail] = useState("");
  const [password, setpassword] = useState("");

  const toggleLogin = () => {
    setLogin(!login);
    setusername("");
    setemail("");
    setpassword("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = login
        ? `${Base_Url}/api/auth/login`
        : `${Base_Url}/api/auth/register`;
      const payload = login
        ? { email, password }
        : { username, email, password };

      const { data } = await axios.post(endpoint, payload);
      const token = data.token;
      const user = data.user;

      localStorage.setItem("token", token);
      localStorage.setItem("userId", user.id);
      localStorage.setItem("username", user.username);

      if (login) {
        onLogin(token);
      } else {
        alert("Signup successful. Please login.");
        setLogin(true);
      }
    } catch (err) {
      alert(
        err.response?.data?.message || "Something went wrong. Please try again."
      );
    }
  };

  return (
    <div className="signinup-wrapper">
      <form onSubmit={handleSubmit} className="form">
        <h1>{login ? "Sign In" : "Sign Up"}</h1>

        {!login && (
          <input
            type="text"
            placeholder="Username"
            className={login ? "hide" : "unhide"}
            value={username}
            onChange={(e) => setusername(e.target.value)}
          />
        )}

        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setemail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setpassword(e.target.value)}
        />

        <button type="submit" className="btn">
          {login ? "Sign In" : "Sign Up"}
        </button>

        <p className="toggle-text">
          {login ? "Don't have an account?" : "Already have an account?"}
        </p>
        <button type="button" className="btn toggle-btn" onClick={toggleLogin}>
          {login ? "Switch to Sign Up" : "Switch to Sign In"}
        </button>
      </form>
    </div>
  );
}

export default SignInUpForm;
