import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Users, MessageCircle, Download } from 'lucide-react';
import Footer from './Footer';

const ModeSelector = ({ onModeSelect }) => {
    const [installPrompt, setInstallPrompt] = useState(null);
    const [installed, setInstalled] = useState(() => {
        if (window.matchMedia('(display-mode: standalone)').matches) return true;
        return localStorage.getItem('pwaInstalled') === 'true';
    });
    // Detect iOS Safari (no beforeinstallprompt support)
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        window.addEventListener('appinstalled', () => {
            setInstalled(true);
            setInstallPrompt(null);
            localStorage.setItem('pwaInstalled', 'true');
        });
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (installPrompt) {
            installPrompt.prompt();
            const { outcome } = await installPrompt.userChoice;
            if (outcome === 'accepted') {
                setInstalled(true);
                setInstallPrompt(null);
                localStorage.setItem('pwaInstalled', 'true');
            }
        } else {
            alert('To install: open this page in Chrome/Edge and tap the install icon (⊕) in the address bar, or use browser menu → "Add to Home Screen".');
        }
    };
    return (
        <div className="h-screen bg-gradient-to-br from-gray200 to-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-h-screen py-6 max-w-2xl">
                <div className="text-center mb-12">
                    <div className="h-16 w-16 rounded-full bg-[#075E54] flex items-center justify-center mx-auto mb-4">
                        <img className='h-16 w-16 rounded-full' src='/cats.jpg'></img>
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2">
                        Welcome to MeowChat
                    </h1>
                    <p className="text-gray-600 sm:text-lg text-md">
                        Choose ur chat mode to get started
                    </p>

                    {/* Install button — hidden if already installed or running as PWA */}
                    {!installed && !isInStandaloneMode && (
                        isIOS ? (
                            // iOS: can't auto-prompt, show instructions
                            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm border border-gray-300">
                                <span>📲</span>
                                <span>Tap <strong>Share</strong> → <strong>Add to Home Screen</strong> to install</span>
                            </div>
                        ) : (
                            <button
                                onClick={handleInstall}
                                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#075E54] text-white text-sm font-medium hover:bg-[#064a43] transition-colors shadow-md"
                            >
                                <Download className="h-4 w-4" />
                                Install App
                            </button>
                        )
                    )}
                    {(installed || isInStandaloneMode) && (
                        <p className="mt-3 text-sm text-[#075E54] font-medium">✓ App installed!</p>
                    )}
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
                        className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-[#128C7E] cursor-pointer transition-all hover:shadow-lg group relative overflow-hidden"
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
                        <div className="sm:flex items-center text-[#075E54] font-medium">
                            Get Started
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
