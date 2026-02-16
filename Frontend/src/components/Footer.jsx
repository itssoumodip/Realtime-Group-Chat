import React from 'react';

const Footer = () => {
    return (
        <div className="text-center mt-8 py-4">
            <p className="text-gray-600 text-sm">
                Made with <span className="text-red-500">❤️</span> by{' '}
                <a
                    href="https://github.com/itssoumodip"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[#075E54] hover:underline transition-all"
                >
                    Soumodip
                </a>
            </p>
        </div>
    );
};

export default Footer;
