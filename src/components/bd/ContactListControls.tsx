import { Search, SlidersHorizontal, List, Columns } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { CampaignContactStatus } from '@/features/campaign-detail/types';

const STATUS_OPTIONS: { value: CampaignContactStatus; label: string }[] = [
  { value: 'identified', label: 'Identified' },
  { value: 'researched', label: 'Researched' },
  { value: 'contacted_linkedin', label: 'Request Sent' },
  { value: 'connected', label: 'Connected' },
  { value: 'messaged', label: 'Messaged' },
  { value: 'contacted_email', label: 'Email Sent' },
  { value: 'responded', label: 'Responded' },
  { value: 'meeting_booked', label: 'Meeting' },
];

export type SortOption = 'name-asc' | 'name-desc' | 'activity-desc' | 'activity-asc' | 'status';

interface ContactListControlsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: CampaignContactStatus[];
  onStatusFilterChange: (statuses: CampaignContactStatus[]) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode: 'list' | 'pipeline';
  onViewModeChange: (mode: 'list' | 'pipeline') => void;
  statusCounts?: Record<CampaignContactStatus, number>;
}

export function ContactListControls({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  statusCounts,
}: ContactListControlsProps) {
  const handleStatusToggle = (status: CampaignContactStatus) => {
    if (statusFilter.includes(status)) {
      onStatusFilterChange(statusFilter.filter((s) => s !== status));
    } else {
      onStatusFilterChange([...statusFilter, status]);
    }
  };

  const handleClearStatusFilter = () => {
    onStatusFilterChange([]);
  };

  const hasStatusFilter = statusFilter.length > 0;

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
      {/* Left: Search */}
      <div className="relative w-full sm:w-auto sm:min-w-[300px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search contacts by name, company, or title..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Right: Filters and View Toggle */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Status
              {hasStatusFilter && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {statusFilter.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {STATUS_OPTIONS.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={statusFilter.includes(option.value)}
                onCheckedChange={() => handleStatusToggle(option.value)}
              >
                <span className="flex-1">{option.label}</span>
                {statusCounts && statusCounts[option.value] > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                    {statusCounts[option.value]}
                  </Badge>
                )}
              </DropdownMenuCheckboxItem>
            ))}
            {hasStatusFilter && (
              <>
                <DropdownMenuSeparator />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearStatusFilter}
                  className="w-full justify-center"
                >
                  Clear All
                </Button>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort */}
        <Select value={sortBy} onValueChange={(value) => onSortChange(value as SortOption)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="activity-desc">Recent Activity</SelectItem>
            <SelectItem value="activity-asc">Oldest Activity</SelectItem>
            <SelectItem value="name-asc">Name (A-Z)</SelectItem>
            <SelectItem value="name-desc">Name (Z-A)</SelectItem>
            <SelectItem value="status">Status (Pipeline)</SelectItem>
          </SelectContent>
        </Select>

        {/* View Toggle */}
        <div className="flex items-center border rounded-md">
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            className="rounded-r-none"
          >
            <List className="h-4 w-4" />
            <span className="sr-only">List View</span>
          </Button>
          <Button
            variant={viewMode === 'pipeline' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('pipeline')}
            className="rounded-l-none"
          >
            <Columns className="h-4 w-4" />
            <span className="sr-only">Pipeline View</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
