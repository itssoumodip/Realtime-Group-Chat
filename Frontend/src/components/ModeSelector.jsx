import React from 'react';
import { Button } from './ui/button';
import { Users, MessageCircle } from 'lucide-react';
import Footer from './Footer';

const ModeSelector = ({ onModeSelect }) => {
    return (
        <div className="h-screen bg-gradient-to-br from-gray200 to-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-h-screen py-6 max-w-2xl">
                <div className="text-center mb-12">
                    <div className="h-16 w-16 rounded-full bg-[#075E54] flex items-center justify-center mx-auto mb-4">
                        <img className='h-16 w-16 rounded-full' src='/cats.jpg'></img>
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2">
                        Welcome to Realtime Chat
                    </h1>
                    <p className="text-gray-600 sm:text-lg text-md">
                        Choose ur chat mode to get started
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div
                        onClick={() => onModeSelect('group')}
                        className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-[#075E54] cursor-pointer transition-all hover:shadow-lg group"
                    >
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#075E54] to-[#128C7E] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <img className='h-16 w-16 rounded-full' src='/catgroup.jpg'></img>
                        </div>
                        <h2 className="sm:text-2xl text-xl font-bold text-gray-900 mb-2">
                            Group Chat
                        </h2>
                        <p className="text-gray-600 sm:text-lg text-md mb-4">
                            Join a group room and chat with multiple people in real-time
                        </p>
                        <div className="sm:flex items-center text-[#075E54] font-medium">
                            Get Started
                            <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                        </div>
                    </div>

                    <div
                        onClick={() => onModeSelect('single')}
                        className="bg-d-2xl p-8 border-2 border-gray-200 hover:border-[#128C7E] cursor-pointer transition-all hover:shadow-lg group relative overflow-hidden"
                    >
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <img className='h-16 w-16 rounded-full' src='/singlecat.jpg'></img>
                        </div>
                        <h2 className="sm:text-2xl text-xl font-bold text-gray-900 mb-2">
                            Single Chat
                        </h2>
                        <p className="text-gray-600 sm:text-lg text-md mb-4">
                            Have a private one-on-one conversation with another user
                        </p>
                        <div className="sm:flex items-center text-gray-800 font-medium">
                            Coming Soon
                            <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                        </div>
                    </div>
                </div>


                <Footer />
            </div>
        </div>
    );
};

export default ModeSelector;
