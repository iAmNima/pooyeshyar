import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
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
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 p-0 md:p-8 gap-0 md:gap-6">
      {/* Ticket List Sidebar - hidden on mobile if selectedTicket */}
      <div className={`w-full md:w-1/3 bg-white shadow-md rounded-lg overflow-hidden overflow-y-auto h-full ${selectedTicket ? 'hidden md:block' : 'block'}`}>
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
            <span className="text-sm font-medium">نمایش فقط تیکت های باز</span>
          </label>
        </div>
        <ul className="divide-y divide-gray-200">
          {(showOnlyOpen ? tickets.filter(t => t.status === 'open') : tickets).map((ticket) => (
            <li
              key={ticket.id}
              className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors border-l-4 shadow-sm h-28 flex flex-col ${selectedTicket?.id === ticket.id ? 'bg-primary/10' : ''} ${(!ticket.status || ticket.status === 'open') ? 'border-red-500' : ticket.status === 'solved' ? 'border-green-500' : 'border-gray-500'}`}
              onClick={() => setSelectedTicket(ticket)}
            >
              <div className="font-semibold text-gray-900">{ticket.organization || 'سازمان نامشخص'}, {ticket.name || 'نام نامشخص'}</div>
              <div className="text-sm text-gray-700 truncate">{ticket.problem}</div>
              <div className="mt-auto flex justify-end pt-2">
                {ticket.status !== 'solved' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); markAsSolved(ticket.id); }}
                    className="bg-primary text-white px-3 py-1 rounded text-xs hover:bg-primary/90 shadow-sm transition-colors"
                  >
                    حل شد
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
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
          canSendMessage={selectedTicket?.status !== 'solved'}
          placeholder="Type a message..."
          sendButtonText="Send"
          archivedMessage="This ticket is solved and archived."
          noTicketMessage="Select a ticket to start chatting"
          onBack={() => setSelectedTicket(null)}
          backText="← Back to Tickets"
        />
      </div>
    </div>
  );
};

export default AdminDashboard;