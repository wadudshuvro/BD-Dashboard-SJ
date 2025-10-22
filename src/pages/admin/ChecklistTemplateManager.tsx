import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Loader2, ListChecks, Plus, Trash2, Edit3, GripVertical } from 'lucide-react';

interface ChecklistTemplateItem {
  title: string;
  order_index: number;
}

interface ChecklistTemplate {
  id: string;
  name: string;
  stage: string | null;
  items: ChecklistTemplateItem[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const pipelineStages = [
  { value: 'prospecting', label: 'Prospecting' },
  { value: 'qualification', label: 'Qualification' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'closed_won', label: 'Closed Won' },
];

const emptyTemplate = {
  name: '',
  stage: '',
  is_active: true,
  items: [{ title: 'New checklist item', order_index: 0 }],
};

const ChecklistTemplateManager = () => {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | null>(null);
  const [formState, setFormState] = useState(emptyTemplate);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<ChecklistTemplate | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('checklist_templates')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Failed to load templates', error);
      toast({ title: 'Error', description: 'Could not load checklist templates.', variant: 'destructive' });
    } else if (data) {
      const parsed = data.map((template) => ({
        ...template,
        items: Array.isArray(template.items) ? template.items : [],
      })) as ChecklistTemplate[];
      setTemplates(parsed);
    }
    setLoading(false);
  };

  const openCreateDialog = () => {
    setEditingTemplate(null);
    setFormState(emptyTemplate);
    setDialogOpen(true);
  };

  const openEditDialog = (template: ChecklistTemplate) => {
    setEditingTemplate(template);
    setFormState({
      name: template.name,
      stage: template.stage ?? '',
      is_active: template.is_active,
      items: template.items
        .slice()
        .sort((a, b) => a.order_index - b.order_index)
        .map((item, index) => ({ title: item.title, order_index: index })),
    });
    setDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      setEditingTemplate(null);
      setFormState(emptyTemplate);
    }
    setDialogOpen(open);
  };

  const handleAddItem = () => {
    setFormState((prev) => ({
      ...prev,
      items: [...prev.items, { title: 'New checklist item', order_index: prev.items.length }],
    }));
  };

  const handleUpdateItemTitle = (index: number, title: string) => {
    setFormState((prev) => ({
      ...prev,
      items: prev.items.map((item, idx) => (idx === index ? { ...item, title } : item)),
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormState((prev) => {
      const nextItems = prev.items.filter((_, idx) => idx !== index).map((item, idx) => ({
        ...item,
        order_index: idx,
      }));
      return { ...prev, items: nextItems };
    });
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) return;

    setFormState((prev) => {
      const updated = [...prev.items];
      const [moved] = updated.splice(dragIndex, 1);
      updated.splice(index, 0, moved);
      return {
        ...prev,
        items: updated.map((item, idx) => ({ ...item, order_index: idx })),
      };
    });
    setDragIndex(null);
  };

  const handleSave = async () => {
    if (!formState.name.trim()) {
      toast({ title: 'Validation', description: 'Template name is required.', variant: 'destructive' });
      return;
    }

    if (formState.items.length === 0) {
      toast({ title: 'Validation', description: 'Add at least one checklist item.', variant: 'destructive' });
      return;
    }

    setIsSaving(true);

    const payload = {
      name: formState.name.trim(),
      stage: formState.stage ? formState.stage : null,
      is_active: formState.is_active,
      items: formState.items.map((item, index) => ({
        title: item.title,
        order_index: index,
      })),
    };

    let error;
    if (editingTemplate) {
      ({ error } = await supabase
        .from('checklist_templates')
        .update(payload)
        .eq('id', editingTemplate.id));
    } else {
      ({ error } = await supabase.from('checklist_templates').insert(payload));
    }

    if (error) {
      console.error('Failed to save template', error);
      toast({ title: 'Error', description: 'Could not save template.', variant: 'destructive' });
    } else {
      toast({ title: 'Template saved', description: 'Checklist template updated successfully.' });
      handleDialogOpenChange(false);
      fetchTemplates();
    }

    setIsSaving(false);
  };

  const handleDeleteTemplate = (template: ChecklistTemplate) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteTemplate = async () => {
    if (!templateToDelete) return;
    setIsDeleting(true);
    const { error } = await supabase
      .from('checklist_templates')
      .delete()
      .eq('id', templateToDelete.id);

    if (error) {
      console.error('Failed to delete template', error);
      toast({ title: 'Error', description: 'Could not delete template.', variant: 'destructive' });
    } else {
      toast({ title: 'Template deleted', description: 'Checklist template removed.' });
      fetchTemplates();
    }
    setIsDeleting(false);
    setDeleteDialogOpen(false);
    setTemplateToDelete(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <ListChecks className="h-5 w-5" />
              Checklist Templates
            </CardTitle>
            <CardDescription>Manage reusable checklist templates that power deal onboarding flows.</CardDescription>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading templates...
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ListChecks className="mb-2 h-10 w-10" />
              <p className="text-sm">No checklist templates yet. Create your first template to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>
                        {template.stage ? (
                          <Badge variant="outline" className="capitalize">{template.stage.replace('_', ' ')}</Badge>
                        ) : (
                          <Badge variant="secondary">All Stages</Badge>
                        )}
                      </TableCell>
                      <TableCell>{template.items.length}</TableCell>
                      <TableCell>
                        {template.is_active ? (
                          <Badge variant="outline" className="text-green-600">Active</Badge>
                        ) : (
                          <Badge variant="destructive">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(template)}>
                          <Edit3 className="mr-2 h-4 w-4" /> Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteTemplate(template)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Checklist Template' : 'Create Checklist Template'}</DialogTitle>
            <DialogDescription>
              Define reusable items that will be automatically applied to deals as they enter specific pipeline stages.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={formState.name}
                  onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="e.g. Negotiation Checklist"
                />
              </div>
              <div className="space-y-2">
                <Label>Applies To Stage</Label>
                <Select
                  value={formState.stage}
                  onValueChange={(value) => setFormState((prev) => ({ ...prev, stage: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All stages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Stages</SelectItem>
                    {pipelineStages.map((stage) => (
                      <SelectItem key={stage.value} value={stage.value} className="capitalize">
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border border-border bg-muted/50 p-3">
              <div>
                <p className="text-sm font-medium">Template Active</p>
                <p className="text-xs text-muted-foreground">Inactive templates will not auto-apply to deals.</p>
              </div>
              <Switch
                checked={formState.is_active}
                onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, is_active: checked }))}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Checklist Items</h3>
                  <p className="text-xs text-muted-foreground">Drag to reorder items as they should appear to end users.</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleAddItem}>
                  <Plus className="mr-2 h-4 w-4" /> Add Item
                </Button>
              </div>

              <div className="space-y-2">
                {formState.items.map((item, index) => (
                  <div
                    key={`${index}-${item.title}`}
                    className="flex items-center gap-3 rounded-md border border-dashed border-border bg-background p-3"
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleDrop(index)}
                    onDragEnd={() => setDragIndex(null)}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <Input
                      value={item.title}
                      onChange={(event) => handleUpdateItemTitle(index, event.target.value)}
                      placeholder={`Checklist item ${index + 1}`}
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleDialogOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete checklist template</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The template will no longer be available for deals. Existing checklist items remain
              unchanged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDeleteTemplate}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ChecklistTemplateManager;
