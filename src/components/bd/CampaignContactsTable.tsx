import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { NameCell } from './cells/NameCell';
import { TitleCell } from './cells/TitleCell';
import { CompanyCell } from './cells/CompanyCell';
import { EmailCell } from './cells/EmailCell';
import { LinkedInCell } from './cells/LinkedInCell';
import { PhoneCell } from './cells/PhoneCell';
import { ProfileScoreCell } from './cells/ProfileScoreCell';
import { StatusBadgeCell } from './StatusBadgeCell';
import { LastActivityCell } from './LastActivityCell';
import { QuickActionsCell, type QuickActionType } from './QuickActionsCell';
import type { CampaignContact } from '@/features/campaign-detail/types';

interface SortConfig {
  key: 'name' | 'title' | 'company' | 'profile_score' | 'status' | 'last_activity';
  direction: 'asc' | 'desc';
}

interface CampaignContactsTableProps {
  contacts: CampaignContact[];
  campaignSlug: string;
  onQuickAction: (action: QuickActionType, contactSlug: string) => void;
}

interface SortableHeaderProps {
  label: string;
  sortKey: SortConfig['key'];
  currentSort: SortConfig;
  onSort: (key: SortConfig['key']) => void;
  className?: string;
}

function SortableHeader({ label, sortKey, currentSort, onSort, className = '' }: SortableHeaderProps) {
  const isSorted = currentSort.key === sortKey;
  const direction = isSorted ? currentSort.direction : null;

  return (
    <TableHead
      className={`cursor-pointer select-none hover:bg-muted/50 ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        {isSorted && (
          direction === 'asc' ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        )}
      </div>
    </TableHead>
  );
}

export function CampaignContactsTable({
  contacts,
  campaignSlug,
  onQuickAction,
}: CampaignContactsTableProps) {
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'last_activity',
    direction: 'desc',
  });

  const handleSort = (key: SortConfig['key']) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedContacts = useMemo(() => {
    const sorted = [...contacts];

    sorted.sort((a, b) => {
      const multiplier = sortConfig.direction === 'asc' ? 1 : -1;

      switch (sortConfig.key) {
        case 'name':
          return a.contact_name.localeCompare(b.contact_name) * multiplier;

        case 'title': {
          const titleA = a.current_position_title || a.contact_title || '';
          const titleB = b.current_position_title || b.contact_title || '';
          return titleA.localeCompare(titleB) * multiplier;
        }

        case 'company': {
          const companyA = a.current_employer || a.contact_company || '';
          const companyB = b.current_employer || b.contact_company || '';
          return companyA.localeCompare(companyB) * multiplier;
        }

        case 'profile_score': {
          const scoreA = a.profile_completeness_score || 0;
          const scoreB = b.profile_completeness_score || 0;
          return (scoreA - scoreB) * multiplier;
        }

        case 'status': {
          const statusOrder = [
            'identified',
            'researched',
            'contacted_linkedin',
            'connected',
            'messaged',
            'contacted_email',
            'responded',
            'meeting_booked',
          ];
          const indexA = statusOrder.indexOf(a.status);
          const indexB = statusOrder.indexOf(b.status);
          return (indexA - indexB) * multiplier;
        }

        case 'last_activity': {
          const dateA = new Date(a.last_activity_at || a.updated_at).getTime();
          const dateB = new Date(b.last_activity_at || b.updated_at).getTime();
          return (dateA - dateB) * multiplier;
        }

        default:
          return 0;
      }
    });

    return sorted;
  }, [contacts, sortConfig]);

  const toggleSelectAll = () => {
    if (selectedContacts.length === sortedContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(sortedContacts.map((c) => c.id));
    }
  };

  const toggleSelectContact = (contactId: string) => {
    if (selectedContacts.includes(contactId)) {
      setSelectedContacts(selectedContacts.filter((id) => id !== contactId));
    } else {
      setSelectedContacts([...selectedContacts, contactId]);
    }
  };

  const allSelected = sortedContacts.length > 0 && selectedContacts.length === sortedContacts.length;
  const someSelected = selectedContacts.length > 0 && selectedContacts.length < sortedContacts.length;

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleSelectAll}
                aria-label="Select all contacts"
                className={someSelected ? 'data-[state=checked]:bg-primary/50' : ''}
              />
            </TableHead>
            <SortableHeader
              label="Name"
              sortKey="name"
              currentSort={sortConfig}
              onSort={handleSort}
              className="min-w-[200px]"
            />
            <SortableHeader
              label="Title"
              sortKey="title"
              currentSort={sortConfig}
              onSort={handleSort}
              className="min-w-[180px]"
            />
            <SortableHeader
              label="Company"
              sortKey="company"
              currentSort={sortConfig}
              onSort={handleSort}
              className="min-w-[160px]"
            />
            <TableHead className="min-w-[200px]">Email</TableHead>
            <TableHead className="min-w-[100px]">LinkedIn</TableHead>
            <TableHead className="min-w-[140px]">Phone</TableHead>
            <SortableHeader
              label="Profile"
              sortKey="profile_score"
              currentSort={sortConfig}
              onSort={handleSort}
              className="min-w-[100px]"
            />
            <SortableHeader
              label="Status"
              sortKey="status"
              currentSort={sortConfig}
              onSort={handleSort}
              className="min-w-[140px]"
            />
            <SortableHeader
              label="Last Activity"
              sortKey="last_activity"
              currentSort={sortConfig}
              onSort={handleSort}
              className="min-w-[120px]"
            />
            <TableHead className="min-w-[180px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedContacts.map((contact) => (
            <TableRow
              key={contact.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onQuickAction('view', contact.slug)}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedContacts.includes(contact.id)}
                  onCheckedChange={() => toggleSelectContact(contact.id)}
                  aria-label={`Select ${contact.contact_name}`}
                />
              </TableCell>
              <TableCell>
                <NameCell contact={contact} />
              </TableCell>
              <TableCell>
                <TitleCell contact={contact} />
              </TableCell>
              <TableCell>
                <CompanyCell contact={contact} />
              </TableCell>
              <TableCell>
                <EmailCell contact={contact} />
              </TableCell>
              <TableCell>
                <LinkedInCell contact={contact} />
              </TableCell>
              <TableCell>
                <PhoneCell contact={contact} />
              </TableCell>
              <TableCell>
                <ProfileScoreCell contact={contact} />
              </TableCell>
              <TableCell>
                <StatusBadgeCell status={contact.status} />
              </TableCell>
              <TableCell>
                <LastActivityCell contact={contact} />
              </TableCell>
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <QuickActionsCell contact={contact} onAction={onQuickAction} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
