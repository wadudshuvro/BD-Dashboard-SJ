import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ModelSettings {
  default_model: string;
  temperature?: number;
  max_tokens?: number;
  max_completion_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

const MODEL_OPTIONS = [
  { 
    value: 'gpt-5-2025-08-07', 
    label: 'GPT-5 (Latest)', 
    description: 'Most capable model with superior reasoning',
    type: 'latest'
  },
  { 
    value: 'gpt-5-mini-2025-08-07', 
    label: 'GPT-5 Mini', 
    description: 'Faster, cost-efficient version of GPT-5',
    type: 'latest'
  },
  { 
    value: 'gpt-4.1-2025-04-14', 
    label: 'GPT-4.1', 
    description: 'Reliable flagship GPT-4 model',
    type: 'latest'
  },
  { 
    value: 'o3-2025-04-16', 
    label: 'O3', 
    description: 'Powerful reasoning model for complex analysis',
    type: 'latest'
  },
  { 
    value: 'o4-mini-2025-04-16', 
    label: 'O4 Mini', 
    description: 'Fast reasoning model optimized for efficiency',
    type: 'latest'
  },
  { 
    value: 'gpt-4o', 
    label: 'GPT-4o', 
    description: 'Multimodal model with vision capabilities',
    type: 'legacy'
  },
  { 
    value: 'gpt-4o-mini', 
    label: 'GPT-4o Mini', 
    description: 'Fast and affordable multimodal model',
    type: 'legacy'
  }
];

export function AIModelConfiguration() {
  const { toast } = useToast();
  const [config, setConfig] = useState<ModelSettings>({
    default_model: 'gpt-4o-mini',
    temperature: 0.7,
    max_tokens: 2000,
    max_completion_tokens: 2000
  });
  const [loading, setLoading] = useState(false);

  const selectedModel = MODEL_OPTIONS.find(m => m.value === config.default_model);
  const isNewerModel = selectedModel?.type === 'latest';

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('ai_configurations')
        .select('configuration_data')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data?.configuration_data) {
        setConfig(data.configuration_data as unknown as ModelSettings);
      }
    } catch (error) {
      console.error('Error loading model configuration:', error);
    }
  };

  const saveConfiguration = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('ai_configurations')
        .upsert({
          user_id: user.id,
          configuration_data: config as any,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "Configuration Saved",
        description: "Model settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save model configuration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Model Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="model">Default Model</Label>
          <Select 
            value={config.default_model} 
            onValueChange={(value) => setConfig(prev => ({ ...prev, default_model: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              {MODEL_OPTIONS.map((model) => (
                <SelectItem key={model.value} value={model.value}>
                  <div className="flex items-center gap-2">
                    <span>{model.label}</span>
                    <Badge variant={model.type === 'latest' ? 'default' : 'secondary'}>
                      {model.type}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedModel && (
            <p className="text-sm text-muted-foreground mt-1">
              {selectedModel.description}
            </p>
          )}
        </div>

        {!isNewerModel && (
          <div>
            <Label>Temperature: {config.temperature}</Label>
            <Slider
              value={[config.temperature || 0.7]}
              onValueChange={([value]) => setConfig(prev => ({ ...prev, temperature: value }))}
              min={0}
              max={1}
              step={0.1}
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Controls randomness: 0 = focused, 1 = creative
            </p>
          </div>
        )}

        {isNewerModel && (
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Newer models (GPT-5, O3, O4) don't support temperature adjustment and use max_completion_tokens instead of max_tokens.
            </p>
          </div>
        )}

        <div>
          <div className="flex-1">
            <Label>
              {isNewerModel ? 'Max Completion Tokens' : 'Max Tokens'}: {isNewerModel ? config.max_completion_tokens : config.max_tokens}
            </Label>
            <Slider
              value={[isNewerModel ? (config.max_completion_tokens || 2000) : (config.max_tokens || 2000)]}
              onValueChange={([value]) => setConfig(prev => ({
                ...prev,
                [isNewerModel ? 'max_completion_tokens' : 'max_tokens']: value
              }))}
              min={100}
              max={4000}
              step={100}
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Maximum length of the model's response
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Top P: {config.top_p || 1}</Label>
            <Slider
              value={[config.top_p || 1]}
              onValueChange={([value]) => setConfig(prev => ({ ...prev, top_p: value }))}
              min={0}
              max={1}
              step={0.1}
              className="mt-2"
            />
          </div>
          
          <div>
            <Label>Frequency Penalty: {config.frequency_penalty || 0}</Label>
            <Slider
              value={[config.frequency_penalty || 0]}
              onValueChange={([value]) => setConfig(prev => ({ ...prev, frequency_penalty: value }))}
              min={-2}
              max={2}
              step={0.1}
              className="mt-2"
            />
          </div>
        </div>

        <Button onClick={saveConfiguration} disabled={loading} className="w-full">
          {loading ? "Saving..." : "Save Configuration"}
        </Button>
      </CardContent>
    </Card>
  );
}