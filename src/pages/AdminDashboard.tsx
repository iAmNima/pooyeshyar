import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../firebase';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';
import ChatArea from '../components/ChatArea';
import TicketListSkeleton from '../components/TicketListSkeleton';
import ProfileModal from '../components/ProfileModal';

interface Ticket {
  id: string;
  companyId: string;
  name: string;
  organization: string;
  problem: string;
  status: 'open' | 'solved';
  createdAt: any;
}

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: any;
  type: 'text' | 'voice';
  audioUrl?: string;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState<boolean>(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [newMessage, setNewMessage] = useState<string>('');
  const [showOnlyOpen, setShowOnlyOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<'left' | 'right' | null>(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle browser back button for mobile navigation
  useEffect(() => {
    const handlePopState = () => {
      if (selectedTicket && window.innerWidth < 768) {
        selectTicketWithTransition(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedTicket]);

  // Fetch tickets with onSnapshot
  useEffect(() => {
    const q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ticketsData: Ticket[] = [];
      querySnapshot.forEach((doc) => {
        ticketsData.push({ id: doc.id, ...doc.data() } as Ticket);
      });
      setTickets(ticketsData.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
      setLoadingTickets(false);
    });
    return unsubscribe;
  }, []);

  // Fetch messages for selected ticket
  useEffect(() => {
    if (selectedTicket) {
      setLoadingMessages(true);
      const q = query(collection(db, 'tickets', selectedTicket.id, 'messages'), orderBy('timestamp'));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messagesData: Message[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          messagesData.push({ id: doc.id, type: data.type || 'text', ...data } as Message);
        });
        setMessages(messagesData);
        setLoadingMessages(false);
      });
      return unsubscribe;
    }
  }, [selectedTicket]);

  const sendMessage = async () => {
    if (newMessage.trim() && selectedTicket && currentUser) {
      await addDoc(collection(db, 'tickets', selectedTicket.id, 'messages'), {
        senderId: currentUser.uid,
        text: newMessage,
        timestamp: serverTimestamp(),
        type: 'text',
      });
      setNewMessage('');
    }
  };

  const sendAudio = async (audioBlob: Blob) => {
    if (selectedTicket && currentUser) {
      const storageRef = ref(storage, `audio/${Date.now()}_${currentUser.uid}.webm`);
      await uploadBytes(storageRef, audioBlob);
      const audioUrl = await getDownloadURL(storageRef);
      await addDoc(collection(db, 'tickets', selectedTicket.id, 'messages'), {
        senderId: currentUser.uid,
        text: '',
        timestamp: serverTimestamp(),
        type: 'voice',
        audioUrl,
      });
    }
  };

  const markAsSolved = async (ticketId: string) => {
    await updateDoc(doc(db, 'tickets', ticketId), { status: 'solved' });
  };

  const selectTicketWithTransition = (ticket: Ticket | null) => {
    if (isTransitioning) return;

    if (ticket && !selectedTicket && window.innerWidth < 768) {
      // Opening chat from ticket list - push history state
      window.history.pushState({ ticketId: ticket.id }, '', `#ticket-${ticket.id}`);
      setIsTransitioning(true);
      setTransitionDirection('left');
      setTimeout(() => {
        setSelectedTicket(ticket);
        setTimeout(() => {
          setIsTransitioning(false);
          setTransitionDirection(null);
        }, 300);
      }, 50);
    } else if (!ticket && selectedTicket && window.innerWidth < 768) {
      // Going back to ticket list from chat - replace history state
      window.history.replaceState({}, '', '');
      setIsTransitioning(true);
      setTransitionDirection('right');
      setTimeout(() => {
        setSelectedTicket(null);
        setTimeout(() => {
          setIsTransitioning(false);
          setTransitionDirection(null);
        }, 300);
      }, 50);
    } else {
      // Desktop or no transition needed
      setSelectedTicket(ticket);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 dark:bg-gray-900 p-0 md:p-8 gap-0 md:gap-6 page-fade">
      {/* Ticket List Sidebar - hidden on mobile if selectedTicket */}
      <div className={`w-full md:w-1/3 bg-white dark:bg-gray-800 shadow-soft rounded-none md:rounded-lg overflow-hidden h-full flex flex-col ${selectedTicket ? 'hidden md:block' : 'block'} ${isTransitioning && transitionDirection === 'left' && selectedTicket ? 'mobile-slide-out-left' : ''} ${isTransitioning && transitionDirection === 'right' && !selectedTicket ? 'mobile-slide-in-left' : ''}`}>
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-primary text-white">
          <h2 className="text-xl font-bold">تیکت ها</h2>
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="bg-white dark:bg-gray-700 text-primary px-3 py-1 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-600 shadow-sm transition-all duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
          >
            <span>👤</span>
            پروفایل
          </button>
        </div>
        <div className="p-4 border-b border-gray-200">
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="جستجو در تیکت ها..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </div>
          </div>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={showOnlyOpen}
              onChange={(e) => setShowOnlyOpen(e.target.checked)}
              className="rounded accent-primary focus:ring-2 focus:ring-primary mr-2"
            />
            <span className="text-sm font-medium ml-2 dark:text-gray-300">نمایش فقط تیکت های باز</span>
          </label>
        </div>
        {loadingTickets ? (
          <TicketListSkeleton count={5} height="h-28" showButton />
        ) : (
          <ul className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
            {(showOnlyOpen ? tickets.filter(t => t.status === 'open') : tickets)
              .filter((ticket) =>
                debouncedSearchTerm === '' ||
                ticket.problem.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                ticket.organization.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                ticket.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
              )
              .map((ticket) => (
              <li
                key={ticket.id}
                className={`p-4 cursor-pointer ${selectedTicket?.id !== ticket.id ? 'hover:bg-primary/20 active:bg-primary/25 hover:shadow-md' : ''} transition-all duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] border-l-4 shadow-sm h-28 flex flex-col ${selectedTicket?.id === ticket.id ? 'bg-primary/30' : ''} border-b border-gray-200 ${(!ticket.status || ticket.status === 'open') ? 'border-l-red-500' : ticket.status === 'solved' ? 'border-l-green-500' : 'border-l-gray-500'}`}
                onClick={() => selectTicketWithTransition(ticket)}
              >
                <div className="font-semibold text-gray-900 dark:text-white">{ticket.organization || 'سازمان نامشخص'}, {ticket.name || 'نام نامشخص'}</div>
                <div className="text-sm text-gray-700 dark:text-gray-300 truncate">{ticket.problem}</div>
                <div className="mt-auto flex justify-end pt-2">
                  {ticket.status !== 'solved' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); markAsSolved(ticket.id); }}
                      className="bg-primary text-white px-3 py-1 rounded text-xs hover:bg-primary/90 shadow-sm transition-all duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      حل شد
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Chat Area - full width on mobile, hidden if no selectedTicket on mobile */}
      <div className={`flex-1 h-full ${selectedTicket ? 'block' : 'hidden md:block'} ${isTransitioning && transitionDirection === 'left' && selectedTicket ? 'mobile-slide-in-right' : ''} ${isTransitioning && transitionDirection === 'right' && !selectedTicket ? 'mobile-slide-out-right' : ''}`}>
        <ChatArea
          selectedTicket={selectedTicket}
          messages={messages}
          loadingMessages={loadingMessages}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          sendMessage={sendMessage}
          sendAudio={sendAudio}
          currentUser={currentUser!}
          canSendMessage={selectedTicket?.status !== 'solved'}
          placeholder="پیام خود را تایپ کنید..."
          sendButtonText="ارسال"
          archivedMessage="این تیکت حل شده و بایگانی شده است."
          noTicketMessage="یک تیکت را انتخاب کنید تا چت شروع شود"
          onBack={() => selectTicketWithTransition(null)}
          backText="← بازگشت به تیکت ها"
        />
      </div>

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
};

export default AdminDashboard;