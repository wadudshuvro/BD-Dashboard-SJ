import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Code2, 
  Wand2, 
  Download, 
  Copy,
  FileText,
  Settings,
  Plus,
  Trash2
} from 'lucide-react';
import { useGenerateCode, useCodeGenerationTemplates } from '@/hooks/useCodeAnalysis';
import { toast } from 'sonner';

interface GeneratedCode {
  filename: string;
  content: string;
  imports: string[];
  usage_example: string;
  tests?: string;
}

export function CodeGenerationPanel() {
  const [activeTab, setActiveTab] = useState('generate');
  const [generationForm, setGenerationForm] = useState({
    component_type: 'component' as const,
    name: '',
    description: '',
    requirements: [''],
    template_id: '',
    context: {
      framework: 'React',
      styling_approach: 'Tailwind CSS',
    }
  });
  
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  
  const { data: templates } = useCodeGenerationTemplates(generationForm.component_type);
  const generateCode = useGenerateCode();

  const handleGenerate = async () => {
    if (!generationForm.name.trim()) {
      toast.error('Please enter a component name');
      return;
    }

    try {
      const result = await generateCode.mutateAsync({
        ...generationForm,
        requirements: generationForm.requirements.filter(req => req.trim())
      });
      
      setGeneratedCode(result.generated_code);
      toast.success('Code generated successfully!');
    } catch (error) {
      toast.error(`Failed to generate code: ${error.message}`);
    }
  };

  const handleCopyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode.content);
      toast.success('Code copied to clipboard');
    }
  };

  const handleDownloadCode = () => {
    if (generatedCode) {
      const blob = new Blob([generatedCode.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = generatedCode.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('File downloaded');
    }
  };

  const addRequirement = () => {
    setGenerationForm(prev => ({
      ...prev,
      requirements: [...prev.requirements, '']
    }));
  };

  const removeRequirement = (index: number) => {
    setGenerationForm(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const updateRequirement = (index: number, value: string) => {
    setGenerationForm(prev => ({
      ...prev,
      requirements: prev.requirements.map((req, i) => i === index ? value : req)
    }));
  };

  const getComponentTypeIcon = (type: string) => {
    switch (type) {
      case 'component': return <Code2 className="h-4 w-4" />;
      case 'hook': return <Settings className="h-4 w-4" />;
      case 'api': return <FileText className="h-4 w-4" />;
      case 'test': return <FileText className="h-4 w-4" />;
      case 'utility': return <Settings className="h-4 w-4" />;
      case 'page': return <FileText className="h-4 w-4" />;
      default: return <Code2 className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-2">Code Generation</h3>
        <p className="text-muted-foreground">
          Generate high-quality code components following your project's patterns and best practices.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="generate">Generate Code</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Generation Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5" />
                  Code Generation
                </CardTitle>
                <CardDescription>
                  Specify what you want to generate and let AI create the code for you.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Component Type</Label>
                    <Select 
                      value={generationForm.component_type} 
                      onValueChange={(value: any) => setGenerationForm(prev => ({ 
                        ...prev, 
                        component_type: value,
                        template_id: '' // Reset template when type changes
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="component">
                          <div className="flex items-center gap-2">
                            {getComponentTypeIcon('component')}
                            Component
                          </div>
                        </SelectItem>
                        <SelectItem value="hook">
                          <div className="flex items-center gap-2">
                            {getComponentTypeIcon('hook')}
                            Hook
                          </div>
                        </SelectItem>
                        <SelectItem value="api">
                          <div className="flex items-center gap-2">
                            {getComponentTypeIcon('api')}
                            API Route
                          </div>
                        </SelectItem>
                        <SelectItem value="test">
                          <div className="flex items-center gap-2">
                            {getComponentTypeIcon('test')}
                            Test
                          </div>
                        </SelectItem>
                        <SelectItem value="utility">
                          <div className="flex items-center gap-2">
                            {getComponentTypeIcon('utility')}
                            Utility
                          </div>
                        </SelectItem>
                        <SelectItem value="page">
                          <div className="flex items-center gap-2">
                            {getComponentTypeIcon('page')}
                            Page
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Template (Optional)</Label>
                    <Select 
                      value={generationForm.template_id} 
                      onValueChange={(value) => setGenerationForm(prev => ({ ...prev, template_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Default template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates?.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Component Name</Label>
                  <Input
                    value={generationForm.name}
                    onChange={(e) => setGenerationForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., UserProfileCard, useUserData, validateEmail"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={generationForm.description}
                    onChange={(e) => setGenerationForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this component should do..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Requirements</Label>
                    <Button variant="outline" size="sm" onClick={addRequirement}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                  {generationForm.requirements.map((requirement, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={requirement}
                        onChange={(e) => updateRequirement(index, e.target.value)}
                        placeholder="e.g., Should have loading state, Must be responsive"
                      />
                      {generationForm.requirements.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeRequirement(index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={handleGenerate} 
                  className="w-full"
                  disabled={generateCode.isPending || !generationForm.name.trim()}
                >
                  {generateCode.isPending ? 'Generating...' : 'Generate Code'}
                </Button>
              </CardContent>
            </Card>

            {/* Generated Code Display */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Code2 className="h-5 w-5" />
                    Generated Code
                  </span>
                  {generatedCode && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleCopyCode}>
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleDownloadCode}>
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!generatedCode ? (
                  <div className="text-center text-muted-foreground py-12">
                    <Code2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Generated code will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{generatedCode.filename}</Badge>
                    </div>
                    
                    <div className="bg-muted p-4 rounded-lg overflow-auto max-h-96">
                      <pre className="text-sm">
                        <code>{generatedCode.content}</code>
                      </pre>
                    </div>

                    {generatedCode.imports && generatedCode.imports.length > 0 && (
                      <div className="space-y-2">
                        <Label>Required Imports:</Label>
                        <div className="flex flex-wrap gap-2">
                          {generatedCode.imports.map((imp, index) => (
                            <Badge key={index} variant="secondary">{imp}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {generatedCode.usage_example && (
                      <div className="space-y-2">
                        <Label>Usage Example:</Label>
                        <div className="bg-muted p-3 rounded text-sm">
                          <code>{generatedCode.usage_example}</code>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Code Generation Templates</CardTitle>
              <CardDescription>
                Manage reusable templates for different types of components and code patterns.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Template management coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}