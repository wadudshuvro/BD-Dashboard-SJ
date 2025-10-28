import { useParams, Link } from "react-router-dom";
import { useCompanyById } from "@/hooks/useCompanyById";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building2, 
  ExternalLink, 
  Globe, 
  MapPin, 
  Users, 
  Calendar,
  Linkedin,
  ArrowLeft,
  TrendingUp
} from "lucide-react";

export default function CompanyDetail() {
  const { companyId } = useParams<{ companyId: string }>();
  const { data: company, isLoading } = useCompanyById(companyId);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Company Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The company you're looking for doesn't exist.
            </p>
            <Button asChild>
              <Link to="/bd/campaigns">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Campaigns
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/bd/campaigns">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            
            <div className="flex items-start gap-4">
              {company.logo_url ? (
                <img 
                  src={company.logo_url} 
                  alt={`${company.name} logo`}
                  className="h-16 w-16 rounded-lg object-cover border"
                />
              ) : (
                <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center border">
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">{company.name}</h1>
                <div className="flex flex-wrap gap-2">
                  {company.industry && (
                    <Badge variant="secondary">
                      <Building2 className="h-3 w-3 mr-1" />
                      {company.industry}
                    </Badge>
                  )}
                  {company.employee_count && (
                    <Badge variant="secondary">
                      <Users className="h-3 w-3 mr-1" />
                      {company.employee_count} employees
                    </Badge>
                  )}
                  {company.headquarters && (
                    <Badge variant="secondary">
                      <MapPin className="h-3 w-3 mr-1" />
                      {company.headquarters}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {company.website && (
              <Button variant="outline" size="sm" asChild>
                <a href={company.website} target="_blank" rel="noopener noreferrer">
                  <Globe className="h-4 w-4 mr-2" />
                  Website
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            )}
            {company.linkedin_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={company.linkedin_url} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="h-4 w-4 mr-2" />
                  LinkedIn
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Overview */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {company.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {company.description}
                </p>
              )}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                {company.founded_year && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Founded</p>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {company.founded_year}
                    </p>
                  </div>
                )}
                {company.revenue_range && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Revenue</p>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5" />
                      {company.revenue_range}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Technologies */}
          {company.technologies && company.technologies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Technology Stack</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {company.technologies.map((tech, index) => (
                    <Badge key={index} variant="outline">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Specialties */}
          {company.specialties && company.specialties.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Specialties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {company.specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* AI Research Insights */}
        {company.research_summary && Object.keys(company.research_summary).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>AI Research Insights</CardTitle>
              {company.last_researched_at && (
                <p className="text-xs text-muted-foreground">
                  Last researched: {new Date(company.last_researched_at).toLocaleDateString()}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
                {JSON.stringify(company.research_summary, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
  );
}
