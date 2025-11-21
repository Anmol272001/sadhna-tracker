import React, { useState, useEffect } from 'react';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import {
  LayoutDashboard,
  Edit3,
  BarChart2,
  TrendingUp,
  LogOut,
  Activity,
  Sparkles,
  FileText,
  Users,
  Loader2
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Config & Utils
import { auth, db, firebaseConfig } from './config/firebase';
import { getFormattedDate, calculateScores } from './utils/helpers';

// Components
import StatCard from './components/StatCard';
import EntryForm from './components/EntryForm';
import MentorDashboard from './components/MentorDashboard';

// Register ChartJS
ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  PointElement, LineElement, ArcElement
);

// --- MAIN APP ---
export default function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, entry, history, mentor
  const [entries, setEntries] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getFormattedDate(new Date()));

  // Stats State
  const [stats, setStats] = useState({
    today: { total: 0, body: 0, soul: 0, sadhana: 0 },
    weekly: []
  });

  // --- AUTHENTICATION ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);
        // Fetch User Profile (Simulated Role)
        // In a real app, this comes from a 'users' collection
        const profileRef = doc(db, `artifacts/${firebaseConfig.projectId}/users`, currentUser.uid);
        try {
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            setUserProfile(profileSnap.data());
          } else {
            // Create default profile
            const newProfile = {
              email: currentUser.email,
              displayName: currentUser.displayName,
              role: 'user', // Change to 'mentor' manually in Firestore to test RBAC
              photoURL: currentUser.photoURL
            };
            await setDoc(profileRef, newProfile);
            setUserProfile(newProfile);
          }
          await fetchData(currentUser.uid);
        } catch (error) {
          console.error("Profile Error:", error);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchData = async (uid) => {
    const q = query(
      collection(db, `artifacts/${firebaseConfig.projectId}/users/${uid}/sadhanaEntries`),
      orderBy("date", "desc"),
      limit(30) // Get last 30 days for history
    );

    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
    setEntries(data);

    // Calculate Stats
    const todayStr = getFormattedDate(new Date());
    const todayEntry = data.find(e => e.date === todayStr);

    setStats({
      today: todayEntry ? {
        total: todayEntry.totalScore,
        body: todayEntry.bodyScore,
        soul: todayEntry.soulScore,
        sadhana: todayEntry.sadhanaScore
      } : { total: 0, body: 0, soul: 0, sadhana: 0 },
      weekly: data.slice(0, 7).reverse() // Last 7 entries for chart
    });
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      console.error("Login Failed:", error);
    }
  };

  const handleSaveEntry = async (formData) => {
    const scores = calculateScores(formData);
    const serviceData = {
      menialService: parseInt(formData.menialService) || 0,
      missionaryService: parseInt(formData.missionaryService) || 0,
      harinamSankirtan: parseInt(formData.harinamSankirtan) || 0,
    };
    serviceData.totalServiceTime = serviceData.menialService + serviceData.missionaryService + serviceData.harinamSankirtan;

    const entry = {
      date: selectedDate,
      totalScore: scores.total,
      bodyScore: scores.body,
      soulScore: scores.soul,
      sadhanaScore: scores.sadhana,
      formData,
      serviceData,
      dailyNote: formData.dailyNote,
      userId: user.uid,
      lastUpdated: new Date().toISOString()
    };

    try {
      const entryRef = doc(db, `artifacts/${firebaseConfig.projectId}/users/${user.uid}/sadhanaEntries/${selectedDate}`);
      await setDoc(entryRef, entry, { merge: true });
      await fetchData(user.uid);
      setActiveTab('dashboard');
    } catch (error) {
      console.error("Save Error:", error);
      alert("Failed to save entry. Check console.");
    }
  };

  const getInitialFormData = () => {
    const entry = entries.find(e => e.date === selectedDate);
    if (entry) {
      return { ...entry.formData, dailyNote: entry.dailyNote || '', ...entry.serviceData };
    }
    return null; // Return null to use default state in form
  };

  // --- RENDER ---
  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-blue-50">
      <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
      <p className="text-blue-800 font-medium animate-pulse">Loading Sadhana Tracker...</p>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-blue-600 p-8 text-center">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Activity className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-white">Sadhana Tracker</h1>
          <p className="text-blue-100 mt-2">Track habits. Elevate consciousness.</p>
        </div>
        <div className="p-8">
          <button
            onClick={handleLogin}
            className="w-full bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-800 font-semibold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-3"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
            Sign in with Google
          </button>
          <p className="text-center text-xs text-gray-400 mt-6">Secure authentication powered by Firebase</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-slate-200">
        <div className="container mx-auto px-4 max-w-6xl h-16 flex justify-between items-center">
          <div className="flex items-center gap-2 text-blue-700" onClick={() => setActiveTab('dashboard')}>
            <Activity className="w-6 h-6" />
            <span className="text-lg font-bold hidden sm:inline">Sadhana Tracker</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => setActiveTab('dashboard')} className={`text-sm font-medium transition ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}>Dashboard</button>
            <button onClick={() => setActiveTab('entry')} className={`text-sm font-medium transition ${activeTab === 'entry' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}>Entry</button>
            <button onClick={() => setActiveTab('history')} className={`text-sm font-medium transition ${activeTab === 'history' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}>History</button>
            {(userProfile?.role === 'mentor' || userProfile?.role === 'admin') && (
              <button onClick={() => setActiveTab('mentor')} className={`text-sm font-medium transition ${activeTab === 'mentor' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}>Mentor View</button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-800">{user.displayName}</p>
              <p className="text-xs text-blue-600 capitalize">{userProfile?.role || 'Devotee'}</p>
            </div>
            <img src={user.photoURL} alt="User" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
            <button onClick={() => signOut(auth)} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-6xl">

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Overview</h1>
                <p className="text-gray-500">Your spiritual scorecard for {getFormattedDate(new Date())}</p>
              </div>
              <button onClick={() => setActiveTab('entry')} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-2">
                <Edit3 className="w-4 h-4" /> Log Today
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Score" current={stats.today.total} max={180} color="ocean" icon={TrendingUp} />
              <StatCard title="Body (Nidra)" current={stats.today.body} max={75} color="blue" icon={Activity} />
              <StatCard title="Soul (Japa)" current={stats.today.soul} max={40} color="purple" icon={Sparkles} />
              <StatCard title="Sadhana (Read)" current={stats.today.sadhana} max={65} color="green" icon={FileText} />
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-gray-800 mb-6">Weekly Trend</h3>
              <div className="h-64">
                <Line
                  data={{
                    labels: stats.weekly.map(e => e.date.slice(5)),
                    datasets: [{
                      label: 'Total Score',
                      data: stats.weekly.map(e => e.totalScore),
                      borderColor: '#0891b2',
                      backgroundColor: 'rgba(8, 145, 178, 0.1)',
                      tension: 0.4,
                      fill: true
                    }]
                  }}
                  options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 180 } } }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Entry Tab */}
        {activeTab === 'entry' && (
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Log Sadhana</h2>
              <input
                type="date"
                value={selectedDate}
                max={getFormattedDate(new Date())}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <EntryForm
              user={user}
              selectedDate={selectedDate}
              onSave={handleSaveEntry}
              initialData={getInitialFormData()}
            />
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold text-gray-800">History Log</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Body</th>
                      <th className="px-6 py-4">Soul</th>
                      <th className="px-6 py-4">Sadhana</th>
                      <th className="px-6 py-4">Total</th>
                      <th className="px-6 py-4">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map(entry => (
                      <tr key={entry.id} className="border-b hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-medium">{entry.date}</td>
                        <td className="px-6 py-4">{entry.bodyScore}</td>
                        <td className="px-6 py-4">{entry.soulScore}</td>
                        <td className="px-6 py-4">{entry.sadhanaScore}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${entry.totalScore >= 150 ? 'bg-green-100 text-green-700' :
                              entry.totalScore >= 100 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                            }`}>
                            {entry.totalScore}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 truncate max-w-xs">
                          {entry.dailyNote || '-'}
                        </td>
                      </tr>
                    ))}
                    {entries.length === 0 && (
                      <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-400">No entries found. Start logging!</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Mentor Tab */}
        {activeTab === 'mentor' && (
          <MentorDashboard currentUserId={user.uid} />
        )}

      </main>

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden flex justify-around p-3 z-50">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-gray-400'}`}>
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-[10px] mt-1">Dash</span>
        </button>
        <button onClick={() => setActiveTab('entry')} className={`flex flex-col items-center ${activeTab === 'entry' ? 'text-blue-600' : 'text-gray-400'}`}>
          <Edit3 className="w-6 h-6" />
          <span className="text-[10px] mt-1">Entry</span>
        </button>
        <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center ${activeTab === 'history' ? 'text-blue-600' : 'text-gray-400'}`}>
          <BarChart2 className="w-6 h-6" />
          <span className="text-[10px] mt-1">History</span>
        </button>
        {userProfile?.role === 'mentor' && (
          <button onClick={() => setActiveTab('mentor')} className={`flex flex-col items-center ${activeTab === 'mentor' ? 'text-blue-600' : 'text-gray-400'}`}>
            <Users className="w-6 h-6" />
            <span className="text-[10px] mt-1">Mentor</span>
          </button>
        )}
      </div>
    </div>
  );
}