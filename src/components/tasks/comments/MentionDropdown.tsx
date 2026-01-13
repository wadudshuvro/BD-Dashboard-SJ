import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useBDTeamMembers } from '@/hooks/useBDTeamMembers';
import { useState, useEffect } from 'react';

interface MentionDropdownProps {
  searchQuery: string;
  onSelect: (userId: string, userName: string) => void;
  position: { top: number; left: number };
}

export function MentionDropdown({ searchQuery, onSelect, position }: MentionDropdownProps) {
  const { data: bdMembers = [], isLoading } = useBDTeamMembers();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredMembers = bdMembers.filter(member =>
    member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredMembers.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filteredMembers[selectedIndex]) {
      e.preventDefault();
      const member = filteredMembers[selectedIndex];
      onSelect(member.id, member.full_name);
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, filteredMembers]);

  if (isLoading) {
    return (
      <div
        className="absolute z-50 w-72 bg-popover border rounded-md shadow-md p-2"
        style={{ top: position.top, left: position.left }}
      >
        <p className="text-sm text-muted-foreground p-2">Loading...</p>
      </div>
    );
  }

  return (
    <div
      className="absolute z-50 w-72 bg-popover border rounded-md shadow-md overflow-hidden"
      style={{ top: position.top, left: position.left }}
    >
      <Command>
        <CommandList>
          {filteredMembers.length === 0 ? (
            <CommandEmpty>No users found</CommandEmpty>
          ) : (
            <CommandGroup>
              {filteredMembers.map((member, index) => (
                <CommandItem
                  key={member.id}
                  value={member.id}
                  onSelect={() => onSelect(member.id, member.full_name)}
                  className={index === selectedIndex ? 'bg-accent' : ''}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={member.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {member.full_name?.substring(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{member.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </div>
  );
}

