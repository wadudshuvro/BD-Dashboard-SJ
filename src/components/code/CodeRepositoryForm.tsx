import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateCodeRepository } from '@/hooks/useCodeAnalysis';
import { toast } from 'sonner';

interface CodeRepositoryFormProps {
  open: boolean;
  onClose: () => void;
}

export function CodeRepositoryForm({ open, onClose }: CodeRepositoryFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    repository_url: '',
    branch: 'main',
    language: '',
    framework: '',
  });

  const createRepository = useCreateCodeRepository();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createRepository.mutateAsync({
        ...formData,
        metadata: {}
      });
      
      toast.success('Repository added successfully');
      onClose();
      setFormData({
        name: '',
        description: '',
        repository_url: '',
        branch: 'main',
        language: '',
        framework: '',
      });
    } catch (error) {
      toast.error(`Failed to add repository: ${error.message}`);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Repository</DialogTitle>
          <DialogDescription>
            Add a repository to analyze its codebase for architecture, quality, and security insights.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Repository Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., my-awesome-project"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch">Branch</Label>
              <Input
                id="branch"
                value={formData.branch}
                onChange={(e) => handleChange('branch', e.target.value)}
                placeholder="main"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Brief description of your project..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="repository_url">Repository URL (Optional)</Label>
            <Input
              id="repository_url"
              type="url"
              value={formData.repository_url}
              onChange={(e) => handleChange('repository_url', e.target.value)}
              placeholder="https://github.com/username/repository"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">Primary Language</Label>
              <Select value={formData.language} onValueChange={(value) => handleChange('language', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TypeScript">TypeScript</SelectItem>
                  <SelectItem value="JavaScript">JavaScript</SelectItem>
                  <SelectItem value="Python">Python</SelectItem>
                  <SelectItem value="Java">Java</SelectItem>
                  <SelectItem value="C#">C#</SelectItem>
                  <SelectItem value="Go">Go</SelectItem>
                  <SelectItem value="Rust">Rust</SelectItem>
                  <SelectItem value="PHP">PHP</SelectItem>
                  <SelectItem value="Ruby">Ruby</SelectItem>
                  <SelectItem value="Swift">Swift</SelectItem>
                  <SelectItem value="Kotlin">Kotlin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="framework">Framework</Label>
              <Select value={formData.framework} onValueChange={(value) => handleChange('framework', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select framework" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="React">React</SelectItem>
                  <SelectItem value="Next.js">Next.js</SelectItem>
                  <SelectItem value="Vue.js">Vue.js</SelectItem>
                  <SelectItem value="Angular">Angular</SelectItem>
                  <SelectItem value="Svelte">Svelte</SelectItem>
                  <SelectItem value="Express.js">Express.js</SelectItem>
                  <SelectItem value="Fastify">Fastify</SelectItem>
                  <SelectItem value="Django">Django</SelectItem>
                  <SelectItem value="Flask">Flask</SelectItem>
                  <SelectItem value="Spring Boot">Spring Boot</SelectItem>
                  <SelectItem value="ASP.NET">ASP.NET</SelectItem>
                  <SelectItem value="Laravel">Laravel</SelectItem>
                  <SelectItem value="Ruby on Rails">Ruby on Rails</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createRepository.isPending || !formData.name.trim()}
            >
              {createRepository.isPending ? 'Adding...' : 'Add Repository'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}