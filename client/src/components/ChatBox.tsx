import { Message } from '@shared/schema';
import { formatDate } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

interface ChatBoxProps {
  message: Message;
  isSentByMe: boolean;
}

export default function ChatBox({ message, isSentByMe }: ChatBoxProps) {
  // Handle deleted messages
  if (message.isDeleted) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-gray-100 text-gray-500 rounded-full py-1 px-4 text-xs italic">
          This message has been deleted by a parent
        </div>
      </div>
    );
  }
  
  return (
    <div className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}>
      <div className="flex flex-col max-w-[85%]">
        <div className={`kid-bubble ${isSentByMe ? 'kid-bubble-sent' : 'kid-bubble-received'}`}>
          <p>{message.content}</p>
          {message.isFiltered && (
            <div className="mt-1 text-xs flex items-center">
              <AlertTriangle className="h-3 w-3 mr-1" />
              <span>{isSentByMe ? 'This message is being reviewed by a parent' : 'This message has been flagged'}</span>
            </div>
          )}
        </div>
        <div className={`text-xs text-gray-500 mt-1 ${isSentByMe ? 'text-right' : ''}`}>
          {formatDate(message.timestamp)}
        </div>
      </div>
    </div>
  );
}
