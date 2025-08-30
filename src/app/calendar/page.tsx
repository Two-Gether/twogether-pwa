"use client";

import Footer from '@/components/Footer';

const CalendarScreen = () => {
    return (
        <div className="min-h-screen bg-gray-100 relative">


            {/* Main Content */}
            <div className="px-6 py-8 flex justify-center items-center">
                <span className="text-2xl font-gowun text-gray-700">
                    캘린더 페이지입니다~
                </span>
            </div>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default CalendarScreen;
