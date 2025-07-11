import { useState } from 'react';
import { Message } from '@shared/schema';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Check, Flag, Trash } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';

interface MessageItemProps {
  message: Message;
  onReview?: (action: 'allow' | 'delete') => void;
  isParentView?: boolean;
}

export default function MessageItem({ message, onReview, isParentView = false }: MessageItemProps) {
  const [showActions, setShowActions] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const isDeleted = message.isDeleted;
  const isFlagged = message.isFiltered;
  
  return (
    <div 
      className={`border rounded-lg p-4 ${isFlagged ? 'bg-red-50 border-red-200' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="flex items-center">
            <span className="font-medium">
              {isParentView ? `From Child #${message.senderName} to Child #${message.receiverName}` : 'Message'}
            </span>
            {isFlagged && (
              <span className="flex items-center text-amber-600 text-xs ml-2">
                <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                Flagged
              </span>
            )}
            {isDeleted && (
              <span className="flex items-center text-red-600 text-xs ml-2">
                <Trash className="h-3.5 w-3.5 mr-1" />
                Deleted
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">{formatDate(message.timestamp)}</p>
        </div>
        
        {isParentView && onReview && !message.isReviewed && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-green-600 border-green-600 hover:bg-green-50"
              onClick={() => onReview('allow')}
            >
              <Check className="mr-1 h-4 w-4" />
              Allow
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 border-red-600 hover:bg-red-50"
              onClick={() => onReview('delete')}
            >
              <Trash className="mr-1 h-4 w-4" />
              Delete
            </Button>
          </div>
        )}
      </div>
      
      <div className={`p-3 rounded ${isDeleted ? 'bg-gray-100 text-gray-400 italic' : 'bg-white'}`}>
        {isDeleted ? (
          <p>This message has been deleted by a parent.</p>
        ) : (
          <p>{message.content}</p>
        )}
      </div>
      
      {!isParentView && !isDeleted && showActions && (
        <div className="mt-2 flex justify-end">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700">
                <Flag className="h-3.5 w-3.5 mr-1" />
                Report
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Report Message</DialogTitle>
                <DialogDescription>
                  Reporting this message will notify your parent to review it.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p className="font-semibold">Message:</p>
                <p className="mt-1 p-3 bg-gray-100 rounded">{message.content}</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    // Report functionality would be added here
                    setDialogOpen(false);
                  }}
                >
                  Report Message
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
