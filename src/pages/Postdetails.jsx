import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Post from '../components/Post/Post';
import axios from 'axios';
const Base_Url = import.meta.env.VITE_BASE_URL;
const PostDetails = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(`${Base_Url}/api/posts/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setPost(data);
      } catch (err) {
        console.error('Failed to fetch post:', err);
      }
    };

    fetchPost();
  }, [id]);

  if (!post) return <p>Loading post...</p>;

  return (
    <Post
      postId={post.id}
      username={post.User?.username}
      content={post.content}
      image={post.image}
      profile={post.User?.profileImageUrl}
      likes={post.Likes}
      comments={post.Comments}
    />
  );
};

export default PostDetails;
