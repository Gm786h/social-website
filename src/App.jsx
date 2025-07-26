import { useState, useEffect} from 'react'
import './App.css'
// import '@fortawesome/fontawesome-free/css/all.min.css';
import Header from './components/Header';
import NewsFeed from './pages/Newsfeed/NewsFeed';
import Footer from './components/Footer';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PostDetails from './pages/Postdetails';
import Chat from './pages/chat/Chat';
import FriendRequests from './pages/FriendREquest';
import FriendsList from './pages/Friends';
import CreatePost from './pages/CreatePost';
import SignInUpForm from './pages/SignInUpForm';
import ProfileUpload from './pages/uploadProfile';
import SearchUsers from './pages/searchFriend';



function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
 useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token); 
  }, []);
    
     return (
       <div className='App'>
         <Header isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
          <Routes>
          <Route
            path="/"
            element={
              isLoggedIn ? (
                <NewsFeed onLogout={() => setIsLoggedIn(false)}/>
              ) : (
                <SignInUpForm onLogin={() => setIsLoggedIn(true)} />
              )
            }
          />
          <Route path='/post/:id' element={<PostDetails />} />
          <Route path="/chat" element={<Chat />}/> 
          <Route path="/friend-request"element={<FriendRequests />} />
          <Route path='/friends' element={<FriendsList />} />
          <Route path='/post' element={<CreatePost />} />
          <Route path='/profile-upload' element={<ProfileUpload />} />
          <Route path='/search' element={<SearchUsers />} />
        </Routes>
      <Footer />
    </div>
  
  )
}

export default App
