import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { CampaignContact } from '@/features/campaign-detail/types';

interface CompanyCellProps {
  contact: CampaignContact;
}

export function CompanyCell({ contact }: CompanyCellProps) {
  const company = contact.current_employer || contact.contact_company;

  if (!company) {
    return <span className="text-xs text-muted-foreground">-</span>;
  }

  const isTruncated = company.length > 25;
  const displayCompany = isTruncated ? `${company.slice(0, 25)}...` : company;

  if (isTruncated) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-sm text-muted-foreground cursor-default">
              {displayCompany}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{company}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return <span className="text-sm text-muted-foreground">{company}</span>;
}
