import React, { useState, useEffect } from "react";
import "./Post.css";
import axios from "axios";

const Post = ({
  postId,
  username,
  content,
  image,
  profile,
  likes: initialLikes,
  comments: initialComments,
  onClick,
}) => {
  const userId = parseInt(localStorage.getItem("userId"));
  const currentUsername = localStorage.getItem("username");

  // Initial Likes Setup
  const [likes, setLikes] = useState(initialLikes?.length || 0);
  const [liked, setLiked] = useState(false);

  // Detect if current user already liked
 useEffect(() => {
  const fetchLikeStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:3000/api/likes/${postId}/status`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setLiked(res.data.liked);
    } catch (err) {
      console.error("Failed to check like status", err);
    }
  };

  fetchLikeStatus();
}, [postId]);



  // Comments
  const [comments, setComments] = useState(
    initialComments?.map((comment) => ({
      user: comment.User?.username || comment.user,
      text: comment.content || comment.text,
    })) || []
  );
  const [input, setInput] = useState("");
  const [showComments, setShowComments] = useState(false);

const handleLike = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.post(
      `http://localhost:3000/api/likes/${postId}/like`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setLiked(res.data.liked);
    setLikes(res.data.likeCount);
  } catch (error) {
    console.error("Like failed", error);
  }
};



  const handleCommentToggle = () => setShowComments(!showComments);

  const handleComments = async (e) => {
    e.preventDefault();
    if (input.trim()) {
      try {
        const token = localStorage.getItem("token");
        await axios.post(
          `http://localhost:3000/api/comments/${postId}`,
          { content: input },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setComments((prev) => [...prev, { user: currentUsername, text: input }]);
        setInput("");
      } catch (error) {
        console.error("Comment failed", error);
      }
    }
  };

  return (
    <div className="post-card">
      <div className="post-header">
        <img
          className="profile-pic"
          src={
            profile ||
            `https://ui-avatars.com/api/?name=${username}&background=random`
          }
          alt="profile"
        />
        <h3>{username}</h3>
      </div>

      <div className="post-content">
        <p>{content}</p>
        {image && (
          <img className="post-img" src={image} alt="post" onClick={onClick} />
        )}
      </div>

      <div className="post-actions">
        <button className="like-btn" onClick={handleLike}>
          {liked ? "❤️ Liked" : "🤍 Like"}
        </button>
        <button className="comment-btn" onClick={handleCommentToggle}>
          💬 Comment
        </button>
      </div>

      <div className="post-stats">
        <span>{likes} likes</span>
        <span>{comments.length} comments</span>
      </div>

      {showComments && (
        <>
          <div className="post-comments">
            {comments.map((c, idx) => (
              <div key={idx} className="comment">
                <strong>{c.user}</strong>: {c.text}
              </div>
            ))}
          </div>

          <form onSubmit={handleComments}>
            <input
              className="comment-input"
              type="text"
              placeholder="Write a comment..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              className="comment-btn"
              disabled={!input.trim()}
            >
              Send
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default Post;
