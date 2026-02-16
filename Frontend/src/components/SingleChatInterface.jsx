import React from 'react';
import { MessageCircle } from 'lucide-react';

const SingleChatInterface = ({ username, socket }) => {
    return (
        <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <div className="text-center max-w-md">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center mx-auto mb-6">
                    <MessageCircle className="h-12 w-12 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                    Single Chat
                </h1>
                <p className="text-gray-600 text-lg mb-4">
                    Coming Soon!
                </p>
                <p className="text-gray-500">
                    We're working on bringing you one-on-one chat functionality.
                    <br />
                    Stay tuned for updates!
                </p>

                <div className="mt-8 p-4 bg-white rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">
                        Logged in as: <span className="font-semibold text-gray-900 capitalize">{username}</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SingleChatInterface;
