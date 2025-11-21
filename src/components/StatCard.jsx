import React from 'react';

const StatCard = ({ title, current, max, color, icon: Icon }) => {
    const percent = Math.round((current / max) * 100);
    const colorClasses = {
        blue: 'text-blue-600 bg-blue-500',
        purple: 'text-purple-600 bg-purple-500',
        green: 'text-green-600 bg-green-500',
        ocean: 'text-cyan-700 bg-cyan-600'
    };

    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between transition-transform hover:scale-[1.02]">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-700">{title}</h3>
                <Icon className={`w-5 h-5 ${colorClasses[color].split(' ')[0]}`} />
            </div>
            <div className="text-3xl font-bold text-gray-800">
                {current} <span className="text-sm text-gray-400 font-normal">/ {max}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 mt-3 overflow-hidden">
                <div
                    className={`h-2 rounded-full transition-all duration-500 ${colorClasses[color].split(' ')[1]}`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                ></div>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-right">{percent}% Completed</p>
        </div>
    );
};

export default StatCard;
