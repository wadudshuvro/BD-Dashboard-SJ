import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Code2, 
  FileSearch, 
  GitBranch, 
  Shield, 
  Zap, 
  BookOpen,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Plus,
  Play,
  FileText
} from 'lucide-react';
import { useCodeRepositories, useCodeAnalysisResults, useAnalyzeCodebase } from '@/hooks/useCodeAnalysis';
import { CodeRepositoryForm } from './CodeRepositoryForm';
import { CodeGenerationPanel } from './CodeGenerationPanel';
import { toast } from 'sonner';

interface AnalysisTypeBadgeProps {
  type: string;
}

const AnalysisTypeBadge: React.FC<AnalysisTypeBadgeProps> = ({ type }) => {
  const getIcon = () => {
    switch (type) {
      case 'architecture': return <Code2 className="h-3 w-3" />;
      case 'quality': return <FileSearch className="h-3 w-3" />;
      case 'security': return <Shield className="h-3 w-3" />;
      case 'performance': return <Zap className="h-3 w-3" />;
      case 'documentation': return <BookOpen className="h-3 w-3" />;
      default: return <FileText className="h-3 w-3" />;
    }
  };

  const getVariant = () => {
    switch (type) {
      case 'architecture': return 'default';
      case 'quality': return 'secondary';
      case 'security': return 'destructive';
      case 'performance': return 'outline';
      case 'documentation': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <Badge variant={getVariant()}>
      {getIcon()}
      <span className="ml-1 capitalize">{type}</span>
    </Badge>
  );
};

interface SeverityBadgeProps {
  severity: string;
}

const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity }) => {
  const getIcon = () => {
    switch (severity) {
      case 'info': return <Info className="h-3 w-3" />;
      case 'warning': return <AlertTriangle className="h-3 w-3" />;
      case 'error': return <XCircle className="h-3 w-3" />;
      case 'critical': return <XCircle className="h-3 w-3" />;
      default: return <Info className="h-3 w-3" />;
    }
  };

  const getVariant = () => {
    switch (severity) {
      case 'info': return 'default';
      case 'warning': return 'secondary';
      case 'error': return 'destructive';
      case 'critical': return 'destructive';
      default: return 'default';
    }
  };

  return (
    <Badge variant={getVariant()}>
      {getIcon()}
      <span className="ml-1 capitalize">{severity}</span>
    </Badge>
  );
};

export function CodeAnalysisDashboard() {
  const [selectedRepository, setSelectedRepository] = useState<string | null>(null);
  const [showRepositoryForm, setShowRepositoryForm] = useState(false);
  
  const { data: repositories, isLoading: reposLoading } = useCodeRepositories();
  const { data: analysisResults } = useCodeAnalysisResults(selectedRepository || undefined);
  const analyzeCodebase = useAnalyzeCodebase();

  const handleAnalyze = async (repositoryId: string, analysisType: string) => {
    try {
      await analyzeCodebase.mutateAsync({
        repository_id: repositoryId,
        analysis_type: analysisType as any
      });
      toast.success(`${analysisType} analysis started successfully`);
    } catch (error) {
      toast.error(`Failed to start analysis: ${error.message}`);
    }
  };

  const getAnalysisProgress = (repository: any) => {
    if (repository.analysis_status === 'completed') return 100;
    if (repository.analysis_status === 'analyzing') return 50;
    if (repository.analysis_status === 'error') return 0;
    return 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'analyzing': return 'text-blue-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  if (reposLoading) {
    return <div className="flex items-center justify-center p-8">Loading repositories...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Code Analysis Dashboard</h2>
          <p className="text-muted-foreground">
            Analyze your codebase for architecture, quality, security, and performance insights
          </p>
        </div>
        <Button onClick={() => setShowRepositoryForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Repository
        </Button>
      </div>

      <Tabs defaultValue="repositories" className="space-y-6">
        <TabsList>
          <TabsTrigger value="repositories">Repositories</TabsTrigger>
          <TabsTrigger value="analysis">Analysis Results</TabsTrigger>
          <TabsTrigger value="generation">Code Generation</TabsTrigger>
        </TabsList>

        <TabsContent value="repositories" className="space-y-4">
          {repositories?.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <GitBranch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Repositories Found</h3>
                <p className="text-muted-foreground mb-4">
                  Add your first repository to start analyzing your codebase
                </p>
                <Button onClick={() => setShowRepositoryForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Repository
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {repositories?.map((repo) => (
                <Card key={repo.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{repo.name}</CardTitle>
                      <Badge variant={repo.analysis_status === 'completed' ? 'default' : 'secondary'}>
                        <span className={getStatusColor(repo.analysis_status)}>
                          {repo.analysis_status}
                        </span>
                      </Badge>
                    </div>
                    <CardDescription>{repo.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      {repo.framework && <Badge variant="outline">{repo.framework}</Badge>}
                      {repo.language && <Badge variant="outline">{repo.language}</Badge>}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Analysis Progress</span>
                        <span>{getAnalysisProgress(repo)}%</span>
                      </div>
                      <Progress value={getAnalysisProgress(repo)} />
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {['architecture', 'quality', 'security', 'performance', 'documentation'].map((type) => (
                        <Button
                          key={type}
                          variant="outline"
                          size="sm"
                          onClick={() => handleAnalyze(repo.id, type)}
                          disabled={analyzeCodebase.isPending || repo.analysis_status === 'analyzing'}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          {type}
                        </Button>
                      ))}
                    </div>

                    <Button 
                      variant="secondary" 
                      className="w-full"
                      onClick={() => setSelectedRepository(repo.id)}
                    >
                      View Analysis Results
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          {!selectedRepository ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileSearch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Repository</h3>
                <p className="text-muted-foreground">
                  Choose a repository from the Repositories tab to view analysis results
                </p>
              </CardContent>
            </Card>
          ) : analysisResults?.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileSearch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Analysis Results</h3>
                <p className="text-muted-foreground">
                  Run an analysis on your repository to see results here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {analysisResults?.map((result) => (
                <Card key={result.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AnalysisTypeBadge type={result.analysis_type} />
                        <SeverityBadge severity={result.severity} />
                      </div>
                      <Badge variant={result.status === 'active' ? 'destructive' : 'default'}>
                        {result.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {result.file_path && (
                      <p className="text-sm text-muted-foreground mb-2">
                        File: {result.file_path}
                      </p>
                    )}
                    <div className="bg-muted p-4 rounded-lg">
                      <pre className="text-sm whitespace-pre-wrap">
                        {typeof result.findings === 'object' 
                          ? JSON.stringify(result.findings, null, 2)
                          : result.findings
                        }
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="generation">
          <CodeGenerationPanel />
        </TabsContent>
      </Tabs>

      {showRepositoryForm && (
        <CodeRepositoryForm 
          open={showRepositoryForm}
          onClose={() => setShowRepositoryForm(false)}
        />
      )}
    </div>
  );
}