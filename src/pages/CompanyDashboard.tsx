import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../firebase';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, where, limit } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';
import TicketForm from '../components/TicketForm';
import ChatArea from '../components/ChatArea';
import TicketListSkeleton from '../components/TicketListSkeleton';
import ProfileModal from '../components/ProfileModal';
import { useSwipe } from '../hooks/useSwipe';
import { usePullToRefresh } from '../hooks/usePullToRefresh';

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

const CompanyDashboard: React.FC = () => {
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
  const [showForm, setShowForm] = useState<boolean>(false);
  const [lastMessages, setLastMessages] = useState<Record<string, string>>({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<'left' | 'right' | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const ticketListRef = useRef<HTMLDivElement>(null);

  // Pull-to-refresh for ticket list
  const refreshTickets = useCallback(async () => {
    if (currentUser) {
      setLoadingTickets(true);
      // Simulate network delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Since we're using onSnapshot, the data should be real-time
      // But we can force a refresh by clearing and re-setting loading state
      setLoadingTickets(false);
    }
  }, [currentUser]);

  const {
    isRefreshing: isRefreshingTickets,
    handleTouchStart: handlePullStart,
    handleTouchMove: handlePullMove,
    handleTouchEnd: handlePullEnd,
    getTransformStyle: getPullTransformStyle
  } = usePullToRefresh({
    onRefresh: refreshTickets,
    pullThreshold: 80,
    maxPullDistance: 120
  });

  // Swipe handlers for mobile navigation
  const { handleTouchStart, handleTouchEnd } = useSwipe({
    onSwipeRight: () => {
      // Swipe right to go back to ticket list from chat
      if (selectedTicket && window.innerWidth < 768 && !isTransitioning) {
        setIsTransitioning(true);
        setTransitionDirection('right');
        setTimeout(() => {
          setSelectedTicket(null);
          setTimeout(() => {
            setIsTransitioning(false);
            setTransitionDirection(null);
          }, 300);
        }, 50);
      }
    },
    onSwipeLeft: () => {
      // Swipe left to open chat from ticket list (only if we have tickets)
      if (!selectedTicket && tickets.length > 0 && window.innerWidth < 768 && !isTransitioning) {
        // For now, we'll let users tap to select tickets
        // Could potentially select the first ticket, but tap is more intuitive
      }
    },
    minSwipeDistance: 80, // Require more distance for mobile
    maxSwipeTime: 500
  });

  // Fetch tickets with onSnapshot, filtered by companyId
  useEffect(() => {
    if (currentUser) {
      console.log('Setting up ticket listener for user:', currentUser.uid);
      const q = query(collection(db, 'tickets'), where('companyId', '==', currentUser.uid));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        console.log('onSnapshot triggered, docs count:', querySnapshot.size);
        const ticketsData: Ticket[] = [];
        querySnapshot.forEach((doc) => {
          ticketsData.push({ id: doc.id, ...doc.data() } as Ticket);
        });
        console.log('Tickets data:', ticketsData);
        setTickets(ticketsData.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
        setLoadingTickets(false);
      });
      return unsubscribe;
    }
  }, [currentUser]);

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

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch last message for each ticket
  useEffect(() => {
    tickets.forEach((ticket) => {
      const q = query(collection(db, 'tickets', ticket.id, 'messages'), orderBy('timestamp', 'desc'), limit(1));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        if (!querySnapshot.empty) {
          const lastMsgData = querySnapshot.docs[0].data();
          const lastMsg = lastMsgData.type === 'voice' ? 'پیام صوتی' : lastMsgData.text;
          setLastMessages((prev) => ({ ...prev, [ticket.id]: lastMsg }));
        } else {
          setLastMessages((prev) => ({ ...prev, [ticket.id]: '' }));
        }
      });
      return unsubscribe;
    });
  }, [tickets]);

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
    <div
      ref={containerRef}
      className="flex flex-col md:flex-row h-screen bg-gray-100 dark:bg-gray-900 p-0 md:p-8 gap-0 md:gap-6 page-fade"
      onTouchStart={(e) => handleTouchStart(e.nativeEvent)}
      onTouchEnd={(e) => handleTouchEnd(e.nativeEvent)}
    >
      {/* Ticket List Sidebar - hidden on mobile if selectedTicket */}
      <div
        ref={ticketListRef}
        className={`w-full md:w-1/3 bg-white dark:bg-gray-800 shadow-strong rounded-none md:rounded-lg overflow-hidden h-full flex flex-col ${selectedTicket ? 'hidden md:block' : 'block'} ${isTransitioning && transitionDirection === 'left' && selectedTicket ? 'mobile-slide-out-left' : ''} ${isTransitioning && transitionDirection === 'right' && !selectedTicket ? 'mobile-slide-in-left' : ''}`}
        style={getPullTransformStyle()}
        onTouchStart={(e) => {
          handlePullStart(e.nativeEvent);
          handleTouchStart(e.nativeEvent);
        }}
        onTouchMove={(e) => {
          handlePullMove(e.nativeEvent);
        }}
        onTouchEnd={(e) => {
          handlePullEnd();
          handleTouchEnd(e.nativeEvent);
        }}
      >
        {/* Pull-to-refresh indicator */}
        {isRefreshingTickets && (
          <div className="flex justify-center items-center p-2 bg-primary/10 border-b">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-primary mr-2">در حال بروزرسانی...</span>
          </div>
        )}

        <div className="flex justify-between items-center p-4 md:p-4 border-b">
          <h2 className="text-xl font-bold">تیکت های من</h2>
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="bg-primary text-white px-4 py-2 md:px-3 md:py-1 rounded text-sm hover:bg-primary/90 transition-all duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] min-h-[44px] md:min-h-0 flex items-center gap-2"
          >
            <span>👤</span>
            پروفایل
          </button>
        </div>
        <div className="p-4 md:p-4 border-b">
          <div className="relative">
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
        </div>
        <div className="p-4 md:p-4">
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-full bg-primary text-white py-3 px-4 md:py-2 rounded hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] min-h-[48px] md:min-h-0"
          >
            ایجاد تیکت جدید
          </button>
        </div>
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          {showForm ? (
            <div className="p-4 md:p-4">
              <TicketForm inline onSuccess={() => setShowForm(false)} />
            </div>
          ) : loadingTickets ? (
            <TicketListSkeleton count={5} height="h-24" />
          ) : (
            <ul>
            {tickets
              .filter((ticket) =>
                debouncedSearchTerm === '' ||
                ticket.problem.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                ticket.organization.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                ticket.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
              )
              .map((ticket, index) => (
              <li
                key={ticket.id}
                className={`p-4 md:p-4 cursor-pointer ticket-item-enter ${selectedTicket?.id !== ticket.id ? 'hover:bg-primary/20 active:bg-primary/25 hover:shadow-md' : ''} min-h-[96px] md:h-24 flex flex-col ${selectedTicket?.id === ticket.id ? 'bg-primary/30' : ''} border-b border-gray-200 transition-all duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]`}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => selectTicketWithTransition(ticket)}
              >
                <div className="font-semibold truncate dark:text-white">{ticket.problem}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300 truncate">{lastMessages[ticket.id] || 'پیامی وجود ندارد'}</div>
                <div className={`text-xs mt-auto ${ticket.status === 'open' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {ticket.status === 'open' ? 'باز' : 'بسته'}
                </div>
              </li>
            ))}

          </ul>
        )}
        </div>
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
          canSendMessage={true}
          placeholder="پیام خود را تایپ کنید..."
          sendButtonText="ارسال"
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

export default CompanyDashboard;