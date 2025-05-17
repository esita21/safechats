import { User } from '@shared/schema';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { getInitials, isEmpty } from '@/lib/utils';
import { MessageCircle } from 'lucide-react';

interface FriendsListProps {
  friends: User[];
  onlineFriends: Set<number>;
  onSelectFriend: (friendId: number) => void;
}

export default function FriendsList({ friends, onlineFriends, onSelectFriend }: FriendsListProps) {
  if (isEmpty(friends)) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">
          You don't have any friends yet. Add some to start chatting!
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {friends.map((friend) => (
        <div 
          key={friend.id}
          className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center">
            <div className="relative">
              <Avatar>
                <AvatarFallback style={{ backgroundColor: friend.avatarColor }}>
                  {getInitials(friend.name)}
                </AvatarFallback>
              </Avatar>
              <span 
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                  onlineFriends.has(friend.id) ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            </div>
            <div className="ml-3">
              <p className="font-medium">{friend.name}</p>
              <p className="text-sm text-gray-500">
                {onlineFriends.has(friend.id) ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
          <Button 
            size="sm"
            variant="secondary"
            onClick={() => onSelectFriend(friend.id)}
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            Chat
          </Button>
        </div>
      ))}
    </div>
  );
}
