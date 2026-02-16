import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Send } from 'lucide-react';

const GroupChatInterface = ({ username, socket }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

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

        // TODO: Add more socket event listeners here
        // Example:
        // socket.on('chatMessage', (data) => {
        //   // Handle incoming messages
        // });

        // Cleanup listeners on unmount
        return () => {
            socket.off('roomNotice');
            // socket.off('chatMessage');
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
        }
    };

    return (
        <div className="h-screen bg-white flex flex-col">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
                <div className="h-10 w-10 rounded-full bg-[#075E54] flex items-center justify-center">
                    <img className='h-10 w-10 rounded-full' src='/catgroup.jpg'></img>
                </div>
                <div className="flex-1">
                    <div className="text-sm font-medium text-[#303030]">Realtime Group Chat</div>
                </div>
                <div className="text-sm text-gray-500">
                    Signed in as{' '}
                    <span className="font-medium text-[#303030] capitalize">{username}</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
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
                                className={`flex items-start gap-3 ${message.isOwn ? 'flex-row-reverse' : ''} ${!isGroupStart ? (message.isOwn ? 'ml-0' : 'ml-0') : ''}`}
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

            <div className="bg-background border-t px-6 py-3">
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

export default GroupChatInterface;
