import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

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

const AdminDashboard: React.FC = () => {
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
  const [showOnlyOpen, setShowOnlyOpen] = useState<boolean>(false);

  // Fetch tickets with onSnapshot
  useEffect(() => {
    const q = collection(db, 'tickets');
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ticketsData: Ticket[] = [];
      querySnapshot.forEach((doc) => {
        ticketsData.push({ id: doc.id, ...doc.data() } as Ticket);
      });
      setTickets(ticketsData);
    });
    return unsubscribe;
  }, []);

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

  const markAsSolved = async (ticketId: string) => {
    await updateDoc(doc(db, 'tickets', ticketId), { status: 'solved' });
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 p-2 md:p-4 gap-2 md:gap-4">
      {/* Ticket List Sidebar */}
      <div className="w-full md:w-1/3 bg-white shadow-md rounded-lg overflow-hidden overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-primary text-white">
          <h2 className="text-xl font-bold">Tickets</h2>
          <button onClick={handleLogout} className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 shadow-sm">خروج</button>
        </div>
        <div className="p-4 border-b border-gray-200">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showOnlyOpen}
              onChange={(e) => setShowOnlyOpen(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Show only open tickets</span>
          </label>
        </div>
        <ul className="divide-y divide-gray-200">
          {(showOnlyOpen ? tickets.filter(t => t.status === 'open') : tickets).map((ticket) => (
            <li
              key={ticket.id}
              className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors border-l-4 shadow-sm ${selectedTicket?.id === ticket.id ? 'bg-primary/10' : ''} ${ticket.status === 'open' ? 'border-red-500' : ticket.status === 'solved' ? 'border-green-500' : 'border-gray-500'}`}
              onClick={() => setSelectedTicket(ticket)}
            >
              <div className="font-semibold text-gray-900">{ticket.name}</div>
              <div className="text-sm text-gray-600">{ticket.organization}</div>
              <div className="text-sm text-gray-700 mt-1">{ticket.problem}</div>
              <div className={`text-xs mt-2 font-medium ${ticket.status === 'open' ? 'text-red-600' : ticket.status === 'solved' ? 'text-green-600' : 'text-gray-600'}`}>
                {ticket.status}
              </div>
              {ticket.status !== 'solved' && (
                <button
                  onClick={(e) => { e.stopPropagation(); markAsSolved(ticket.id); }}
                  className="mt-3 bg-primary text-white px-3 py-1 rounded text-xs hover:bg-primary/90 shadow-sm transition-colors"
                >
                  حل شد
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white shadow-md rounded-lg overflow-hidden">
        {selectedTicket ? (
          <>
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">{selectedTicket.name} - {selectedTicket.organization}</h3>
              <p className="text-sm text-gray-600 mt-1">{selectedTicket.problem}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
              {messages.map((msg) => (
                <div key={msg.id} className={`p-3 rounded-lg shadow-sm max-w-xs break-words ${msg.senderId === currentUser!.uid ? 'bg-primary text-white ml-auto' : 'bg-gray-200 text-gray-900'}`}>
                  <p className="text-sm">{msg.text}</p>
                  <small className={`text-xs mt-1 block ${msg.senderId === currentUser!.uid ? 'text-white/80' : 'text-gray-500'}`}>{msg.timestamp?.toDate().toLocaleString()}</small>
                </div>
              ))}
            </div>
            {selectedTicket.status === 'solved' ? (
              <div className="p-4 text-center text-gray-500 border-t border-gray-200 bg-gray-50">
                This ticket is solved and archived.
              </div>
            ) : (
              <div className="p-4 border-t border-gray-200 flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Type a message..."
                />
                <button onClick={sendMessage} className="bg-primary text-white px-4 py-3 rounded-lg hover:bg-primary/90 shadow-sm transition-colors min-w-[60px]">
                  Send
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-center p-4">
            Select a ticket to start chatting
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;