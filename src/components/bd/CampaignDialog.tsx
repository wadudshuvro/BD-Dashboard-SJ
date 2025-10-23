import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useBDCampaigns } from '@/hooks/useBDCampaigns';
import type { CampaignType } from '@/Api/adminCampaigns';
import type { TargetNiche } from '@/hooks/useTargetNiches';
import { supabase } from '@/integrations/supabase/client';

const CAMPAIGN_TYPES: CampaignType[] = [
  'email_outbound',
  'linkedin_outbound',
  'cold_calling',
  'abm',
  'other',
];

const TASK_TEMPLATES = [
  { value: 'kickoff', label: 'Kickoff plan' },
  { value: 'nurture', label: 'Nurture sequence' },
];

const optionalDate = z
  .union([
    z
      .string()
      .trim()
      .min(1)
      .regex(/\d{4}-\d{2}-\d{2}/, 'Invalid date format'),
    z.literal(''),
  ])
  .optional()
  .transform((value) => (value ? value : undefined));

const optionalUuid = z
  .union([z.string().uuid('Invalid selection'), z.literal(''), z.undefined()])
  .optional()
  .transform((value) => (value ? value : undefined));

const optionalNumber = z
  .union([
    z
      .preprocess((value) => {
        if (value === '' || value === null || typeof value === 'undefined') {
          return undefined;
        }
        const parsed = Number(value);
        return Number.isNaN(parsed) ? undefined : parsed;
      }, z.number().int().positive('Contact target must be positive')),
    z.undefined(),
  ])
  .optional()
  .transform((value) => value);

const campaignFormSchema = z
  .object({
    name: z.string().min(1, 'Campaign name is required'),
    nicheId: z.string().uuid('Please select a niche'),
    brandId: optionalUuid,
    campaignType: z.enum(['email_outbound', 'linkedin_outbound', 'cold_calling', 'abm', 'other'] as const, {
      required_error: 'Select a campaign type',
    }),
    startDate: optionalDate,
    endDate: optionalDate,
    targetContactsCount: optionalNumber,
    seedKpis: z.boolean().optional().default(false),
    enableTaskTemplate: z.boolean().optional().default(false),
    taskTemplateKey: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.enableTaskTemplate && !values.taskTemplateKey) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['taskTemplateKey'],
        message: 'Select a task template',
      });
    }
  });

export type CampaignFormValues = z.infer<typeof campaignFormSchema>;

interface CampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  niches: TargetNiche[];
}

interface BrandOption {
  id: string;
  name: string;
}

export function CampaignDialog({ open, onOpenChange, niches }: CampaignDialogProps) {
  const { createCampaign } = useBDCampaigns();
  const queryClient = useQueryClient();

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      name: '',
      nicheId: '',
      brandId: undefined,
      campaignType: 'email_outbound',
      startDate: undefined,
      endDate: undefined,
      targetContactsCount: undefined,
      seedKpis: false,
      enableTaskTemplate: false,
      taskTemplateKey: undefined,
    },
  });

  const { data: brands = [], isLoading: brandsLoading } = useQuery<BrandOption[]>({
    queryKey: ['bd-brands'],
    queryFn: async () => {
      const { data, error } = await supabase.from('pods').select('id, name').order('name');
      if (error) {
        throw new Error(error.message);
      }
      return (data ?? []).map((brand) => ({
        id: brand.id,
        name: brand.name ?? 'Untitled brand',
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const handleSubmit = async (values: CampaignFormValues) => {
    const payload = {
      name: values.name,
      niche_id: values.nicheId,
      brand_id: values.brandId ?? null,
      campaign_type: values.campaignType as CampaignType,
      start_date: values.startDate ?? null,
      end_date: values.endDate ?? null,
      target_contacts_count: typeof values.targetContactsCount === 'number' ? values.targetContactsCount : null,
    };

    const options: Record<string, unknown> = {};
    if (values.seedKpis) {
      options.seedKpis = true;
    }
    if (values.enableTaskTemplate && values.taskTemplateKey) {
      options.taskTemplateKey = values.taskTemplateKey;
    }

    try {
      await createCampaign.mutateAsync({
        campaign: payload,
        options: Object.keys(options).length ? (options as { seedKpis?: boolean; taskTemplateKey?: string }) : undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Failed to create campaign', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Campaign</DialogTitle>
          <DialogDescription>Configure campaign basics, targets, and automation helpers.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Campaign Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Q1 LinkedIn Outreach" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nicheId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Niche</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a niche" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {niches.map((niche) => (
                          <SelectItem key={niche.id} value={niche.id}>
                            {niche.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="brandId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand (optional)</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === 'none' ? undefined : value)}
                      value={field.value ?? 'none'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={brandsLoading ? 'Loading...' : 'Select a brand'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No brand</SelectItem>
                        {brands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="campaignType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CAMPAIGN_TYPES.map((type) => (
                          <SelectItem key={type} value={type} className="capitalize">
                            {type.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ?? ''}
                        onChange={(event) => field.onChange(event.target.value || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ?? ''}
                        onChange={(event) => field.onChange(event.target.value || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetContactsCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Target</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        value={typeof field.value === 'number' ? field.value : ''}
                        onChange={(event) => {
                          const value = event.target.value;
                          field.onChange(value === '' ? undefined : Number(value));
                        }}
                        placeholder="e.g. 500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <FormLabel className="text-base">Seed default KPIs</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Automatically create baseline metrics to track campaign performance.
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="seedKpis"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <FormLabel className="text-base">Add task template</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Prefill the project board with a curated task list for this campaign.
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="enableTaskTemplate"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {form.watch('enableTaskTemplate') ? (
                <FormField
                  control={form.control}
                  name="taskTemplateKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task Template</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a template" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TASK_TEMPLATES.map((template) => (
                            <SelectItem key={template.value} value={template.value}>
                              {template.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createCampaign.isPending}>
                {createCampaign.isPending ? 'Creating…' : 'Create Campaign'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default CampaignDialog;
