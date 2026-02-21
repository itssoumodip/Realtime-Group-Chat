import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Send, ArrowLeft, Check, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ── Tick component ─────────────────────────────────────────────────────────
// status: 'sending' | 'delivered' | 'read'
const MessageTick = ({ status }) => {
    if (status === 'sending') {
        return <Check className="inline h-3 w-3 ml-1 text-white/50" />;
    }
    if (status === 'delivered') {
        return <CheckCheck className="inline h-3 w-3 ml-1 text-white/50" />;
    }
    if (status === 'read') {
        return <CheckCheck className="inline h-3 w-3 ml-1 text-blue-400" />;
    }
    return null;
};

const SingleChatInterface = ({ currentUser, otherUser, socket, onBack }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [otherIsTyping, setOtherIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const chatId = [currentUser.uid, otherUser.id].sort().join('_');

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const formatTime = (date) => {
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12 || 12;
        return `${hours}:${minutes} ${ampm}`;
    };

    // Load chat history once on mount
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const response = await fetch(`${API_URL}/api/chats/${chatId}/messages`);
                const data = await response.json();

                const formatted = (data.messages || []).map(msg => ({
                    id: msg.id,
                    sender: msg.sender === currentUser.uid ? currentUser.username : otherUser.username,
                    text: msg.text,
                    isOwn: msg.sender === currentUser.uid,
                    timestamp: formatTime(new Date(msg.timestamp)),
                    // Historical messages from Firestore are delivered; mark own as 'read'
                    // since if they're in history, the other user likely loaded the chat too.
                    status: msg.sender === currentUser.uid ? 'delivered' : null
                }));

                setMessages(formatted);
            } catch (error) {
                console.error('Error fetching messages:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();
    }, [chatId]);

    // Socket.IO: join private room, listen for messages and read receipts
    useEffect(() => {
        if (!socket) return;

        // Join the private room
        socket.emit('joinPrivateRoom', {
            chatId,
            userId: currentUser.uid,
            username: currentUser.username
        });

        // Tell the other user we've opened this chat (marks their sent msgs as read)
        socket.emit('markRead', { chatId, readerUserId: currentUser.uid });

        // Receive new messages in real-time
        socket.on('privateMessage', (data) => {
            const incomingMsg = {
                id: `live_${Date.now()}_${Math.random()}`,
                sender: data.sender === currentUser.uid ? currentUser.username : otherUser.username,
                text: data.text,
                isOwn: data.sender === currentUser.uid,
                timestamp: formatTime(new Date(data.timestamp)),
                status: data.sender === currentUser.uid ? 'delivered' : null
            };

            setMessages(prev => {
                // Replace optimistic temp message with confirmed one (for the sender)
                const lastMsg = prev[prev.length - 1];
                if (
                    lastMsg?.id?.startsWith('temp_') &&
                    lastMsg.isOwn &&
                    incomingMsg.isOwn &&
                    lastMsg.text === incomingMsg.text
                ) {
                    return [...prev.slice(0, -1), incomingMsg];
                }
                return [...prev, incomingMsg];
            });

            // If we're the receiver, mark as read immediately
            if (data.sender !== currentUser.uid) {
                socket.emit('markRead', { chatId, readerUserId: currentUser.uid });
            }
        });

        // Listen for typing events from the other user
        socket.on('privateTyping', () => {
            setOtherIsTyping(true);
            // Clear after 3 seconds of silence
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => setOtherIsTyping(false), 3000);
        });

        // Other user opened the chat → turn our sent messages to blue ticks
        socket.on('messagesRead', ({ readerUserId }) => {
            if (readerUserId !== currentUser.uid) {
                setMessages(prev =>
                    prev.map(msg =>
                        msg.isOwn ? { ...msg, status: 'read' } : msg
                    )
                );
            }
        });

        return () => {
            socket.off('privateMessage');
            socket.off('messagesRead');
            socket.off('privateTyping');
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, [socket, chatId]);

    const handleTyping = (e) => {
        setNewMessage(e.target.value);
        if (socket && e.target.value.length > 0) {
            socket.emit('privateTyping', { chatId, username: currentUser.username });
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket) return;

        const text = newMessage.trim();
        setNewMessage('');

        // Optimistic update with 'sending' status (single grey tick)
        const tempMsg = {
            id: `temp_${Date.now()}`,
            sender: currentUser.username,
            text,
            isOwn: true,
            timestamp: formatTime(new Date()),
            status: 'sending'
        };
        setMessages(prev => [...prev, tempMsg]);

        socket.emit('privateMessage', {
            chatId,
            senderId: currentUser.uid,
            senderName: currentUser.username,
            text,
            members: [currentUser.uid, otherUser.id]
        });
    };

    return (
        <div className="flex flex-col h-[100dvh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-3 py-2 md:px-4 md:py-3 border-b border-gray-200 flex-shrink-0">
                <button
                    onClick={onBack}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>

                <Avatar className="w-8 h-8 md:w-10 md:h-10">
                    <AvatarFallback className="bg-gradient-to-br from-gray-700 to-gray-900 text-white font-semibold">
                        {otherUser.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                    <div className="text-sm font-medium text-[#303030]">{otherUser.username}</div>
                    <div className="text-xs text-gray-500">
                        {otherIsTyping ? (
                            <span className="italic text-[#075E54]">typing...</span>
                        ) : (
                            otherUser.email
                        )}
                    </div>
                </div>

                <div className="text-sm text-gray-500">
                    Signed in as{' '}
                    <span className="font-medium text-[#303030] capitalize">{currentUser.username}</span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 hide-scrollbar">
                <div className="max-w-3xl mx-auto space-y-4">
                    {loading ? (
                        <div className="text-center text-gray-500 mt-8">
                            <p>Loading messages...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center text-gray-500 mt-8">
                            <p>No messages yet. Start the conversation!</p>
                        </div>
                    ) : (
                        messages.map((message, index) => {
                            const prevMessage = index > 0 ? messages[index - 1] : null;
                            const isGroupStart = !prevMessage || prevMessage.sender !== message.sender;

                            return (
                                <div
                                    key={message.id}
                                    className={`flex items-start gap-3 ${message.isOwn ? 'flex-row-reverse message-outgoing' : 'message-incoming'}`}
                                    style={{ marginTop: !isGroupStart ? '2px' : '16px' }}
                                >
                                    {!message.isOwn && isGroupStart ? (
                                        <Avatar className="w-10 h-10 mt-0.5">
                                            <AvatarFallback className="bg-gradient-to-br from-gray-700 to-gray-900 text-white text-sm font-medium">
                                                {message.sender.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    ) : !message.isOwn ? (
                                        <div className="w-10 h-10" />
                                    ) : null}

                                    <div className={`flex-1 min-w-0 ${message.isOwn ? 'flex justify-end' : ''}`}>
                                        <div className={`max-w-md ${message.isOwn ? 'text-right' : ''}`}>
                                            {isGroupStart && (
                                                <div className={`flex items-baseline gap-2 mb-1 ${message.isOwn ? 'justify-end' : ''}`}>
                                                    <span className="text-sm font-semibold text-foreground">
                                                        {message.sender}
                                                    </span>
                                                </div>
                                            )}

                                            <div className={`relative inline-block ${message.isOwn
                                                ? 'bg-gradient-to-br from-gray-800 to-black text-white rounded-2xl rounded-tr-md'
                                                : 'bg-gradient-to-br from-gray-50 to-gray-100 text-foreground border border-gray-200/50 rounded-2xl rounded-tl-md'
                                                } px-4 py-2 backdrop-blur-sm`}>
                                                <p className="text-sm break-words leading-relaxed text-left inline">
                                                    {message.text}
                                                </p>
                                                <span className={`text-xs ml-2 align-middle ${message.isOwn ? 'text-white/60' : 'text-gray-500'}`}>
                                                    {message.timestamp}
                                                    {/* Ticks — only on own messages */}
                                                    {message.isOwn && <MessageTick status={message.status} />}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input */}
            <div className="bg-background border-t px-6 py-3 flex-shrink-0">
                <div className="max-w-3xl mx-auto">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <Input
                            type="text"
                            value={newMessage}
                            onChange={handleTyping}
                            placeholder="Message..."
                            className="flex-1 h-10 bg-secondary/50 border-0 focus-visible:ring-1"
                        />
                        <Button
                            type="submit"
                            disabled={!newMessage.trim()}
                            size="icon"
                            className="h-10 w-10"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SingleChatInterface;
