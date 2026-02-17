
import React, { useState, useEffect, useRef } from 'react';
import { User, Shift, Leave, SitePost, AdvanceRequest, Announcement } from './types';
// import { MOCK_WORKERS, MOCK_ADMIN } from './constants';
import WorkerApp from './components/WorkerApp';
import AdminApp from './components/AdminApp';
import Login from './components/Login';
import { Language } from './translations';
import apiClient from './apiClient';
import { Loader2, Cloud, CloudOff } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [posts, setPosts] = useState<SitePost[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);
  const [advanceRequests, setAdvanceRequests] = useState<AdvanceRequest[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
    // Fetch all data from backend
    const fetchAllData = async () => {
      try {
        const [shiftsRes, leavesRes, postsRes, workersRes, advanceRes, announceRes] = await Promise.all([
          apiClient.get('/api/shifts'),
          apiClient.get('/api/leaves'),
          apiClient.get('/api/posts'),
          apiClient.get('/api/workers'),
          apiClient.get('/api/advanceRequests'),
          apiClient.get('/api/announcements'),
        ]);
        setShifts(shiftsRes.data || []);
        setLeaves(leavesRes.data || []);
        setPosts(postsRes.data || []);
        setWorkers(workersRes.data || []);
        setAdvanceRequests(advanceRes.data || []);
        setAnnouncements(announceRes.data || []);
      } catch (err) {
        // Optionally handle error
      } finally {
        setIsLoaded(true);
      }
    };

    useEffect(() => {
      fetchAllData();
    }, []);
  const [isSyncing, setIsSyncing] = useState(false);
  const [language, setLanguage] = useState<Language>('en');

  // Rehydrate auth from localStorage on load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token && role && !currentUser) {
      // Fetch user from backend
      apiClient.get('/api/auth/me').then(res => {
        setCurrentUser(res.data);
      }).catch(() => {
        setCurrentUser(null);
      });
    }
  }, []);

  // Data loading and updates should use apiClient and real endpoints only. Removed all polling and /api/data calls.

  // Sync state changes to MongoDB
  // We use custom setters to trigger cloud sync only when data actually changes

  const updateShifts: React.Dispatch<React.SetStateAction<Shift[]>> = (val) => {
    setShifts(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      setIsSyncing(true);
      apiClient.post('/api/shifts/batch', next)
        .then(fetchAllData)
        .catch(() => {/* handle error if needed */})
        .finally(() => setIsSyncing(false));
      return next;
    });
  };


  const updateLeaves: React.Dispatch<React.SetStateAction<Leave[]>> = (val) => {
    setLeaves(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      setIsSyncing(true);
      apiClient.post('/api/leaves/batch', next)
        .then(fetchAllData)
        .catch(() => {/* handle error if needed */})
        .finally(() => setIsSyncing(false));
      return next;
    });
  };


  const updateWorkers: React.Dispatch<React.SetStateAction<User[]>> = (val) => {
    setWorkers(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      setIsSyncing(true);
      apiClient.post('/api/workers/batch', next)
        .then(fetchAllData)
        .catch(() => {/* handle error if needed */})
        .finally(() => setIsSyncing(false));
      return next;
    });
  };


  const updatePosts: React.Dispatch<React.SetStateAction<SitePost[]>> = (val) => {
    setPosts(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      setIsSyncing(true);
      apiClient.post('/api/posts/batch', next)
        .then(fetchAllData)
        .catch(() => {/* handle error if needed */})
        .finally(() => setIsSyncing(false));
      return next;
    });
  };


  const updateAdvanceRequests: React.Dispatch<React.SetStateAction<AdvanceRequest[]>> = (val) => {
    setAdvanceRequests(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      setIsSyncing(true);
      apiClient.post('/api/advanceRequests/batch', next)
        .then(fetchAllData)
        .catch(() => {/* handle error if needed */})
        .finally(() => setIsSyncing(false));
      return next;
    });
  };


  const updateAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>> = (val) => {
    setAnnouncements(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      setIsSyncing(true);
      apiClient.post('/api/announcements/batch', next)
        .then(fetchAllData)
        .catch(() => {/* handle error if needed */})
        .finally(() => setIsSyncing(false));
      return next;
    });
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 space-y-4">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Loading Site Data...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} workers={workers} />;
  }

  return (
    <div 
      className={`min-h-screen max-w-md mx-auto bg-white shadow-xl relative overflow-hidden flex flex-col`}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Sync Indicator */}
      <div className="fixed top-4 right-4 z-[200] pointer-events-none">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase transition-all duration-500 shadow-sm ${isSyncing ? 'bg-amber-100 text-amber-600 animate-pulse' : 'bg-green-100 text-green-600'}`}>
          {isSyncing ? <Cloud className="animate-bounce" size={10} /> : <Cloud size={10} />}
          {isSyncing ? 'Syncing...' : 'Cloud Synced'}
        </div>
      </div>

      {currentUser.role === 'admin' ? (
        <AdminApp 
          user={currentUser} 
          shifts={shifts} 
          setShifts={updateShifts} 
          leaves={leaves} 
          setLeaves={updateLeaves}
          workers={workers}
          setWorkers={updateWorkers}
          posts={posts}
          setPosts={updatePosts}
          advanceRequests={advanceRequests}
          setAdvanceRequests={updateAdvanceRequests}
          announcements={announcements}
          setAnnouncements={updateAnnouncements}
          onLogout={handleLogout}
          language={language}
          setLanguage={setLanguage}
        />
      ) : (
        <WorkerApp 
          user={currentUser} 
          shifts={shifts} 
          setShifts={updateShifts} 
          leaves={leaves} 
          setLeaves={updateLeaves}
          posts={posts}
          setPosts={updatePosts}
          advanceRequests={advanceRequests}
          setAdvanceRequests={updateAdvanceRequests}
          announcements={announcements}
          workers={workers}
          onLogout={handleLogout}
          language={language}
          setLanguage={setLanguage}
        />
      )}
    </div>
  );
};

export default App;
