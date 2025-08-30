"use client";

import Footer from '@/shared/components/Footer';

const ProfileScreen = () => {
    return (
        <div className="min-h-screen bg-gray-100 relative">
            {/* Header */}
            <div className="w-full p-5 bg-white flex justify-between items-center">
                <div className="text-center text-gray-800 font-gowun text-base font-normal">
                    프로필
                </div>
            </div>

            {/* Main Content */}
            <div className="px-6 py-8 flex justify-center items-center">
                <span className="text-2xl font-gowun text-gray-700">
                    마이페이지입니다~
                </span>
            </div>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default ProfileScreen;
