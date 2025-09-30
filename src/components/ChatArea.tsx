import React from 'react';

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

interface User {
  uid: string;
  email: string | null;
  role?: string;
  name?: string;
  organization?: string;
}

interface ChatAreaProps {
  selectedTicket: Ticket | null;
  messages: Message[];
  newMessage: string;
  setNewMessage: (msg: string) => void;
  sendMessage: () => void;
  currentUser: User;
  canSendMessage: boolean;
  placeholder: string;
  sendButtonText: string;
  archivedMessage?: string;
  noTicketMessage: string;
  onBack?: () => void;
  backText?: string;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  selectedTicket,
  messages,
  newMessage,
  setNewMessage,
  sendMessage,
  currentUser,
  canSendMessage,
  placeholder,
  sendButtonText,
  archivedMessage,
  noTicketMessage,
  onBack,
  backText
}) => {
  return (
    <div className="flex-1 flex flex-col bg-white shadow-md rounded-lg overflow-hidden h-full relative">
      {onBack && backText && (
        <button onClick={onBack} className="md:hidden p-2 bg-gray-200 text-gray-700 rounded mb-2 w-full text-left">
          {backText}
        </button>
      )}
      {selectedTicket ? (
        <>
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">{selectedTicket.name} - {selectedTicket.organization}</h3>
            <p className="text-sm text-gray-600 mt-1">{selectedTicket.problem}</p>
          </div>
          <div className="flex flex-col flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth pb-20">
            {messages.map((msg) => (
              <div key={msg.id} className={`p-3 rounded-lg shadow-sm max-w-xs break-words ${msg.senderId === currentUser.uid ? 'bg-primary/70 text-white self-start' : 'bg-gray-200 text-gray-900 self-end'}`}>
                <p className="text-sm">{msg.text}</p>
                <small className={`text-xs mt-1 block ${msg.senderId === currentUser.uid ? 'text-white/80' : 'text-gray-500'}`}>{msg.timestamp?.toDate().toLocaleString()}</small>
              </div>
            ))}
          </div>
          {!canSendMessage && archivedMessage ? (
            <div className="p-4 text-center text-gray-500 border-t border-gray-200 bg-gray-50">
              {archivedMessage}
            </div>
          ) : (
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 flex gap-2 bg-white">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder={placeholder}
              />
              <button onClick={sendMessage} className="bg-primary text-white px-4 py-3 rounded-lg hover:bg-primary/90 shadow-sm transition-colors min-w-[60px]">
                {sendButtonText}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500 text-center p-4">
          {noTicketMessage}
        </div>
      )}
    </div>
  );
};

export default ChatArea;