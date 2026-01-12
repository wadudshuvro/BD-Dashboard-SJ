import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBDCampaigns } from "@/hooks/useBDCampaigns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "review", "completed", "blocked"]),
  priority: z.enum(["low", "medium", "high"]),
  category: z.enum(["ideas", "discussion", "work", "other"]),
  project_id: z.string().optional(),
  campaign_id: z.string().optional(),
  assigned_to: z.string().optional(),
  due_date: z.string().optional(),
  estimated_hours: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: any;
  initialCampaignId?: string;
}

export function TaskForm({ open, onOpenChange, task, initialCampaignId }: TaskFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasInitialized = useRef(false);
  const previousOpen = useRef(open);

  // Fetch active campaigns only
  const { campaigns } = useBDCampaigns(undefined, 1, 100, undefined, 'active');

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      category: "work",
      project_id: "",
      campaign_id: initialCampaignId || "",
      assigned_to: "",
      due_date: "",
      estimated_hours: "",
    },
  });

  // Only reset form when dialog opens (not on every re-render or tab switch)
  useEffect(() => {
    const justOpened = open && !previousOpen.current;
    previousOpen.current = open;

    // Reset initialization flag when dialog closes
    if (!open) {
      hasInitialized.current = false;
      return;
    }

    // Only reset form when dialog just opened
    if (justOpened || !hasInitialized.current) {
      hasInitialized.current = true;
      
      if (task) {
        form.reset({
          title: task.title || "",
          description: task.description || "",
          status: task.status || "todo",
          priority: task.priority || "medium",
          category: task.category || "work",
          project_id: task.project_id || "",
          campaign_id: task.campaign_id || "",
          assigned_to: task.assigned_to || "",
          due_date: task.due_date || "",
          estimated_hours: task.estimated_hours?.toString() || "",
        });
      } else {
        form.reset({
          title: "",
          description: "",
          status: "todo",
          priority: "medium",
          category: "work",
          project_id: "",
          campaign_id: initialCampaignId || "",
          assigned_to: user?.id || "",
          due_date: "",
          estimated_hours: "",
        });
      }
    }
  }, [open, task, form, user, initialCampaignId]);

  const onSubmit = async (values: TaskFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        title: values.title,
        description: values.description,
        status: values.status,
        priority: values.priority,
        category: values.category,
        project_id: values.project_id || null,
        campaign_id: values.campaign_id || null,
        assigned_to: values.assigned_to || null,
        due_date: values.due_date || null,
        estimated_hours: values.estimated_hours ? parseFloat(values.estimated_hours) : null,
        created_by: user?.id,
      };

      if (task) {
        const { error } = await supabase
          .from("project_tasks")
          .update(payload)
          .eq("id", task.id);

        if (error) throw error;
        toast.success("Task updated successfully");
      } else {
        const { error } = await supabase
          .from("project_tasks")
          .insert([payload]);

        if (error) throw error;
        toast.success("Task created successfully");
      }

      queryClient.invalidateQueries({ queryKey: ["project-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["all-project-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["campaign-tasks"] });
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast.error(error.message || "Failed to save task");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Create New Task"}</DialogTitle>
          <DialogDescription>
            {task ? "Update task details" : "Fill in the details to create a new task"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter task title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter task description"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="campaign_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign (Optional)</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === "__none__" ? "" : value)}
                    value={field.value || "__none__"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a campaign" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {campaigns?.map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="review">In Review</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ideas">Ideas</SelectItem>
                      <SelectItem value="discussion">Discussion</SelectItem>
                      <SelectItem value="work">Work</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimated_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Hours</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.5" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : task ? "Update Task" : "Create Task"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
