import React, { useState } from 'react';
import './ProfileUpload.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
const Base_Url = import.meta.env.VITE_BASE_URL;
function ProfileUpload (){
  const navigate = useNavigate();
    const [preview, setPreview] = useState(null);
  const [image, setImage] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleUpload = async(e) => {
    e.preventDefault();

    if (!image) {
      alert('Please select an image to upload.');
      return;
    }
    const formData=new FormData();
    formData.append('image',image);
    const token=localStorage.getItem('token');
    try {
      const res=await axios.put( `${Base_Url}/api/profile/upload-profile`,
        formData,{headers:{
          Authorization:`Bearer ${token}`
        }
          
        })
      const imageUrl = res.data.imageUrl;
      localStorage.setItem('profileImage', imageUrl);
        alert('Profile image uploaded successfully!');
        navigate('/'); 
      
    } catch (error) {
     alert(error.response?.data?.message || 'Upload failed');
    }
}
  return (
     <div className="upload-card">
      <h2>Upload Profile Picture</h2>
      <form onSubmit={handleUpload} className="upload-form">
        <label className="file-label">
          <input type="file" accept="image/*" onChange={handleImageChange} />
          <span>Choose a file</span>
        </label>

        {preview && <img src={preview} alt="Preview" className="preview-image" />}

        <button type="submit" className="upload-button">Upload</button>
      </form>
    </div>
  );
}

export default ProfileUpload ;