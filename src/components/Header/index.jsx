import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './header.css';
const Base_Url = import.meta.env.VITE_BASE_URL;
function Header({ isLoggedIn, setIsLoggedIn }) {
  const navigate = useNavigate();
  const location = useLocation();
  const hideProfile = location.pathname === '/' && !isLoggedIn;

  const [profileImage, setProfileImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [username, setUsername] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await axios.get(`${Base_Url}/api/profile/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfileImage(res.data.profileImage);
        setUsername(res.data.username);
      } catch (error) {
        console.log('Failed to load profile');
      }
    };
    if (isLoggedIn) {
      fetchProfile();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (dropdownOpen && dropdownRef.current && profileRef.current) {
      const profileRect = profileRef.current.getBoundingClientRect();
      dropdownRef.current.style.top = `${profileRect.bottom + 8}px`;
    }
  }, [dropdownOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        profileRef.current && !profileRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    navigate('/');
    setDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setPreview(URL.createObjectURL(file));
    setProfileImage(file);
  };

  return (
    <>
      <div className="topnav">
        <a className="active" href="#">
          <img src="/gm.svg" alt="logo" />
          VChat-Pro☀️
        </a>
        {!hideProfile && (
          <div className="right">
            <nav>
              <ul className="nav-list">
                <li><Link to="/">Newsfeed</Link></li>
                <li><Link to="/chat">Chat</Link></li>
                <li><Link to="/friend-request">Friend Request</Link></li>
                <li><Link to="/friends">Friends</Link></li>
                <li><Link to="/post">CreatePost</Link></li>
                <li><Link to="/search">Find People</Link></li>
              </ul>
            </nav>
            <div className="profile-dropdown">
              <div
                ref={profileRef}
                onClick={toggleDropdown}
                className="profile-link"
              >
                <span>{username}</span>
                <div className="profile-pic-wrapper">
                  <img
                    className="profile-pic"
                    src={
                      preview
                        ? preview
                        : profileImage
                          ? profileImage
                          : "https://static.vecteezy.com/system/resources/previews/001/840/612/non_2x/picture-profile-icon-male-icon-human-or-people-sign-and-symbol-free-vector.jpg"
                    }
                    alt="profile"
                  />
                  <span className='online-indicator'></span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dropdown */}
      {dropdownOpen && !hideProfile && (
  <div ref={dropdownRef} className="dropdown-content-custom">
    <div className="dropdown-profile-section">
      <img
        className="dropdown-preview-pic"
        src={
          preview
            ? preview
            : profileImage
              ? profileImage
              : "https://static.vecteezy.com/system/resources/previews/001/840/612/non_2x/picture-profile-icon-male-icon-human-or-people-sign-and-symbol-free-vector.jpg"
        }
        alt="preview"
      />
      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="upload-input"
      />
      <button className="upload-btn"><Link to="/profile-upload" onClick={() => setDropdownOpen(false)}>
      Upload 
    </Link></button>
    </div>

    <button  style={{
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "transparent",
    border: "none",
    color: "#333", 
    fontSize: "16px",
    fontFamily: "Arial, sans-serif",
    cursor: "pointer",
    padding: "8px 12px"
  }}> ⚙️ Setting</button>
    <button
  onClick={handleLogout}
  style={{
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "transparent",
    border: "none",
    color: "red", 
    fontSize: "16px",
    fontFamily: "Arial, sans-serif",
    cursor: "pointer",
    padding: "8px 12px"
  }}
>
  <img
    src="/image.png"
    alt="logo"
    style={{
      width: "20px",
      height: "20px",
      filter: "brightness(0) saturate(100%)", 
    }}
  />
  Logout
</button>

  </div>
)}

    </>
  );
}

export default Header;
