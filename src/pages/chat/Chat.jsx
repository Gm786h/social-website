import React, { useState, useEffect, useRef, useCallback } from "react";
import "./Chat.css";
import axios from "axios";
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
  
  const token = localStorage.getItem("token");

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
    
    console.log('Friends scroll:', { scrollTop, scrollHeight, clientHeight, diff: scrollHeight - scrollTop - clientHeight });
    
    // Load more friends when user scrolls near the bottom (within 100px)
    if (scrollHeight - scrollTop - clientHeight < 100) {
      console.log('Loading more friends, current page:', friendsPage);
      const nextPage = friendsPage + 1;
      setFriendsPage(nextPage);
      fetchFriends(nextPage, true);
    }
  }, [friendsPage, hasMoreFriends, loadingFriends]);

  // Set up friends scroll listener
  useEffect(() => {
    const friendsList = friendsListRef.current;
    if (friendsList) {
      console.log('Setting up friends scroll listener');
      friendsList.addEventListener("scroll", handleFriendsScroll, { passive: true });
      return () => {
        console.log('Removing friends scroll listener');
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

      console.log('Raw API response:', JSON.stringify(res.data, null, 2)); // Debug log

      const messages = res.data
        .map((msg, index) => ({
          id: msg.id || `${msg.senderId}-${msg.createdAt}`, 
          sender: msg.senderId === friend.id ? "friend" : "you",
          text: msg.message,
          createdAt: msg.createdAt,
          originalIndex: index, // Keep track of original API order
        }))
        // ENHANCED: More robust sorting with fallback to original order
        .sort((a, b) => {
          const timeA = new Date(a.createdAt).getTime();
          const timeB = new Date(b.createdAt).getTime();
          
          // If timestamps are exactly the same, use original API order
          if (timeA === timeB) {
            return a.originalIndex - b.originalIndex;
          }
          
          // If one timestamp is invalid, put it at the end
          if (isNaN(timeA)) return 1;
          if (isNaN(timeB)) return -1;
          
          return timeA - timeB;
        })
        .map(({ originalIndex, ...msg }) => msg); // Remove originalIndex from final result

      console.log('Sorted messages:', JSON.stringify(messages.map(m => ({ text: m.text, createdAt: m.createdAt, id: m.id })), null, 2)); // Debug log

      setChatHistory((prev) => {
        const existingMessages = prev[friend.id] || [];
        
        if (isLoadMore) {
          const existingIds = new Set(existingMessages.map(msg => msg.id));
          const newMessages = messages.filter(msg => !existingIds.has(msg.id));
          // ENHANCED: More robust sorting for load more
          const allMessages = [...newMessages, ...existingMessages];
          const sortedMessages = allMessages.sort((a, b) => {
            const timeA = new Date(a.createdAt).getTime();
            const timeB = new Date(b.createdAt).getTime();
            
            // If timestamps are the same, sort by ID as fallback
            if (timeA === timeB) {
              return (a.id || '').localeCompare(b.id || '');
            }
            
            if (isNaN(timeA)) return 1;
            if (isNaN(timeB)) return -1;
            
            return timeA - timeB;
          });
          
          console.log('Load more - final sorted messages:', JSON.stringify(sortedMessages.map(m => ({ text: m.text, createdAt: m.createdAt, id: m.id })), null, 2)); // Debug log
          
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
        setTimeout(scrollToBottom, 100);
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
      setTimeout(scrollToBottom, 100);
    }

    try {
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

  // ENHANCED: Poll for new messages with better debugging and sorting
  useEffect(() => {
    if (!selectedFriend) return;

    const interval = setInterval(async () => {
      const msgs = chatHistory[selectedFriend.id] || [];
      if (msgs.length === 0) return;

      const lastTime = msgs[msgs.length - 1]?.createdAt;
      const wasNearBottom = isNearBottom();

      try {
        const res = await axios.get(
          `${Base_Url}/api/message/${selectedFriend.id}?after=${lastTime}&limit=10`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log('Polling - Raw new messages:', JSON.stringify(res.data, null, 2)); // Debug log

        const newMsgs = res.data.map((msg, index) => ({
          id: msg.id || `${msg.senderId}-${msg.createdAt}`,
          sender: msg.senderId === selectedFriend.id ? "friend" : "you",
          text: msg.message,
          createdAt: msg.createdAt,
          pollingIndex: index, // Track polling order
        }));

        if (newMsgs.length > 0) {
          console.log('Polling - New messages before filtering:', JSON.stringify(newMsgs.map(m => ({ text: m.text, createdAt: m.createdAt, id: m.id })), null, 2)); // Debug log
          
          setChatHistory((prev) => {
            const existing = prev[selectedFriend.id] || [];
            const existingIds = new Set(existing.map(msg => msg.id));
            const filtered = newMsgs.filter(newMsg => !existingIds.has(newMsg.id));
            
            if (filtered.length === 0) return prev;
            
            console.log('Polling - Filtered new messages:', JSON.stringify(filtered.map(m => ({ text: m.text, createdAt: m.createdAt, id: m.id })), null, 2)); // Debug log
            
            // ENHANCED: More robust sorting with multiple fallbacks
            const allMessages = [...existing, ...filtered];
            const sortedMessages = allMessages.sort((a, b) => {
              const timeA = new Date(a.createdAt).getTime();
              const timeB = new Date(b.createdAt).getTime();
              
              // Primary sort: by timestamp
              if (timeA !== timeB && !isNaN(timeA) && !isNaN(timeB)) {
                return timeA - timeB;
              }
              
              // Secondary sort: if timestamps are the same or invalid, use ID
              if (a.id && b.id && a.id !== b.id) {
                // Try to extract numeric part from ID for better sorting
                const idA = parseInt(a.id.toString().replace(/\D/g, '')) || 0;
                const idB = parseInt(b.id.toString().replace(/\D/g, '')) || 0;
                if (idA !== idB) {
                  return idA - idB;
                }
                return a.id.toString().localeCompare(b.id.toString());
              }
              
              // Tertiary sort: by polling/original index if available
              const indexA = a.pollingIndex || a.originalIndex || 0;
              const indexB = b.pollingIndex || b.originalIndex || 0;
              return indexA - indexB;
            });
            
            console.log('Polling - Final sorted messages:', JSON.stringify(sortedMessages.map(m => ({ text: m.text, createdAt: m.createdAt, id: m.id })), null, 2)); // Debug log
            
            return {
              ...prev,
              [selectedFriend.id]: sortedMessages,
            };
          });

          // Auto-scroll if user was near bottom
          if (wasNearBottom) {
            setTimeout(scrollToBottom, 100);
          }
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [selectedFriend, chatHistory, isNearBottom, scrollToBottom, token]);

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
              } ${msg.failed ? "failed" : ""}`}
            >
              {msg.text}
              {msg.sending && <span className="sending-indicator">●</span>}
              {msg.failed && <span className="failed-indicator">⚠</span>}
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