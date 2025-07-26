import React, { useEffect, useState } from "react";
import "./friend.css";
import { Link } from "react-router-dom";
import axios from "axios";
const Base_Url = import.meta.env.VITE_BASE_URL;
const FriendsList = () => {
  const [friends, setFriends] = useState([]);
  useEffect(() => {
    const fetchFriendList = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${Base_Url}/api/Addfriend/friends?page=1&limit=18`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const defaultImage='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5OjcBCgoKDQwNGg8PGjclHyU3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3N//AABEIAJQAlAMBIgACEQEDEQH/xAAbAAEAAwEBAQEAAAAAAAAAAAAAAwQFAgEGB//EADIQAAICAQICCQMDBAMAAAAAAAABAgMEESESMQUTIjJBUVJhcRRCkYGhsTRicqIjU8H/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8A/cQAAAI7bYVRcpvRfyBIQXZVVW0pay8kUMjNst2hrCHtzZVAu2dIzb/44qPzuV5ZN8+9bL9NiIAeuTlzbb92ebgAdxtsjyskvhk0M66PN8XyVgBp1dIQltZFwftui3CcZxUotNPxRgnVdk6pcUJNMDeBTxs2NjUbOzN/hlwAAAAAAAHF1kaoOcnokBxk5EKK+KXN8o+ZkXWzulxTe/7IXWytsc5c/wCDgAAAAAAAAAAAAAAF7DzHFqu56x8JPw+SiAPoAZ+Bk8qZvf7WaAAAADJ6Qv623gi+zD92X8y3qaJSXeeyMYAAAAAAElVFlvcjqvPwLWHh8a47o9nwj5mikktEtEgM2HRs335xXxudvo1/9v8AqaAAyLMG6HJKa9is009GtH5H0BBkY1d8e0tJeElzAxgd3VSpnwT5+HucAAAATa5PR+Zs4l3XVKX3LZmMWcC3q70vtls//ANcHh6BmdJz1sjD0rUpEuVLjybH/dp+CIAAABYwaOut1fcju/f2K5rdH18GNF+MtwLKPQAAAAAACvmUddU9F21vFmOfQGNmw6vImlstdUBAAAATaeq5gAbtM+OqM/NanhX6OsX0+jfKTQAzJPik34ttngAAAADbxv6ev/FGIbODLixYey0AnAAAAAAAAMrpP+oX+JqmR0hNSyZafbsBWAAAAAT0W8EGvcEUYtrYAe3R4brF5SOCz0hDhyW/VuVgAAAF3o27hm65PaW6+SkE2mmtmgPoAVMPKVqUZvSz+S2AAAAA5nOMIuU2kkBzfYqqnN+HIxG3JuT5smy8h3z22guSIAAAAAAC9g08dLl/cC3hQ4MaC5arUAQ9J18VcZrnF6foZhvTipwcZLVNaMw7a3VNwlzTA5AAAAlhj22d2uXy1oBEW6c+yGimuNfO5z9DkehflD6HI9K/KAuRz6X3tYv3R087H9f+rKP0OR6F+UPocj0r8oCxZ0jHlXBv3lsUrrrLpa2S18kvAl+hyPSvyh9DkelflAVgTyw8iO7hqvZ6kMk4vSSafk1oB4AAB3RW7bYw9TODR6Mp0TufN7IC8uW2wPQAKfSFHWQ44Ltx8PNFwAfPnVdcrZqEFq3+xczsVxbtrXZfeS8Pcm6OVSp1i9Z/cB3j4ldSTfal5vw+CyAAAAAAAAAAOLK4WR0nFSXudgDJy8N0vjhvX+6KpvySaaa203MeVKnkuvH7S128kBzjUu+xRXd8WbUYqKSjslyRHj0RorUY7vxfmSgAAAAAAo34sq59bi7S8Yl4AVMfMjN8FnYs5aPxLZBfjV395aS9S5lfhy8buvrYLwAvgpw6Qrb4bE4SLMLa592cX8MDsAAAeNpc2l8kNmXRDnYn7LcCc4sshXHWbSRU+rtu2xqn/kxXhOcuPJm5y8lyA5lbbmvgpTjX9zLdFEKIaQW/i/MkilFaJJJeR6AAAAAAAAAAAAAAcTqrmu3BS+UVrMCjTWPFH4YAFO2DqekJzX6kanOXOcvyeAC3RiV26Obk/wBS1DDor5Vp/O56AJktNvI9AAAAAAAAAA//2Q=='
        console.log("Friends response:", res.data);

        if (Array.isArray(res.data)) {
          const formatted = res.data.map((item) => ({
            id: item.id,
            name: item.username,
            profileImageUrl: item.profileImageUrl || defaultImage, // or whatever the API uses
          }));
          setFriends(formatted);
        } else {
          console.warn("Unexpected data shape", res.data);
        }
      } catch (error) {
        console.error("Error fetching friends:", error);
      }
    };
    fetchFriendList();
  }, []);
  const handleRemove = async (friendId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${Base_Url}/api/Addfriend/unfriend`,
        { friendId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setFriends((prev) => prev.filter((friend) => friend.id !== friendId));
    } catch (err) {
      console.error("Error unfriending user:", err);
    }
  };

  return (
    <div>
      <div className="friends-list-container">
        <h2>Friends</h2>
        {friends.length === 0 ? (
          <p>You have no friends yet.</p>
        ) : (
          <ul className="friends-list">
            {friends.map((friend) => (
              <li key={friend.id} className="friend-item">
                <a href="#">
                  <span className="friend-name">
                    <img
                      src={friend.profileImageUrl || "/default.jpg"}
                      alt={`${friend.name}'s profile`}
                      className="profile-pic"
                    />
                    <h1>{friend.name}</h1>
                  </span>
                </a>
                <button
                  className="remove-button"
                  onClick={() => handleRemove(friend.id)}
                >
                  Unfriend
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
export default FriendsList;
