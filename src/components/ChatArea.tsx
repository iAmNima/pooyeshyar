import React, { useState, useRef } from 'react';
import MessageListSkeleton from './MessageListSkeleton';
import { useTheme } from '../contexts/ThemeContext';

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

interface VoiceMessagePlayerProps {
  audioUrl: string;
}

const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({ audioUrl }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const newTime = parseFloat(e.target.value);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-2 min-w-[200px] hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 animate-fadeIn">
      <button
        onClick={togglePlayPause}
        className="flex-shrink-0 w-10 h-10 md:w-8 md:h-8 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/90 transition-all duration-200 transform hover:scale-110 active:scale-95 shadow-md hover:shadow-lg min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0"
      >
        {isPlaying ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 4a1 1 0 00-1 1v10a1 1 0 001 1h1a1 1 0 001-1V5a1 1 0 00-1-1H6zM12 4a1 1 0 00-1 1v10a1 1 0 001 1h1a1 1 0 001-1V5a1 1 0 00-1-1h-1z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8 5.14v9.72a1 1 0 001.555.832l6-4.5a1 1 0 000-1.664l-6-4.5A1 1 0 008 5.14z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      <div className="flex-1 flex items-center gap-2">
        <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[30px]">
          {formatTime(currentTime)}
        </span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="flex-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
        />
        <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[30px]">
          {formatTime(duration)}
        </span>
      </div>

      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        preload="metadata"
      />
    </div>
  );
};

interface ChatAreaProps {
  selectedTicket: Ticket | null;
  messages: Message[];
  loadingMessages?: boolean;
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
  loadingMessages = false,
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
  const { isDarkMode } = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingInterval, setRecordingInterval] = useState<NodeJS.Timeout | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [animationFrame, setAnimationFrame] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Set up audio context for visualization
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyserNode = context.createAnalyser();
      const source = context.createMediaStreamSource(stream);
      analyserNode.fftSize = 256;
      source.connect(analyserNode);

      setAudioContext(context);
      setAnalyser(analyserNode);

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
      setRecordingDuration(0);
      const interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      setRecordingInterval(interval);

      // Start waveform visualization
      drawWaveform();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const drawWaveform = () => {
    if (!analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = isDarkMode ? '#374151' : '#f3f4f6';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;

        ctx.fillStyle = `rgb(${dataArray[i] + 100}, 50, 50)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }

      if (isRecording) {
        setAnimationFrame(requestAnimationFrame(draw));
      }
    };

    draw();
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
    if (recordingInterval) {
      clearInterval(recordingInterval);
      setRecordingInterval(null);
    }
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      setAnimationFrame(null);
    }
    if (audioContext) {
      audioContext.close();
      setAudioContext(null);
    }
    setAnalyser(null);
    setRecordingDuration(0);
  };
  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 shadow-soft rounded-none md:rounded-lg overflow-hidden h-full relative">
      {onBack && backText && (
        <button onClick={onBack} className="md:hidden p-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded mb-2 w-full text-left transition-all duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] min-h-[48px] flex items-center">
          {backText}
        </button>
      )}
      {selectedTicket ? (
        <>
          <div className="p-4 md:p-4 border-b border-gray-200 dark:border-gray-600 bg-primary/20 dark:bg-primary/10">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{selectedTicket.name} - {selectedTicket.organization}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{selectedTicket.problem}</p>
          </div>
          <div className="flex flex-col flex-1 overflow-y-auto p-4 md:p-4 space-y-3 md:space-y-3 scroll-smooth pb-20 md:pb-20">
            {loadingMessages ? (
              <MessageListSkeleton count={6} />
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`p-3 rounded-lg shadow-sm max-w-xs break-words message-enter ${msg.senderId === currentUser.uid ? 'bg-primary/70 text-white self-start' : 'bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-gray-100 self-end'}`}>
                  {msg.type === 'voice' && msg.audioUrl ? (
                    <VoiceMessagePlayer audioUrl={msg.audioUrl} />
                  ) : (
                    <p className="text-sm">{msg.text}</p>
                  )}
                  <small className={`text-xs mt-1 block ${msg.senderId === currentUser.uid ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>{msg.timestamp?.toDate().toLocaleString()}</small>
                </div>
              ))
            )}
          </div>
          {!canSendMessage && archivedMessage ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
              {archivedMessage}
            </div>
          ) : (
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-4 border-t border-gray-200 dark:border-gray-600 flex gap-2 md:gap-2 bg-white dark:bg-gray-800">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 ease-in-out bg-white dark:bg-gray-800"
                placeholder={placeholder}
              />
              <button onClick={isRecording ? stopRecording : startRecording} className={`px-4 py-3 rounded-lg shadow-sm transition-all duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] min-w-[60px] min-h-[48px] ${isRecording ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse shadow-lg' : 'bg-gray-500 text-white hover:bg-gray-600 hover:shadow-md'}`}>
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
              <button onClick={sendMessage} className="bg-primary text-white px-4 py-3 rounded-lg hover:bg-primary/90 shadow-sm transition-all duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] min-w-[60px] min-h-[48px]">
                {sendButtonText}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 text-center p-4">
          {noTicketMessage}
        </div>
      )}
    </div>
  );
};

export default ChatArea;