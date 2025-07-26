import React, { useState } from "react";
import axios from "axios";
import Fuse from "fuse.js";
import "./search.css";
const Base_Url = import.meta.env.VITE_BASE_URL;
const SearchUsers = () => {
console.log("base urll is ",Base_Url);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const defaultImage='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5OjcBCgoKDQwNGg8PGjclHyU3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3N//AABEIAJQAlAMBIgACEQEDEQH/xAAbAAEAAwEBAQEAAAAAAAAAAAAAAwQFAgEGB//EADIQAAICAQICCQMDBAMAAAAAAAABAgMEESESMQUTIjJBUVJhcRRCkYGhsTRicqIjU8H/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8A/cQAAAI7bYVRcpvRfyBIQXZVVW0pay8kUMjNst2hrCHtzZVAu2dIzb/44qPzuV5ZN8+9bL9NiIAeuTlzbb92ebgAdxtsjyskvhk0M66PN8XyVgBp1dIQltZFwftui3CcZxUotNPxRgnVdk6pcUJNMDeBTxs2NjUbOzN/hlwAAAAAAAHF1kaoOcnokBxk5EKK+KXN8o+ZkXWzulxTe/7IXWytsc5c/wCDgAAAAAAAAAAAAAAF7DzHFqu56x8JPw+SiAPoAZ+Bk8qZvf7WaAAAADJ6Qv623gi+zD92X8y3qaJSXeeyMYAAAAAAElVFlvcjqvPwLWHh8a47o9nwj5mikktEtEgM2HRs335xXxudvo1/9v8AqaAAyLMG6HJKa9is009GtH5H0BBkY1d8e0tJeElzAxgd3VSpnwT5+HucAAAATa5PR+Zs4l3XVKX3LZmMWcC3q70vtls//ANcHh6BmdJz1sjD0rUpEuVLjybH/dp+CIAAABYwaOut1fcju/f2K5rdH18GNF+MtwLKPQAAAAAACvmUddU9F21vFmOfQGNmw6vImlstdUBAAAATaeq5gAbtM+OqM/NanhX6OsX0+jfKTQAzJPik34ttngAAAADbxv6ev/FGIbODLixYey0AnAAAAAAAAMrpP+oX+JqmR0hNSyZafbsBWAAAAAT0W8EGvcEUYtrYAe3R4brF5SOCz0hDhyW/VuVgAAAF3o27hm65PaW6+SkE2mmtmgPoAVMPKVqUZvSz+S2AAAAA5nOMIuU2kkBzfYqqnN+HIxG3JuT5smy8h3z22guSIAAAAAAC9g08dLl/cC3hQ4MaC5arUAQ9J18VcZrnF6foZhvTipwcZLVNaMw7a3VNwlzTA5AAAAlhj22d2uXy1oBEW6c+yGimuNfO5z9DkehflD6HI9K/KAuRz6X3tYv3R087H9f+rKP0OR6F+UPocj0r8oCxZ0jHlXBv3lsUrrrLpa2S18kvAl+hyPSvyh9DkelflAVgTyw8iO7hqvZ6kMk4vSSafk1oB4AAB3RW7bYw9TODR6Mp0TufN7IC8uW2wPQAKfSFHWQ44Ltx8PNFwAfPnVdcrZqEFq3+xczsVxbtrXZfeS8Pcm6OVSp1i9Z/cB3j4ldSTfal5vw+CyAAAAAAAAAAOLK4WR0nFSXudgDJy8N0vjhvX+6KpvySaaa203MeVKnkuvH7S128kBzjUu+xRXd8WbUYqKSjslyRHj0RorUY7vxfmSgAAAAAAo34sq59bi7S8Yl4AVMfMjN8FnYs5aPxLZBfjV395aS9S5lfhy8buvrYLwAvgpw6Qrb4bE4SLMLa592cX8MDsAAAeNpc2l8kNmXRDnYn7LcCc4sshXHWbSRU+rtu2xqn/kxXhOcuPJm5y8lyA5lbbmvgpTjX9zLdFEKIaQW/i/MkilFaJJJeR6AAAAAAAAAAAAAAcTqrmu3BS+UVrMCjTWPFH4YAFO2DqekJzX6kanOXOcvyeAC3RiV26Obk/wBS1DDor5Vp/O56AJktNvI9AAAAAAAAAA//2Q=='
  const handleSearch = async (e) => {
    const value = e.target.value;
    setQuery(value);

    if (value.trim().length < 3) {
      setResults([]);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${Base_Url}/api/users/search?name=${value}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = res.data || [];

      const fuse = new Fuse(data, {
        keys: ["username"],
        threshold: 0.1,
      });

      const filtered = fuse.search(value).map((result) => result.item);
      setResults(filtered);
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  const sendFriendRequest = async (receiverId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${Base_Url}/api/Addfriend/send`,
        { receiverId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update status locally to show "Request Sent"
      setResults((prev) =>
        prev.map((user) =>
          user.id === receiverId ? { ...user, status: "request_sent" } : user
        )
      );

      alert("Friend request sent!");
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to send request";
      alert(msg);

      // If backend says already friends or already sent, update status accordingly
      const status =
        msg === "You are already friends."
          ? "friends"
          : msg === "Friend request already sent."
          ? "request_sent"
          : "none";

      setResults((prev) =>
        prev.map((user) =>
          user.id === receiverId ? { ...user, status } : user
        )
      );
    }
  };

  const getButtonText = (status) => {
    switch (status) {
      case "friends":
      return (
        <>
          <img style={{width:"16px", margin:"0,3px"}} src="add-friend.png" alt="Friends" className="status-icon" />
          Friends
        </>
      );
      case "request_sent":
        return " pending...";
      case "none":
      default:
        return " Send Request";
    }
  };

  const isButtonDisabled = (status) =>
    status === "friends" || status === "request_sent";

  return (
    <div className="search-container">
      <h2>Find Friends</h2>
      <input
        type="text"
        placeholder="Search by name..."
        value={query}
        onChange={handleSearch}
      />
      <ul className="search-results">
        {results.map((user) => (
          <li key={user.id} className="search-item">
            <img
              src={user.profileImageUrl||defaultImage}
              alt="profile"
              className="profile-pic"
            />
            <span>{user.username}</span>
            <button
              disabled={isButtonDisabled(user.status)}
              onClick={() => sendFriendRequest(user.id)}
            >
              {getButtonText(user.status)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SearchUsers;
