import React, { useState } from 'react';

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
  sendAudio?: (audioBlob: Blob) => void;
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
  sendAudio,
  currentUser,
  canSendMessage,
  placeholder,
  sendButtonText,
  archivedMessage,
  noTicketMessage,
  onBack,
  backText
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        console.log('Audio blob size:', audioBlob.size);
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
        if (sendAudio) {
          sendAudio(audioBlob);
        }
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };
  return (
    <div className="flex-1 flex flex-col bg-white shadow-soft rounded-lg overflow-hidden h-full relative">
      {onBack && backText && (
        <button onClick={onBack} className="md:hidden p-2 bg-gray-200 text-gray-700 rounded mb-2 w-full text-left">
          {backText}
        </button>
      )}
      {selectedTicket ? (
        <>
          <div className="p-4 border-b border-gray-200 bg-primary/20">
            <h3 className="text-lg font-semibold text-gray-900">{selectedTicket.name} - {selectedTicket.organization}</h3>
            <p className="text-sm text-gray-600 mt-1">{selectedTicket.problem}</p>
          </div>
          <div className="flex flex-col flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth pb-20">
            {messages.map((msg) => (
              <div key={msg.id} className={`p-3 rounded-lg shadow-sm max-w-xs break-words ${msg.senderId === currentUser.uid ? 'bg-primary/70 text-white self-start' : 'bg-gray-300 text-gray-900 self-end'}`}>
                {msg.type === 'voice' ? (
                  <audio controls src={msg.audioUrl} className="w-full" />
                ) : (
                  <p className="text-sm">{msg.text}</p>
                )}
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
              <button onClick={isRecording ? stopRecording : startRecording} className={`px-4 py-3 rounded-lg shadow-sm transition-colors min-w-[60px] ${isRecording ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-500 text-white hover:bg-gray-600'}`}>
                {isRecording ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
              </button>
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