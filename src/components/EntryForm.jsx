import React, { useState, useEffect } from 'react';
import { Activity, Sparkles, HeartHandshake, FileText } from 'lucide-react';

const EntryForm = ({ user, selectedDate, onSave, initialData }) => {
    const defaultFormData = {
        wakeUpTime: '', daySleep: '', toBedTime: '',
        japaTime: '', shikshastakam: 'absent', mangalAarti: 'absent', morningClass: 'absent',
        readSpMins: '', readSlokaMins: '', hearSpMins: '', hearSmMins: '', hearRspMins: '',
        menialService: '', missionaryService: '', harinamSankirtan: '', dailyNote: ''
    };

    const [formData, setFormData] = useState(defaultFormData);

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData(defaultFormData);
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-500">
            {/* Body Section */}
            <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                <h3 className="text-lg font-semibold text-blue-800 pb-2 mb-4 flex items-center gap-2 border-b border-blue-200">
                    <Activity className="w-5 h-5" /> Body (Nidra)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">Wake Up Time</label>
                        <input type="time" name="wakeUpTime" value={formData.wakeUpTime} onChange={handleChange} className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500" />
                        <p className="text-xs text-gray-500 mt-1">Target: &lt; 04:30</p>
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">Day Sleep (mins)</label>
                        <input type="number" name="daySleep" value={formData.daySleep} onChange={handleChange} className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500" />
                        <p className="text-xs text-gray-500 mt-1">Target: &lt; 60 mins</p>
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">Bed Time</label>
                        <input type="time" name="toBedTime" value={formData.toBedTime} onChange={handleChange} className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500" />
                        <p className="text-xs text-gray-500 mt-1">Target: &lt; 21:30</p>
                    </div>
                </div>
            </div>

            {/* Soul Section */}
            <div className="bg-purple-50/50 p-6 rounded-xl border border-purple-100">
                <h3 className="text-lg font-semibold text-purple-800 pb-2 mb-4 flex items-center gap-2 border-b border-purple-200">
                    <Sparkles className="w-5 h-5" /> Soul (Japa & MP)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">Japa Finish Time</label>
                        <input type="time" name="japaTime" value={formData.japaTime} onChange={handleChange} className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500" />
                        <p className="text-xs text-gray-500 mt-1">Target: &lt; 08:00</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['shikshastakam', 'mangalAarti', 'morningClass'].map((field) => (
                        <div key={field}>
                            <label className="block mb-2 text-sm font-medium text-gray-700 capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
                            <select name={field} value={formData[field]} onChange={handleChange} className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 bg-white">
                                <option value="absent">Absent</option>
                                <option value="late">Late</option>
                                <option value="present">Present</option>
                            </select>
                        </div>
                    ))}
                </div>
            </div>

            {/* Service & Notes */}
            <div className="bg-orange-50/50 p-6 rounded-xl border border-orange-100">
                <h3 className="text-lg font-semibold text-orange-800 pb-2 mb-4 flex items-center gap-2 border-b border-orange-200">
                    <HeartHandshake className="w-5 h-5" /> Service & Reflection
                </h3>
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="col-span-1">
                        <label className="block mb-2 text-xs font-bold text-gray-500 uppercase">Menial</label>
                        <input type="number" name="menialService" value={formData.menialService} onChange={handleChange} className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500" placeholder="mins" />
                    </div>
                    <div className="col-span-1">
                        <label className="block mb-2 text-xs font-bold text-gray-500 uppercase">Missionary</label>
                        <input type="number" name="missionaryService" value={formData.missionaryService} onChange={handleChange} className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500" placeholder="mins" />
                    </div>
                    <div className="col-span-1">
                        <label className="block mb-2 text-xs font-bold text-gray-500 uppercase">Harinam</label>
                        <input type="number" name="harinamSankirtan" value={formData.harinamSankirtan} onChange={handleChange} className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500" placeholder="mins" />
                    </div>
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Daily Reflection
                    </label>
                    <textarea name="dailyNote" value={formData.dailyNote} onChange={handleChange} rows="3" className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500" placeholder="Share your insights, realizations, or challenges..."></textarea>
                </div>
            </div>

            <button type="submit" className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-xl text-lg px-5 py-4 shadow-lg transition-all transform hover:-translate-y-1">
                Save Sadhana Entry
            </button>
        </form>
    );
};

export default EntryForm;
