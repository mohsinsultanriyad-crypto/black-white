
import React, { useState, useEffect, useRef } from 'react';
import { User, Shift, Leave, SitePost, AdvanceRequest, Announcement } from './types';
import { MOCK_WORKERS, MOCK_ADMIN } from './constants';
import WorkerApp from './components/WorkerApp';
import AdminApp from './components/AdminApp';
import Login from './components/Login';
import { Language } from './translations';
import { db } from './db';
import { Loader2, Cloud, CloudOff } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [posts, setPosts] = useState<SitePost[]>([]);
  const [workers, setWorkers] = useState<User[]>(MOCK_WORKERS);
  const [advanceRequests, setAdvanceRequests] = useState<AdvanceRequest[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [language, setLanguage] = useState<Language>('en');

  // Load from MongoDB on Init
  useEffect(() => {
    const initData = async () => {
      try {
        const [dbShifts, dbLeaves, dbPosts, dbWorkers, dbAdvances, dbAnnounce] = await Promise.all([
          db.getAll<Shift>('shifts'),
          db.getAll<Leave>('leaves'),
          db.getAll<SitePost>('posts'),
          db.getAll<User>('workers'),
          db.getAll<AdvanceRequest>('advanceRequests'),
          db.getAll<Announcement>('announcements'),
        ]);

        if (dbShifts.length) setShifts(dbShifts);
        if (dbLeaves.length) setLeaves(dbLeaves);
        if (dbPosts.length) setPosts(dbPosts);
        if (dbWorkers.length) setWorkers(dbWorkers);
        if (dbAdvances.length) setAdvanceRequests(dbAdvances);
        if (dbAnnounce.length) setAnnouncements(dbAnnounce);

        // Removed localStorage usage for language. Language will be kept in state only.
      } catch (e) {
        console.error("Initial cloud fetch failed, using defaults", e);
      } finally {
        setIsLoaded(true);
      }
    };
    initData();
  }, []);

  // Sync state changes to MongoDB
  // We use custom setters to trigger cloud sync only when data actually changes
  const updateShifts: React.Dispatch<React.SetStateAction<Shift[]>> = (val) => {
    setShifts(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      // Identify new/changed shifts and sync them
      setIsSyncing(true);
      db.saveBatch('shifts', next).finally(() => setIsSyncing(false));
      return next;
    });
  };

  const updateLeaves: React.Dispatch<React.SetStateAction<Leave[]>> = (val) => {
    setLeaves(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      setIsSyncing(true);
      db.saveBatch('leaves', next).finally(() => setIsSyncing(false));
      return next;
    });
  };

  const updateWorkers: React.Dispatch<React.SetStateAction<User[]>> = (val) => {
    setWorkers(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      setIsSyncing(true);
      db.saveBatch('workers', next).finally(() => setIsSyncing(false));
      return next;
    });
  };

  const updatePosts: React.Dispatch<React.SetStateAction<SitePost[]>> = (val) => {
    setPosts(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      setIsSyncing(true);
      db.saveBatch('posts', next).finally(() => setIsSyncing(false));
      return next;
    });
  };

  const updateAdvanceRequests: React.Dispatch<React.SetStateAction<AdvanceRequest[]>> = (val) => {
    setAdvanceRequests(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      setIsSyncing(true);
      db.saveBatch('advanceRequests', next).finally(() => setIsSyncing(false));
      return next;
    });
  };

  const updateAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>> = (val) => {
    setAnnouncements(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      setIsSyncing(true);
      db.saveBatch('announcements', next).finally(() => setIsSyncing(false));
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
