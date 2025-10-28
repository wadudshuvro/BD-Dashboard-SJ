import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ContactInfoCell } from './ContactInfoCell';
import { StatusBadgeCell } from './StatusBadgeCell';
import { LastActivityCell } from './LastActivityCell';
import { QuickActionsCell, type QuickActionType } from './QuickActionsCell';
import type { CampaignContact } from '@/features/campaign-detail/types';

interface CampaignContactsTableProps {
  contacts: CampaignContact[];
  campaignSlug: string;
  onQuickAction: (action: QuickActionType, contactSlug: string) => void;
}

export function CampaignContactsTable({
  contacts,
  campaignSlug,
  onQuickAction,
}: CampaignContactsTableProps) {
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  const toggleSelectAll = () => {
    if (selectedContacts.length === contacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(contacts.map((c) => c.id));
    }
  };

  const toggleSelectContact = (contactId: string) => {
    if (selectedContacts.includes(contactId)) {
      setSelectedContacts(selectedContacts.filter((id) => id !== contactId));
    } else {
      setSelectedContacts([...selectedContacts, contactId]);
    }
  };

  const allSelected = contacts.length > 0 && selectedContacts.length === contacts.length;
  const someSelected = selectedContacts.length > 0 && selectedContacts.length < contacts.length;

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
            <TableHead className="min-w-[300px]">Contact</TableHead>
            <TableHead className="min-w-[140px]">Status</TableHead>
            <TableHead className="min-w-[120px]">Last Activity</TableHead>
            <TableHead className="min-w-[180px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
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
                <ContactInfoCell contact={contact} />
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
