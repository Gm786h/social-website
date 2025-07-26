import React, {useState} from "react";
import './post.css'
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
const Base_Url = import.meta.env.VITE_BASE_URL;
function CreatePost() {
    const navigate = useNavigate();
    const [content,setContent]=useState('')
    const [postImage,setpostImage]=useState(null)
    const [preview,setpreview]=useState(null);

    const imagehandle=(e)=>{
        const pic=Array.from(e.target.files);
        pic.map(pic=>{

             if(pic){
         setpostImage(pic);
        setpreview(URL.createObjectURL(pic));

        }
        })
       
      
    }
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content && !postImage) {
      alert("Post must have text or image.");
      return;
    }

  const formData=new FormData();
  formData.append('content',content)
  if(postImage){
    formData.append('image',postImage)
  }
 const token = localStorage.getItem('token');
    try {
         console.log(token)
      await axios.post(`${Base_Url}/api/posts`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

      alert("Post created successfully!");
      navigate('/');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to create post.");
    } 
  }
  return (
     <div>
          <nav className="nav-bar">
            <ul className="nav-list">
        <li><Link to="/">Back</Link></li>
        </ul>
        </nav>
    <div className="post-container">
        <h1 style={{textAlign:"center"}}>Create Post</h1>
      <form  onSubmit={handleSubmit}>
        <textarea  className="text-area" name="" id="" placeholder="what is on your mind "
        value={content}
        onChange={(e)=>setContent(e.target.value)}
        
        ></textarea>
          {preview && <img className="preview" src={preview} alt="Preview" />}
        <div className="action">
        <input type="file" accept="image/*" onChange={imagehandle}/>
        <button type='submit'>Post</button>
        </div>
      </form>
    </div>
    </div>
  );
}

export default CreatePost;