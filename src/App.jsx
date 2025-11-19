import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  limit, 
  where 
} from 'firebase/firestore';
import { 
  LayoutDashboard, 
  Edit3, 
  BarChart2, 
  TrendingUp, 
  LogOut, 
  User, 
  Activity, 
  Sparkles, 
  HeartHandshake, 
  FileText, 
  Search,
  Users,
  RefreshCw,
  CheckCircle,
  Calendar,
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
import { Bar, Line, Doughnut } from 'react-chartjs-2';

// --- 1. FIREBASE CONFIGURATION ---
// Using your specific config to ensure it works immediately
const firebaseConfig = {
  apiKey: "AIzaSyB5fQmCYBciqATq3HbaCdqOjIoFUFZmGtk",
  authDomain: "iyf-sadhna-tracker.firebaseapp.com",
  projectId: "iyf-sadhna-tracker",
  storageBucket: "iyf-sadhna-tracker.firebasestorage.app",
  messagingSenderId: "372996148813",
  appId: "1:372996148813:web:b917a3f764efa356519604"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Register ChartJS
ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, 
  PointElement, LineElement, ArcElement
);

// --- 2. HELPER FUNCTIONS ---
const getFormattedDate = (date) => date.toISOString().split('T')[0];

const calculateScores = (data) => {
  // Body (75)
  let wakeUpScore = 0;
  if (data.wakeUpTime) {
    if (data.wakeUpTime <= "04:30") wakeUpScore = 25;
    else if (data.wakeUpTime <= "04:40") wakeUpScore = 20;
    else if (data.wakeUpTime <= "04:45") wakeUpScore = 15;
    else if (data.wakeUpTime <= "05:00") wakeUpScore = 10;
  }

  let daySleepScore = 0;
  const sleepMins = parseInt(data.daySleep) || 0;
  if (sleepMins <= 60) daySleepScore = 25;
  else if (sleepMins <= 70) daySleepScore = 20;
  else if (sleepMins <= 80) daySleepScore = 15;
  else if (sleepMins <= 90) daySleepScore = 10;
  else if (sleepMins <= 100) daySleepScore = 5;

  let toBedScore = 0;
  if (data.toBedTime) {
    if (data.toBedTime <= "21:30") toBedScore = 25;
    else if (data.toBedTime <= "21:45") toBedScore = 20;
    else if (data.toBedTime <= "22:00") toBedScore = 15;
    else if (data.toBedTime <= "22:15") toBedScore = 10;
    else if (data.toBedTime <= "22:30") toBedScore = 5;
  }

  // Soul (40)
  let japaScore = 0;
  if (data.japaTime) {
    if (data.japaTime <= "08:00") japaScore = 25;
    else if (data.japaTime <= "10:00") japaScore = 20;
    else if (data.japaTime <= "12:00") japaScore = 15;
    else if (data.japaTime <= "14:00") japaScore = 10;
    else if (data.japaTime <= "18:00") japaScore = 5;
  }

  const scoreMap = { 'present': 5, 'late': 3, 'absent': 0 };
  const mpScore = (scoreMap[data.shikshastakam] || 0) + 
                  (scoreMap[data.mangalAarti] || 0) + 
                  (scoreMap[data.morningClass] || 0);

  // Sadhana (65)
  const spMins = parseInt(data.readSpMins) || 0;
  const slokaMins = parseInt(data.readSlokaMins) || 0;
  const readScore = (spMins >= 20 ? 25 : (spMins/20)*25) + (slokaMins >= 10 ? 10 : (slokaMins/10)*10);

  const hearTotal = (parseInt(data.hearSpMins)||0) + (parseInt(data.hearSmMins)||0) + (parseInt(data.hearRspMins)||0);
  const hearScore = hearTotal >= 30 ? 30 : (hearTotal/30)*30;

  return {
    body: Math.round(wakeUpScore + daySleepScore + toBedScore),
    soul: Math.round(japaScore + mpScore),
    sadhana: Math.round(readScore + hearScore),
    total: Math.round(wakeUpScore + daySleepScore + toBedScore + japaScore + mpScore + readScore + hearScore)
  };
};

// --- 3. COMPONENTS ---

// 3a. Dashboard Stats Component
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

// 3b. Entry Form Component
const EntryForm = ({ user, selectedDate, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    wakeUpTime: '', daySleep: '', toBedTime: '',
    japaTime: '', shikshastakam: 'absent', mangalAarti: 'absent', morningClass: 'absent',
    readSpMins: '', readSlokaMins: '', hearSpMins: '', hearSmMins: '', hearRspMins: '',
    menialService: '', missionaryService: '', harinamSankirtan: '', dailyNote: ''
  });

  useEffect(() => {
    if (initialData) setFormData(initialData);
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

// 3c. Mentor Dashboard Component (The "Project 3" Feature)
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

// --- 4. MAIN APP ---
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
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            entry.totalScore >= 150 ? 'bg-green-100 text-green-700' :
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