import React, { useState, useEffect, useRef, useCallback } from "react";
import "./Chat.css";
import axios from "axios";
import { io } from "socket.io-client";

const Base_Url = import.meta.env.VITE_BASE_URL;

const Chat = () => {
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [input, setInput] = useState("");
  const [chatHistory, setChatHistory] = useState({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  //friends////////
  const [friendsPage, setFriendsPage] = useState(1);
  const [hasMoreFriends, setHasMoreFriends] = useState(true);
  const [loadingFriends, setLoadingFriends] = useState(false);
  
  const chatBoxRef = useRef(null);
  const messagesEndRef = useRef(null);
  const friendsListRef = useRef(null);
  const isInitialLoadRef = useRef(false);
  const socketRef = useRef(null);
  
  const token = localStorage.getItem("token");

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!token) return;

    // Initialize socket connection
    socketRef.current = io(Base_Url, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    // Socket connection events
    socketRef.current.on('connect', () => {
      console.log('Connected to server');
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    // Listen for new messages
    socketRef.current.on('newMessage', (messageData) => {
      const newMessage = {
        id: messageData.id,
        sender: messageData.senderId === parseInt(localStorage.getItem('userId')) ? "you" : "friend",
        text: messageData.message,
        createdAt: messageData.createdAt,
      };

      // Add message to chat history
      setChatHistory((prev) => {
        const friendId = messageData.senderId === parseInt(localStorage.getItem('userId')) 
          ? messageData.receiverId 
          : messageData.senderId;
        
        const existingMessages = prev[friendId] || [];
        const messageExists = existingMessages.some(msg => parseInt(msg.id) === parseInt(messageData.id));
        
        if (messageExists) return prev;

        const updatedMessages = [...existingMessages, newMessage].sort((a, b) => {
          const idA = parseInt(a.id) || 0;
          const idB = parseInt(b.id) || 0;
          return idA - idB;
        });

        return {
          ...prev,
          [friendId]: updatedMessages,
        };
      });

      // Auto-scroll if user is near bottom and message is for current chat
      const currentFriendId = selectedFriend?.id;
      const messageFriendId = messageData.senderId === parseInt(localStorage.getItem('userId')) 
        ? messageData.receiverId 
        : messageData.senderId;
      
      if (currentFriendId === messageFriendId && isNearBottom()) {
        setTimeout(scrollToBottom, 100);
      }
    });

    // Listen for message status updates
    socketRef.current.on('messageDelivered', (data) => {
      setChatHistory((prev) => {
        const friendMessages = prev[data.receiverId] || [];
        const updatedMessages = friendMessages.map(msg => 
          msg.id === data.tempId || parseInt(msg.id) === parseInt(data.messageId)
            ? { ...msg, id: data.messageId, sending: false, delivered: true }
            : msg
        );
        
        return {
          ...prev,
          [data.receiverId]: updatedMessages,
        };
      });
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [token]);

  // Join room when friend is selected
  useEffect(() => {
    if (socketRef.current && selectedFriend) {
      const userId = parseInt(localStorage.getItem('userId'));
      const roomId = [userId, selectedFriend.id].sort().join('-');
      
      socketRef.current.emit('joinRoom', {
        roomId: roomId,
        userId: userId,
        friendId: selectedFriend.id
      });
    }
  }, [selectedFriend]);

  const fetchFriends = useCallback(async (pageNum = 1, isLoadMore = false) => {
    if (loadingFriends) return;
    
    const limit = 7; 
    setLoadingFriends(true);

    try {
      const res = await axios.get(
        `${Base_Url}/api/Addfriend/friends?page=${pageNum}&limit=${limit}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      const formatted = res.data.map((f) => ({
        id: f.id,
        name: f.username,
      }));

      setFriends(prev => {
        if (isLoadMore) {
          // For infinite scroll - add new friends to the end
          const existingIds = new Set(prev.map(friend => friend.id));
          const newFriends = formatted.filter(friend => !existingIds.has(friend.id));
          return [...prev, ...newFriends];
        } else {
          // For initial load - replace all friends
          return formatted;
        }
      });
      
      // Check if there are more friends
      if (formatted.length < limit) {
        setHasMoreFriends(false);
      }

    } catch (err) {
      console.error("Failed to fetch friends", err);
    } finally {
      setLoadingFriends(false);
    }
  }, [loadingFriends, token]);

  // Initial friends fetch
  useEffect(() => {
    fetchFriends(1, false);
  }, [token]);

  // Handle friends list scroll for pagination
  const handleFriendsScroll = useCallback((e) => {
    if (!hasMoreFriends || loadingFriends) return;

    const element = e.target;
    const { scrollTop, scrollHeight, clientHeight } = element;
    
    // Load more friends when user scrolls near the bottom (within 100px)
    if (scrollHeight - scrollTop - clientHeight < 100) {
      const nextPage = friendsPage + 1;
      setFriendsPage(nextPage);
      fetchFriends(nextPage, true);
    }
  }, [friendsPage, hasMoreFriends, loadingFriends]);

  // Set up friends scroll listener
  useEffect(() => {
    const friendsList = friendsListRef.current;
    if (friendsList) {
      friendsList.addEventListener("scroll", handleFriendsScroll, { passive: true });
      return () => {
        friendsList.removeEventListener("scroll", handleFriendsScroll);
      };
    }
  }, [handleFriendsScroll]);

  // Smooth scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: "smooth",
        block: "end"
      });
    }
  }, []);

  // Check if user is near bottom of chat
  const isNearBottom = useCallback(() => {
    if (!chatBoxRef.current) return false;
    const { scrollTop, scrollHeight, clientHeight } = chatBoxRef.current;
    return scrollHeight - scrollTop - clientHeight < 100;
  }, []);

  const fetchMessages = async (friend, pageNum = 1, isLoadMore = false) => {
    if (loading) return;
    
    const limit = 10;
    setLoading(true);

    try {
      const res = await axios.get(
        `${Base_Url}/api/message/${friend.id}?page=${pageNum}&limit=${limit}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const messages = res.data
        .map((msg, index) => ({
          id: msg.id || `${msg.senderId}-${msg.createdAt}`, 
          sender: msg.senderId === friend.id ? "friend" : "you",
          text: msg.message,
          createdAt: msg.createdAt,
          originalIndex: index, // Keep track of original API order
        }))
        // ENHANCED: More robust sorting prioritizing message ID over timestamp
        .sort((a, b) => {
          // Primary sort: by numeric ID (most reliable for sequential messages)
          const idA = parseInt(a.id) || 0;
          const idB = parseInt(b.id) || 0;
          
          if (idA !== idB && idA > 0 && idB > 0) {
            return idA - idB;
          }
          
          // Secondary sort: by timestamp
          const timeA = new Date(a.createdAt).getTime();
          const timeB = new Date(b.createdAt).getTime();
          
          if (timeA !== timeB && !isNaN(timeA) && !isNaN(timeB)) {
            return timeA - timeB;
          }
          
          // Fallback: use original API order
          return a.originalIndex - b.originalIndex;
        })
        .map(({ originalIndex, ...msg }) => msg); // Remove originalIndex from final result

      setChatHistory((prev) => {
        const existingMessages = prev[friend.id] || [];
        
        if (isLoadMore) {
          const existingIds = new Set(existingMessages.map(msg => parseInt(msg.id) || 0));
          const newMessages = messages.filter(msg => !existingIds.has(parseInt(msg.id) || 0));
          const allMessages = [...newMessages, ...existingMessages];
          // ENHANCED: Improved sorting for load more with ID priority
          const sortedMessages = allMessages.sort((a, b) => {
            // Primary sort: by numeric ID
            const idA = parseInt(a.id) || 0;
            const idB = parseInt(b.id) || 0;
            
            if (idA !== idB && idA > 0 && idB > 0) {
              return idA - idB;
            }
            
            // Secondary sort: by timestamp
            const timeA = new Date(a.createdAt).getTime();
            const timeB = new Date(b.createdAt).getTime();
            
            if (timeA !== timeB && !isNaN(timeA) && !isNaN(timeB)) {
              return timeA - timeB;
            }
            
            // Fallback: string comparison of IDs
            return (a.id || '').toString().localeCompare((b.id || '').toString());
          });
          
          return {
            ...prev,
            [friend.id]: sortedMessages,
          };
        } else {
          return {
            ...prev,
            [friend.id]: messages,
          };
        }
      });
      if (messages.length < limit) {
        setHasMore(false);
      }
      if (!isLoadMore) {
        scrollToBottom();
      }

    } catch (err) {
      console.error("Error fetching messages", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle infinite scroll for messages
  const handleScroll = useCallback(() => {
    if (!chatBoxRef.current || !hasMore || !selectedFriend || loading) return;

    const { scrollTop } = chatBoxRef.current;
    
    // Load more messages when user scrolls near the top
    if (scrollTop < 100) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchMessages(selectedFriend, nextPage, true);
    }
  }, [selectedFriend, page, hasMore, loading]);

  // Set up scroll listener for messages
  useEffect(() => {
    const chatBox = chatBoxRef.current;
    if (chatBox) {
      chatBox.addEventListener("scroll", handleScroll);
      return () => chatBox.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  const handleFriendClick = async (friend) => {
    if (selectedFriend?.id === friend.id) return; 
    
    setSelectedFriend(friend);
    setPage(1);
    setHasMore(true);
    isInitialLoadRef.current = true;
    
    // Clear existing messages for this friend
    setChatHistory(prev => ({ ...prev, [friend.id]: [] })); 
    
    await fetchMessages(friend, 1, false);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedFriend) return;
    
    const msg = input.trim();
    const tempId = `temp-${Date.now()}`;
    const wasNearBottom = isNearBottom();

    const newMessage = {
      id: tempId,
      sender: "you",
      text: msg,
      createdAt: new Date().toISOString(),
      sending: true
    };

    // Add message to chat immediately
    setChatHistory((prev) => ({
      ...prev,
      [selectedFriend.id]: [
        ...(prev[selectedFriend.id] || []),
        newMessage,
      ],
    }));

    setInput("");
    
    // Scroll to bottom if user was at bottom
    if (wasNearBottom) {
      scrollToBottom();
    }

    try {
      // Send message via Socket.IO instead of HTTP
      if (socketRef.current) {
        socketRef.current.emit('sendMessage', {
          receiverId: selectedFriend.id,
          message: msg,
          tempId: tempId
        });
      } else {
        // Fallback to HTTP if socket is not available
        const response = await axios.post(
          `${Base_Url}/api/message`,
          { receiverId: selectedFriend.id, message: msg },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Update message status
        setChatHistory((prev) => ({
          ...prev,
          [selectedFriend.id]: prev[selectedFriend.id].map(m => 
            m.id === tempId 
              ? { ...m, id: response.data.id || tempId, sending: false }
              : m
          ),
        }));
      }

    } catch (err) {
      console.error("Failed to send message", err);
      setChatHistory((prev) => ({
        ...prev,
        [selectedFriend.id]: prev[selectedFriend.id].map(m => 
          m.id === tempId 
            ? { ...m, sending: false, failed: true }
            : m
        ),
      }));
    }
  };

  const currentMessages = selectedFriend ? (chatHistory[selectedFriend.id] || []) : [];

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="friends-header">
          <h3>Friends</h3>
        </div>
          <ul className="Friendlist" ref={friendsListRef}>
            {friends.map((friend) => (
              <li key={friend.id}>
                <button 
                  onClick={() => handleFriendClick(friend)}
                  className={selectedFriend?.id === friend.id ? 'active' : ''}
                  data-initial={friend.name.charAt(0).toUpperCase()}
                >
                  {friend.name}
                </button>
              </li>
            ))}
            
            {/* Loading indicator for more friends */}
            {loadingFriends && (
              <li className="loading-friends">
                <div className="loading-spinner">Loading more friends...</div>
              </li>
            )}
            
            {/* No more friends indicator */}
            {!hasMoreFriends && friends.length > 0 && (
              <li className="no-more-friends">
                <p>All friends loaded</p>
              </li>
            )}
          </ul>
      </div>

      <div className="chat-main">
        <div className="chat-header">
          {selectedFriend ? `Chat with ${selectedFriend.name}` : "Select a friend"}
        </div>

        <div className="chat-messages" ref={chatBoxRef}>
          {/* Loading indicator for older messages */}
          {loading && selectedFriend && (
            <div className="loading-messages">
              <div className="loading-spinner">Loading older messages...</div>
            </div>
          )}
          
          {/* No more messages indicator */}
          {!hasMore && currentMessages.length > 0 && (
            <div className="no-more-messages">
            
            </div>
          )}
          
          {selectedFriend && currentMessages.map((msg, i) => (
            <div
              key={msg.id || i}
              className={`chat-bubble ${msg.sender === "you" ? "you" : "friend"} ${
                msg.sending ? "sending" : ""
              } ${msg.failed ? "failed" : ""} ${msg.delivered ? "delivered" : ""}`}
            >
              {msg.text}
              {msg.sending && <span className="sending-indicator">●</span>}
              {msg.failed && <span className="failed-indicator">⚠</span>}
              {msg.delivered && <span className="delivered-indicator">✓</span>}
            </div>
          ))}
          
          <div ref={messagesEndRef}></div>
        </div>

        {selectedFriend && (
          <form className="chat-input" onSubmit={handleSend}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              disabled={loading}
            />
            <button type="submit" disabled={!input.trim() || loading}>
              Send
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Chat;