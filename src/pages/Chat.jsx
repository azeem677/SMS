import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, Phone, Video, Info, MoreVertical, Plus } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRecentChats, fetchAllUsers } from '../features/chatSlice';
import { selectCurrentUser } from '../features/authSlice';
import { io } from 'socket.io-client';
import axios from 'axios';

const Chat = () => {
    const dispatch = useDispatch();
    const rawChatState = useSelector((state) => state.chat);
    const user = useSelector(selectCurrentUser);
    const token = useSelector((state) => state.auth.token || localStorage.getItem('token'));

    // FIX: Safely extract arrays in case your Redux thunk stored the entire { success: true, data: [...] } object
    const recentChats = Array.isArray(rawChatState.recentChats) ? rawChatState.recentChats : (rawChatState.recentChats?.data || []);
    const allUsers = Array.isArray(rawChatState.allUsers) ? rawChatState.allUsers : (rawChatState.allUsers?.data || []);
    const loading = rawChatState.loading;

    const [selectedChat, setSelectedChat] = useState(null);
    const [messageText, setMessageText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Live Chat & Messages State
    const [socket, setSocket] = useState(null);
    const [currentMessages, setCurrentMessages] = useState([]);
    const messagesEndRef = useRef(null);

    // 1. Initial Data Fetch
    useEffect(() => {
        dispatch(fetchRecentChats());
        dispatch(fetchAllUsers());
    }, [dispatch]);

    // 2. Default selection selection
    useEffect(() => {
        if (recentChats.length > 0 && !selectedChat) {
            setSelectedChat(recentChats[0]);
        }
    }, [recentChats, selectedChat]);

    // 3. Setup Socket.io Connection
    useEffect(() => {
        const currentUserId = user?.id || user?._id;
        if (!currentUserId) return;

        // Connect to backend
        const newSocket = io('http://localhost:5000');
        setSocket(newSocket);

        // Join personal room
        newSocket.emit('join', currentUserId);

        // Listen for incoming messages
        newSocket.on('newMessage', (message) => {
            setCurrentMessages((prevMessages) => [...prevMessages, message]);
        });

        // Listen for confirmation that our message was sent
        newSocket.on('messageSent', (message) => {
            setCurrentMessages((prevMessages) => [...prevMessages, message]);
        });

        return () => newSocket.disconnect();
    }, [user]);

    // 4. Load Chat History when a user is selected
    useEffect(() => {
        const loadMessages = async () => {
            if (!selectedChat) return;
            const chatUserId = selectedChat.id || selectedChat._id;

            try {
                const res = await axios.get(`http://localhost:5000/api/chat/${chatUserId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // Backend returns { success: true, data: [...] }
                setCurrentMessages(res.data.data);
            } catch (err) {
                console.error("Failed to load messages", err);
            }
        };

        loadMessages();
    }, [selectedChat, token]);

    // 5. Auto scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [currentMessages]);

    // Handle Sending a Message
    const handleSendMessage = (e) => {
        e.preventDefault();
        const currentUserId = user?.id || user?._id;
        const receiverId = selectedChat?.id || selectedChat?._id;

        if (messageText.trim() && selectedChat && socket) {
            // Emit to server via socket
            socket.emit('sendMessage', {
                sender: currentUserId,
                receiver: receiverId,
                content: messageText
            });
            setMessageText('');
        }
    };

    // Filter all users based on search
    const filteredUsers = allUsers.filter(u =>
        u?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading && recentChats.length === 0 && allUsers.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    const currentChat = selectedChat || (recentChats.length > 0 ? recentChats[0] : null);
    const userName = user?.name || user?.fullName || 'My Profile';
    const currentUserId = user?.id || user?._id;

    return (
        <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] flex flex-col">
            <div className="flex-1 flex bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-xl animate-in fade-in zoom-in duration-300">
                {/* Sidebar */}
                <div className="w-80 border-r border-gray-200 dark:border-zinc-800 flex flex-col bg-gray-50/30 dark:bg-zinc-900/50 backdrop-blur-sm">
                    {/* User Profile Header */}
                    <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center gap-3 bg-white/40 dark:bg-zinc-800/20">
                        <div className="relative">
                            {user?.image ? (
                                <img src={user.image} alt={userName} className="w-10 h-10 rounded-full border border-blue-500/30 p-0.5 object-cover" />
                            ) : (
                                <div className="w-10 h-10 rounded-full border border-blue-500/30 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center uppercase shadow-sm text-lg">
                                    {(userName || 'U').charAt(0)}
                                </div>
                            )}
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-zinc-900 rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-sm font-bold text-gray-800 dark:text-zinc-100 truncate">{userName}</h2>
                            <p className="text-[11px] text-gray-500 dark:text-zinc-400 font-medium truncate">{user?.email}</p>
                        </div>
                        <button className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-lg transition-colors text-gray-500">
                            <MoreVertical size={16} />
                        </button>
                    </div>

                    <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
                        <div className="flex items-center justify-between mb-4">
                            <h1 className="text-xl font-bold text-gray-800 dark:text-zinc-100 ">Messages</h1>
                            <button className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-blue-500">
                                <Plus size={20} />
                            </button>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search people..."
                                className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-zinc-100"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        {/* Recent Chats Section */}
                        {recentChats.length > 0 && (
                            <div className="mb-4">
                                <p className="px-4 py-2 text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Recent Chats</p>
                                {recentChats.map((chat) => (
                                    <div
                                        key={chat.id || chat._id}
                                        onClick={() => setSelectedChat(chat)}
                                        className={`flex items-center gap-3 p-4 cursor-pointer transition-all hover:bg-white dark:hover:bg-zinc-800/50 border-l-4 ${(currentChat?.id || currentChat?._id) === (chat.id || chat._id)
                                            ? 'bg-white dark:bg-zinc-800 border-blue-500'
                                            : 'border-transparent'
                                            }`}
                                    >
                                        <div className="relative">
                                            {chat.avatar ? (
                                                <img src={chat.avatar} alt={chat.name} className="w-12 h-12 rounded-full border border-gray-200 dark:border-zinc-700 p-0.5 object-cover" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 font-bold flex items-center justify-center uppercase shadow-sm text-xl mb-0.5">
                                                    {(chat.name || 'U').charAt(0)}
                                                </div>
                                            )}
                                            {chat.online && (
                                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-zinc-900 rounded-full"></div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h3 className="text-sm font-semibold text-gray-800 dark:text-zinc-100 truncate">{chat.name}</h3>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-zinc-400 truncate leading-relaxed">View chat</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* All Registered Users Section */}
                        <div>
                            <p className="px-4 py-2 text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">All Users</p>
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((u) => {
                                    const uId = u?.id || u?._id;
                                    const isMe = currentUserId && uId === currentUserId;
                                    if (isMe) return null;

                                    return (
                                        <div
                                            key={uId}
                                            onClick={() => setSelectedChat({
                                                _id: uId,
                                                name: u?.name,
                                                avatar: u?.image,
                                                online: true
                                            })}
                                            className={`flex items-center gap-3 p-4 cursor-pointer transition-all hover:bg-white dark:hover:bg-zinc-800/50 border-l-4 ${(currentChat?.id || currentChat?._id) === uId
                                                ? 'bg-white dark:bg-zinc-800 border-blue-500'
                                                : 'border-transparent'
                                                }`}
                                        >
                                            <div className="relative">
                                                {u?.image ? (
                                                    <img src={u.image} alt={u?.name} className="w-12 h-12 rounded-full border border-gray-200 dark:border-zinc-700 p-0.5 object-cover" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 font-bold flex items-center justify-center uppercase shadow-sm text-xl mb-0.5">
                                                        {(u?.name || 'U').charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-semibold text-gray-800 dark:text-zinc-100 truncate">{u?.name}</h3>
                                                <p className="text-[10px] text-gray-400 dark:text-zinc-500 truncate mb-1">{u?.email}</p>
                                                <p className="text-xs text-gray-500 dark:text-zinc-400 truncate leading-relaxed">Click to start chat</p>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="p-4 text-center text-gray-500 dark:text-zinc-400 text-sm">
                                    {recentChats.length === 0 ? "No active chats or users found" : ""}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-white dark:bg-zinc-900 relative">
                    {currentChat ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md z-10">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        {currentChat.avatar ? (
                                            <img src={currentChat.avatar} alt={currentChat.name} className="w-10 h-10 rounded-full border border-gray-100 dark:border-zinc-700 shadow-sm object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full border border-gray-100 dark:border-zinc-800 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center uppercase shadow-sm text-lg">
                                                {(currentChat.name || 'U').charAt(0)}
                                            </div>
                                        )}
                                        {currentChat.online && (
                                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-zinc-900 rounded-full"></div>
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold text-gray-800 dark:text-zinc-100">{currentChat.name}</h2>
                                        <p className="text-[11px] text-green-500 font-medium">{currentChat.online ? 'Online' : 'Offline'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-gray-500 dark:text-zinc-400">
                                        <Phone size={18} />
                                    </button>
                                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-gray-500 dark:text-zinc-400">
                                        <Video size={18} />
                                    </button>
                                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-gray-500 dark:text-zinc-400">
                                        <Info size={18} />
                                    </button>
                                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-gray-500 dark:text-zinc-400">
                                        <MoreVertical size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar relative">
                                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

                                <div className="relative z-10 space-y-4">
                                    {currentMessages.length > 0 ? (
                                        currentMessages.map((msg, index) => {
                                            const isMyMessage = msg.sender === currentUserId || msg.senderId === currentUserId;

                                            return (
                                                <div key={msg._id || index} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                                                    <div className={`max-w-[70%]`}>
                                                        <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm transition-all ${isMyMessage
                                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                                            : 'bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-zinc-100 rounded-tl-none'
                                                            }`}>
                                                            {msg.content || msg.text}
                                                        </div>
                                                        <div className={`flex items-center gap-1 mt-1.5 ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                                                            <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium">
                                                                {msg.createdAt && new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                            {isMyMessage && (
                                                                <div className="text-blue-500">
                                                                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-gray-500 dark:text-zinc-400 text-sm">
                                            Start a conversation with {currentChat.name}
                                        </div>
                                    )}
                                    {/* Auto scroll target */}
                                    <div ref={messagesEndRef} />
                                </div>
                            </div>

                            {/* Message Input */}
                            <div className="p-4 border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                                <form onSubmit={handleSendMessage} className="flex items-center gap-2 bg-gray-100 dark:bg-zinc-800 p-1.5 rounded-2xl border border-gray-200 dark:border-zinc-700">
                                    <button type="button" className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-xl text-gray-500 transition-colors">
                                        <Plus size={20} />
                                    </button>
                                    <input
                                        type="text"
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                        placeholder="Type your message..."
                                        className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-sm py-2 px-1 dark:text-zinc-100"
                                    />

                                    <button
                                        type="submit"
                                        className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl transition-all shadow-lg hover:shadow-blue-500/30 flex items-center justify-center ml-1"
                                    >
                                        <Send size={18} />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-zinc-400">
                            <div className="w-20 h-20 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                                <Info size={40} className="text-gray-300 dark:text-zinc-700" />
                            </div>
                            <p>Select a chat to start messaging</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Chat;
