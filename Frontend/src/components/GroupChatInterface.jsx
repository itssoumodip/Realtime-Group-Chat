import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Send } from 'lucide-react';
import { toast } from 'sonner';

const GroupChatInterface = ({ username, socket }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [typingUsers, setTypingUsers] = useState([]);
    const [members, setMembers] = useState([]);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!socket) return;

        socket.on('roomNotice', (data) => {
            console.log(`${data.username} ${data.action} the group`);

            const displayName = data.username === username ? 'You' : data.username;

            if (data.action === 'joined') {
                toast.success(`${displayName} joined the group`, {
                    duration: 3000,
                });
            } else if (data.action === 'left') {
                toast.error(`${displayName} left the group`, {
                    duration: 3000,
                });
            }
        });

        socket.on('membersList', (membersList) => {
            console.log('Members list updated:', membersList);
            setMembers(membersList);
        });

        socket.on('chatMessage', (data) => {
            console.log('Received message:', data);

            const now = new Date();
            let hours = now.getHours();
            const minutes = now.getMinutes().toString().padStart(2, '0');
            const ampm = hours >= 12 ? 'pm' : 'am';
            hours = hours % 12 || 12; // Convert to 12-hour format
            const timestamp = `${hours}:${minutes} ${ampm}`;

            const newMsg = {
                id: Date.now() + Math.random(),
                sender: data.username,
                text: data.message,
                timestamp: timestamp,
                isOwn: data.username === username
            };

            setMessages((prev) => [...prev, newMsg]);
        })

        socket.on('typing', (data) => {
            const typingUser = data.username;
            if (typingUser !== username) {
                setTypingUsers((prev) => {
                    if (!prev.includes(typingUser)) {
                        return [...prev, typingUser];
                    }
                    return prev;
                });

                setTimeout(() => {
                    setTypingUsers((prev) => prev.filter(user => user !== typingUser));
                }, 3000);
            }
        });

        return () => {
            socket.off('roomNotice');
            socket.off('membersList');
            socket.off('chatMessage');
            socket.off('typing');
        };
    }, [socket, username]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim() && socket) {
            socket.emit('chatMessage', {
                username: username,
                message: newMessage.trim()
            });

            setNewMessage('');
            setTypingUsers([]);
        }
    };

    const handleTyping = (e) => {
        setNewMessage(e.target.value);

        if (socket && e.target.value.length > 0) {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            socket.emit('typing', { username });

            typingTimeoutRef.current = setTimeout(() => {
            }, 1000);
        }
    };

    return (
        <div className="flex flex-col h-screen max-h-screen overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-[#075E54] flex items-center justify-center">
                    <img className='h-10 w-10 rounded-full' src='/catgroup.jpg'></img>
                </div>
                <div className="flex-1">
                    <div className="text-sm font-medium text-[#303030]">Realtime Group Chat</div>
                    <div className="text-xs text-gray-500">
                        {typingUsers.length > 0 ? (
                            <span className="italic text-[#075E54]">
                                {typingUsers.length === 1
                                    ? `${typingUsers[0]} is typing...`
                                    : `${typingUsers.join(', ')} are typing...`
                                }
                            </span>
                        ) : members.length > 0 ?
                            (
                                <>
                                    {members
                                        .map(member => member === username ? 'You' : member)
                                        .slice(0, 3)
                                        .join(', ')}
                                    {members.length > 3 && ` +${members.length - 3} more`}
                                </>
                            ) : (
                                'No members yet'
                            )}
                    </div>
                </div>
                <div className="text-sm text-gray-500">
                    Signed in as{' '}
                    <span className="font-medium text-[#303030] capitalize">{username}</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 hide-scrollbar">
                <div className="max-w-3xl mx-auto space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center text-gray-500 mt-8">
                            <p>No messages yet. Start the conversation!</p>
                        </div>
                    )}

                    {messages.map((message, index) => {
                        const prevMessage = index > 0 ? messages[index - 1] : null;
                        const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;

                        const isGroupStart = !prevMessage || prevMessage.sender !== message.sender;
                        const isGroupEnd = !nextMessage || nextMessage.sender !== message.sender;
                        const isInGroup = !isGroupStart || !isGroupEnd;

                        return (
                            <div
                                key={message.id}
                                className={`flex items-start gap-3 ${message.isOwn ? 'flex-row-reverse message-outgoing' : 'message-incoming'} ${!isGroupStart ? (message.isOwn ? 'ml-0' : 'ml-0') : ''}`}
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
                    })}

                    <div ref={messagesEndRef} />
                </div>
            </div>

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

export default GroupChatInterface;
