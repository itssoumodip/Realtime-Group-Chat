import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { MessageCircle, LogOut } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const UserList = ({ currentUser, onSelectUser, onLogout }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch(`${API_URL}/api/users`);
                const data = await response.json();
                // Exclude current user from the list
                const filtered = (data.users || []).filter(u => u.id !== currentUser.uid);
                setUsers(filtered);
            } catch (error) {
                console.error('Error fetching users:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [currentUser]);

    const handleLogout = () => {
        localStorage.removeItem('chatUser');
        onLogout();
    };

    return (
        <div className="flex flex-col h-[100dvh] overflow-hidden">
            <div className="flex items-center gap-3 px-3 py-2 md:px-4 md:py-3 border-b border-gray-200 flex-shrink-0">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                    <img className='rounded-full' src="/singlecat.jpg" alt="Logo" />
                </div>
                <div className="flex-1">
                    <div className="text-sm font-medium text-[#303030]">Single Chat</div>
                    <div className="text-xs text-gray-500">{users.length} user{users.length !== 1 ? 's' : ''} available</div>
                </div>
                <div className="text-sm text-gray-500">
                    Signed in as{' '}
                    <span className="font-medium text-[#303030] capitalize">{currentUser.username}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                    <LogOut className="h-4 w-4 text-gray-500" />
                </Button>
            </div>

            {/* User list */}
            <div className="flex-1 overflow-y-auto px-6 py-4 hide-scrollbar">
                <div className="max-w-full mx-auto">
                    {loading ? (
                        <div className="text-center text-gray-500 mt-8">
                            <p>Loading users...</p>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center text-gray-500 mt-8">
                            <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p>No other users yet.</p>
                            <p className="text-sm mt-1">Open the app in another window and sign up!</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {users.map(user => (
                                <div
                                    key={user.id}
                                    onClick={() => onSelectUser(user)}
                                    className="flex items-center gap-3 p-3 rounded-2xl border border-gray-200/50 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all cursor-pointer"
                                >
                                    <Avatar className="w-10 h-10">
                                        <AvatarFallback className="bg-gradient-to-br from-gray-700 to-gray-900 text-white font-semibold">
                                            {user.username?.charAt(0).toUpperCase() || '?'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="text-sm font-semibold text-foreground">{user.username}</div>
                                        <div className="text-xs text-gray-500">{user.email}</div>
                                    </div>
                                    <MessageCircle className="h-4 w-4 text-gray-400" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserList;
