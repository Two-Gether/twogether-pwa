"use client";

import Footer from '@/components/Footer';

const ProfileScreen = () => {
    return (
        <div className="min-h-screen bg-gray-100 relative">


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
