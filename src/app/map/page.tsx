"use client";

import Footer from '@/shared/components/Footer';

const MapScreen = () => {
    return (
        <div className="min-h-screen bg-gray-100 relative">
            {/* Header */}
            <div className="w-full p-5 bg-white flex justify-between items-center">
                <div className="text-center text-gray-800 font-gowun text-base font-normal">
                    지도
                </div>
            </div>

            {/* Main Content */}
            <div className="px-6 py-8">
                <div className="text-center text-gray-600">
                    카카오맵 연동 예정
                </div>
            </div>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default MapScreen;
