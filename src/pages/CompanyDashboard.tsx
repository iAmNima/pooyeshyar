import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, where, limit } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import TicketForm from '../components/TicketForm';
import ChatArea from '../components/ChatArea';

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
}

const CompanyDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [lastMessages, setLastMessages] = useState<Record<string, string>>({});

  // Fetch tickets with onSnapshot, filtered by companyId
  useEffect(() => {
    if (currentUser) {
      const q = query(collection(db, 'tickets'), where('companyId', '==', currentUser.uid));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const ticketsData: Ticket[] = [];
        querySnapshot.forEach((doc) => {
          ticketsData.push({ id: doc.id, ...doc.data() } as Ticket);
        });
        setTickets(ticketsData);
      });
      return unsubscribe;
    }
  }, [currentUser]);

  // Fetch last message for each ticket
  useEffect(() => {
    tickets.forEach((ticket) => {
      const q = query(collection(db, 'tickets', ticket.id, 'messages'), orderBy('timestamp', 'desc'), limit(1));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        if (!querySnapshot.empty) {
          const lastMsg = querySnapshot.docs[0].data().text;
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
      const q = query(collection(db, 'tickets', selectedTicket.id, 'messages'), orderBy('timestamp'));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messagesData: Message[] = [];
        querySnapshot.forEach((doc) => {
          messagesData.push({ id: doc.id, ...doc.data() } as Message);
        });
        setMessages(messagesData);
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
      });
      setNewMessage('');
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 p-0 md:p-8 gap-0 md:gap-6">
      {/* Ticket List Sidebar - hidden on mobile if selectedTicket */}
      <div className={`w-full md:w-1/3 bg-white shadow-lg overflow-y-auto h-full ${selectedTicket ? 'hidden md:block' : 'block'}`}>
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">تیکت های من</h2>
          <button onClick={handleLogout} className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">خروج</button>
        </div>
        <div className="p-4">
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-full bg-primary text-white py-2 px-4 rounded hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            ایجاد تیکت جدید
          </button>
        </div>
        {showForm ? (
          <div className="p-4">
            <TicketForm inline onSuccess={() => setShowForm(false)} />
          </div>
        ) : (
          <ul>
            {tickets.map((ticket) => (
              <li
                key={ticket.id}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 h-24 flex flex-col ${selectedTicket?.id === ticket.id ? 'bg-primary/20' : ''}`}
                onClick={() => setSelectedTicket(ticket)}
              >
                <div className="font-semibold truncate">{ticket.problem}</div>
                <div className="text-sm text-gray-600 truncate">{lastMessages[ticket.id] || 'پیامی وجود ندارد'}</div>
                <div className={`text-xs mt-auto ${ticket.status === 'open' ? 'text-green-600' : 'text-red-600'}`}>
                  {ticket.status === 'open' ? 'باز' : 'بسته'}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Chat Area - full width on mobile, hidden if no selectedTicket on mobile */}
      <div className={`flex-1 h-full ${selectedTicket ? 'block' : 'hidden md:block'}`}>
        <ChatArea
          selectedTicket={selectedTicket}
          messages={messages}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          sendMessage={sendMessage}
          currentUser={currentUser!}
          canSendMessage={true}
          placeholder="پیام خود را تایپ کنید..."
          sendButtonText="ارسال"
          noTicketMessage="یک تیکت را انتخاب کنید تا چت شروع شود"
          onBack={() => setSelectedTicket(null)}
          backText="← بازگشت به تیکت ها"
        />
      </div>
    </div>
  );
};

export default CompanyDashboard;