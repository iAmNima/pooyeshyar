import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import TicketForm from '../components/TicketForm';

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
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">
      {/* Ticket List Sidebar */}
      <div className="w-full md:w-1/3 bg-white shadow-lg overflow-y-auto">
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
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${selectedTicket?.id === ticket.id ? 'bg-primary/20' : ''}`}
                onClick={() => setSelectedTicket(ticket)}
              >
                <div className="font-semibold">{ticket.name}</div>
                <div className="text-sm text-gray-600">{ticket.organization}</div>
                <div className="text-sm">{ticket.problem}</div>
                <div className={`text-xs mt-1 ${ticket.status === 'open' ? 'text-green-600' : 'text-red-600'}`}>
                  {ticket.status === 'open' ? 'باز' : 'بسته'}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white shadow-lg">
        {selectedTicket ? (
          <>
            <div className="p-4 border-b bg-gray-50">
              <h3 className="text-lg font-semibold">{selectedTicket.name} - {selectedTicket.organization}</h3>
              <p className="text-sm text-gray-600">{selectedTicket.problem}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`p-3 rounded-lg shadow-sm max-w-xs break-words ${msg.senderId === currentUser!.uid ? 'bg-primary text-white ml-auto' : 'bg-gray-200 text-gray-900'}`}>
                  <p className="text-sm">{msg.text}</p>
                  <small className={`text-xs block mt-1 ${msg.senderId === currentUser!.uid ? 'text-white/80' : 'text-gray-500'}`}>
                    {msg.timestamp?.toDate().toLocaleString()}
                  </small>
                </div>
              ))}
            </div>
            <div className="p-4 border-t flex">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1 p-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="پیام خود را تایپ کنید..."
              />
              <button onClick={sendMessage} className="bg-primary text-white px-4 rounded-r hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-primary">
                ارسال
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            یک تیکت را انتخاب کنید تا چت شروع شود
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyDashboard;