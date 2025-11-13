import { useMemo, useState } from "react";
import type { CampaignContact } from "@/features/campaign-detail/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Mail, Phone, Linkedin, Copy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadgeCell } from "./StatusBadgeCell";
import { QuickActionsCell, type QuickActionType } from "./QuickActionsCell";
import { TagCell } from "./TagCell";
import { BulkActionsBar } from "./BulkActionsBar";
import { useCampaignContactUpdate } from "@/hooks/useCampaignContactUpdate";
import { useToast } from "@/hooks/use-toast";

type SortConfig = {
  key: string | null;
  direction: "asc" | "desc";
};

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentSort: SortConfig;
  onSort: (key: string) => void;
}

const SortableHeader = ({ label, sortKey, currentSort, onSort }: SortableHeaderProps) => {
  const isActive = currentSort.key === sortKey;
  
  return (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-2">
        {label}
        <ArrowUpDown className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
      </div>
    </TableHead>
  );
};

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
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: "asc" });
  const { mutate: updateContact } = useCampaignContactUpdate();
  const { toast } = useToast();

  const handleSort = (key: string) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sortedContacts = useMemo(() => {
    if (!sortConfig.key) return contacts;

    return [...contacts].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof CampaignContact];
      const bValue = b[sortConfig.key as keyof CampaignContact];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [contacts, sortConfig]);

  const toggleSelectAll = () => {
    if (selectedContacts.size === contacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(contacts.map(c => c.id)));
    }
  };

  const toggleSelectContact = (contactId: string) => {
    setSelectedContacts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(contactId)) {
        newSet.delete(contactId);
      } else {
        newSet.add(contactId);
      }
      return newSet;
    });
  };

  const handleTagsUpdate = (contactId: string, tags: string[]) => {
    updateContact({
      contactId,
      updates: { tags },
    });
  };

  const handleBulkTagUpdate = (tags: string[]) => {
    const selectedIds = Array.from(selectedContacts);
    selectedIds.forEach((contactId) => {
      const contact = contacts.find(c => c.id === contactId);
      const existingTags = contact?.tags || [];
      const newTags = Array.from(new Set([...existingTags, ...tags]));
      updateContact({
        contactId,
        updates: { tags: newTags },
      });
    });
    toast({ title: `Added tags to ${selectedIds.length} contacts` });
    setSelectedContacts(new Set());
  };

  const handleBulkStatusChange = (status: string) => {
    const selectedIds = Array.from(selectedContacts);
    selectedIds.forEach((contactId) => {
      updateContact({
        contactId,
        updates: { status },
      });
    });
    toast({ title: `Updated status for ${selectedIds.length} contacts` });
    setSelectedContacts(new Set());
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied to clipboard` });
  };

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedContacts.size === contacts.length && contacts.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <SortableHeader label="Name" sortKey="contact_name" currentSort={sortConfig} onSort={handleSort} />
              <TableHead>Contact Info</TableHead>
              <SortableHeader label="Company & Title" sortKey="contact_company" currentSort={sortConfig} onSort={handleSort} />
              <TableHead>Tags</TableHead>
              <SortableHeader label="Status" sortKey="status" currentSort={sortConfig} onSort={handleSort} />
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedContacts.map((contact) => (
              <TableRow
                key={contact.id}
                className="cursor-pointer hover:bg-muted/50"
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedContacts.has(contact.id)}
                    onCheckedChange={() => toggleSelectContact(contact.id)}
                  />
                </TableCell>
                
                {/* Name with Avatar */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={contact.linkedin_profile_image_url || undefined} />
                      <AvatarFallback>
                        {contact.contact_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{contact.contact_name}</span>
                  </div>
                </TableCell>

                {/* Contact Info */}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex flex-col gap-1 text-sm min-w-[200px]">
                    {contact.contact_email && (
                      <div className="flex items-center gap-2 group">
                        <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground truncate">{contact.contact_email}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 flex-shrink-0"
                          onClick={() => copyToClipboard(contact.contact_email!, "Email")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    {contact.contact_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">{contact.contact_phone}</span>
                      </div>
                    )}
                    {contact.contact_linkedin_url && (
                      <a
                        href={contact.contact_linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Linkedin className="h-3 w-3 flex-shrink-0" />
                        <span>View Profile</span>
                      </a>
                    )}
                  </div>
                </TableCell>

                {/* Company & Title */}
                <TableCell>
                  <div className="flex flex-col min-w-[180px]">
                    <span className="font-medium">{contact.contact_company || contact.current_employer}</span>
                    <span className="text-sm text-muted-foreground">{contact.contact_title || contact.current_position_title}</span>
                  </div>
                </TableCell>

                {/* Tags */}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="min-w-[200px]">
                    <TagCell
                      contactId={contact.id}
                      tags={contact.tags || []}
                      onTagsUpdate={(tags) => handleTagsUpdate(contact.id, tags)}
                    />
                  </div>
                </TableCell>

                {/* Status */}
                <StatusBadgeCell status={contact.status} />

                {/* Actions */}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <QuickActionsCell 
                    contact={contact}
                    onAction={onQuickAction}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <BulkActionsBar
        selectedCount={selectedContacts.size}
        onClearSelection={() => setSelectedContacts(new Set())}
        onBulkTagUpdate={handleBulkTagUpdate}
        onBulkStatusChange={handleBulkStatusChange}
      />
    </>
  );
}
