import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Send, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SingleChatInterface = ({ currentUser, otherUser, onBack }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);
    const pollRef = useRef(null);

    // Generate consistent Chat ID by sorting UIDs
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

    const fetchMessages = async () => {
        try {
            const response = await fetch(`${API_URL}/api/chats/${chatId}/messages`);
            const data = await response.json();

            const formatted = (data.messages || []).map(msg => ({
                id: msg.id,
                sender: msg.sender === currentUser.uid ? currentUser.username : otherUser.username,
                text: msg.text,
                isOwn: msg.sender === currentUser.uid,
                timestamp: formatTime(new Date(msg.timestamp))
            }));

            setMessages(formatted);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();

        // Poll every 3 seconds for new messages
        pollRef.current = setInterval(fetchMessages, 3000);
        return () => clearInterval(pollRef.current);
    }, [chatId]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const text = newMessage.trim();
        setNewMessage('');

        // Optimistic update
        const tempMsg = {
            id: `temp_${Date.now()}`,
            sender: currentUser.username,
            text,
            isOwn: true,
            timestamp: formatTime(new Date())
        };
        setMessages(prev => [...prev, tempMsg]);

        try {
            await fetch(`${API_URL}/api/chats/${chatId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    senderId: currentUser.uid,
                    text,
                    members: [currentUser.uid, otherUser.id]
                })
            });
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
        }
    };

    return (
        <div className="flex flex-col h-[100dvh] overflow-hidden">
            {/* Header — same style as GroupChatInterface */}
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
                    <div className="text-xs text-gray-500">{otherUser.email}</div>
                </div>

                <div className="text-sm text-gray-500">
                    Signed in as{' '}
                    <span className="font-medium text-[#303030] capitalize">{currentUser.username}</span>
                </div>
            </div>

            {/* Messages area — same style as GroupChatInterface */}
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
                            const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;

                            const isGroupStart = !prevMessage || prevMessage.sender !== message.sender;
                            const isGroupEnd = !nextMessage || nextMessage.sender !== message.sender;

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
                                                <span className={`text-xs ml-2 ${message.isOwn ? 'text-white/60' : 'text-gray-500'}`}>
                                                    {message.timestamp}
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

            {/* Input bar — same style as GroupChatInterface */}
            <div className="bg-background border-t px-6 py-3 flex-shrink-0">
                <div className="max-w-3xl mx-auto">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <Input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
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
