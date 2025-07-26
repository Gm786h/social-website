import React, { useEffect, useState } from "react";
import "./friend.css";
import axios from "axios";
const Base_Url = import.meta.env.VITE_BASE_URL;
const FriendRequests = () => {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${Base_Url}/api/Addfriend/received`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("Friend requests API response:", res.data);

        if (Array.isArray(res.data)) {
          // Map requests to include profileImageUrl for easier usage
          const formatted = res.data.map((req) => ({
            id: req.id,
            senderId: req.Sender?.id,
            username: req.Sender?.username,
            profileImageUrl: req.Sender?.profileImageUrl || null, // Adjust property name if needed
          }));
          setRequests(formatted);
        } else {
          console.warn("Unexpected API shape", res.data);
          setRequests([]);
        }
      } catch (err) {
        console.error("Error fetching requests:", err);
        setRequests([]);
      }
    };

    fetchRequests();
  }, []);

  const handleAccept = async (senderId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${Base_Url}/api/Addfriend/accept`,
        { senderId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setRequests((prev) => prev.filter((req) => req.senderId !== senderId));
    } catch (err) {
      console.error("Accept error:", err);
    }
  };

  const handleReject = async (senderId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${Base_Url}/api/Addfriend/cancel`,
        { senderId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setRequests((prev) => prev.filter((req) => req.senderId !== senderId));
    } catch (err) {
      console.error("Reject error:", err);
    }
  };

  return (
    <div>
      <div className="friend-requests-container">
        <h2>Friend Requests</h2>
        {requests.length === 0 ? (
          <p>No pending requests.</p>
        ) : (
          <ul className="request-list">
            {requests.map((req) => (
              <li key={req.id} className="request-item">
                <a href="#" className="friend-name">
                  <img
                    src={req.profileImageUrl || "/default.jpg"}
                    alt={`${req.username}'s profile`}
                    className="profile-pic"
                  />
                  <h1>{req.username}</h1>
                </a>
                <div className="actions">
                  <button
                    className="accept-btn"
                    onClick={() => handleAccept(req.senderId)}
                  >
                    Accept
                  </button>
                  <button
                    className="reject-btn"
                    onClick={() => handleReject(req.senderId)}
                  >
                    Cancel
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default FriendRequests;
