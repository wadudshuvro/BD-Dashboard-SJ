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
      <div className="w-full overflow-x-auto border rounded-lg">
        <Table className="table-fixed min-w-[1200px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 px-3 py-3">
                <Checkbox
                  checked={selectedContacts.size === contacts.length && contacts.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="w-48 px-3 py-3">
                <div 
                  className="flex items-center gap-2 cursor-pointer hover:text-primary"
                  onClick={() => handleSort("contact_name")}
                >
                  Name
                  <ArrowUpDown className={`h-4 w-4 ${sortConfig.key === "contact_name" ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
              </TableHead>
              <TableHead className="w-64 max-w-64 px-3 py-3">Contact Info</TableHead>
              <TableHead className="w-56 max-w-56 px-3 py-3">
                <div 
                  className="flex items-center gap-2 cursor-pointer hover:text-primary"
                  onClick={() => handleSort("contact_company")}
                >
                  Company & Title
                  <ArrowUpDown className={`h-4 w-4 ${sortConfig.key === "contact_company" ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
              </TableHead>
              <TableHead className="w-52 max-w-52 px-3 py-3">Tags</TableHead>
              <TableHead className="w-32 px-3 py-3">
                <div 
                  className="flex items-center gap-2 cursor-pointer hover:text-primary"
                  onClick={() => handleSort("status")}
                >
                  Status
                  <ArrowUpDown className={`h-4 w-4 ${sortConfig.key === "status" ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
              </TableHead>
              <TableHead className="w-20 px-3 py-3">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedContacts.map((contact) => (
              <TableRow
                key={contact.id}
                className="cursor-pointer hover:bg-muted/50"
              >
                <TableCell className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedContacts.has(contact.id)}
                    onCheckedChange={() => toggleSelectContact(contact.id)}
                  />
                </TableCell>
                
                {/* Name with Avatar */}
                <TableCell className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={contact.linkedin_profile_image_url || undefined} />
                      <AvatarFallback>
                        {contact.contact_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium truncate">{contact.contact_name}</span>
                  </div>
                </TableCell>

                {/* Contact Info */}
                <TableCell className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex flex-col gap-1 text-sm">
                    {contact.contact_email && (
                      <div className="flex items-center gap-1 group min-w-0">
                        <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground truncate flex-1 min-w-0">{contact.contact_email}</span>
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
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground truncate">{contact.contact_phone}</span>
                      </div>
                    )}
                    {contact.contact_linkedin_url && (
                      <a
                        href={contact.contact_linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline min-w-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Linkedin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">View Profile</span>
                      </a>
                    )}
                  </div>
                </TableCell>

                {/* Company & Title */}
                <TableCell className="px-3 py-3">
                  <div className="flex flex-col">
                    <span className="font-medium truncate">{contact.contact_company || contact.current_employer}</span>
                    <span className="text-sm text-muted-foreground truncate">{contact.contact_title || contact.current_position_title}</span>
                  </div>
                </TableCell>

                {/* Tags */}
                <TableCell className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                  <TagCell
                    contactId={contact.id}
                    tags={contact.tags || []}
                    onTagsUpdate={(tags) => handleTagsUpdate(contact.id, tags)}
                  />
                </TableCell>

                {/* Status */}
                <TableCell className="px-3 py-3">
                  <StatusBadgeCell status={contact.status} />
                </TableCell>

                {/* Actions */}
                <TableCell className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
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
