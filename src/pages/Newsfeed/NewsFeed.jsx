import React, { useEffect, useState } from "react";
import Post from "../../components/Post/Post";
import { useNavigate } from "react-router";
import "./newsfeed.css";
import axios from "axios";
const Base_Url = import.meta.env.VITE_BASE_URL;
const NewsFeed = ({ onLogout }) => {
  const Navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      if (loading || !hasMore) return;

      setLoading(true);
      const url = `${Base_Url}/api/posts?page=${page}&limit=3`;
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (data.Posts.length === 0) {
          setHasMore(false);
        } else {
          setPosts((prev) => {
            const existingIds = new Set(prev.map((post) => post.id));
            const newUniquePosts = data.Posts.filter(
              (post) => !existingIds.has(post.id)
            );
            return [...prev, ...newUniquePosts];
          });
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [page]);

  const handleScroll = () => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.scrollHeight - 50 &&
      !loading &&
      hasMore
    ) {
      setPage((prev) => prev + 1);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, hasMore]);

  const handleClick = (post) => {
    Navigate(`/post/${post.id}`);
  };

  return (
    <div className="newsfeed-container">
      <div className="newsfeed-header">
        <h1>My News Feed</h1>
      </div>

      <div className="posts-container">
        {posts.map((post) => (
          <div key={post.id} className="post-wrapper post-fade-in">
            <Post
              postId={post.id}
              content={post.content}
              likes={post.Likes}
              comments={post.Comments}
              username={post.User?.username}
              profile={post.User?.profileImageUrl}
              image={post.image}
              onClick={() => handleClick(post)}
            />
          </div>
        ))}
      </div>

      {loading && (
        <div className="loading-message">
          <p>Loading more posts...</p>
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <div className="no-more-posts">
          <p>You've reached the end! No more posts to load.</p>
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div className="empty-state">
          <h2>No posts yet</h2>
          <p>Be the first to share something with your network!</p>
        </div>
      )}
    </div>
  );
};

export default NewsFeed;
