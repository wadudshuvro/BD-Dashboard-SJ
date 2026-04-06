import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, CheckCircle2, ExternalLink, Sparkles, Loader2, Info } from "lucide-react";

const STORAGE_KEY = "llm_provider_config";

type ProviderKey = "lovable" | "openai" | "gemini" | "claude";

interface ProviderDef {
  key: ProviderKey;
  name: string;
  models: string[];
  getKeyUrl: string;
  defaultConfigured?: boolean;
}

const PROVIDERS: ProviderDef[] = [
  { key: "lovable", name: "Lovable AI", models: ["lovable-2", "lovable-2-mini"], getKeyUrl: "#", defaultConfigured: true },
  { key: "openai", name: "OpenAI", models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"], getKeyUrl: "https://platform.openai.com/api-keys" },
  { key: "gemini", name: "Google Gemini", models: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"], getKeyUrl: "https://aistudio.google.com/app/apikey" },
  { key: "claude", name: "Anthropic Claude", models: ["claude-3-5-sonnet", "claude-3-5-haiku", "claude-3-opus"], getKeyUrl: "https://console.anthropic.com/settings/keys" },
];

interface ProviderState {
  apiKey: string;
  isConfigured: boolean;
  showKey: boolean;
  isTesting: boolean;
}

function loadStoredConfig(): Record<ProviderKey, ProviderState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const initial: Record<ProviderKey, ProviderState> = {} as Record<ProviderKey, ProviderState>;
    for (const p of PROVIDERS) {
      initial[p.key] = {
        apiKey: "",
        isConfigured: p.defaultConfigured ?? !!parsed[p.key]?.isConfigured,
        showKey: false,
        isTesting: false,
      };
    }
    return initial;
  } catch {
    const initial: Record<ProviderKey, ProviderState> = {} as Record<ProviderKey, ProviderState>;
    for (const p of PROVIDERS) {
      initial[p.key] = { apiKey: "", isConfigured: p.defaultConfigured ?? false, showKey: false, isTesting: false };
    }
    return initial;
  }
}

function saveStoredConfig(states: Record<ProviderKey, ProviderState>) {
  const toSave: Record<string, { isConfigured: boolean }> = {};
  for (const k of Object.keys(states) as ProviderKey[]) {
    toSave[k] = { isConfigured: states[k].isConfigured };
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

export default function LLMConfig() {
  const [states, setStates] = useState<Record<ProviderKey, ProviderState>>(loadStoredConfig);

  useEffect(() => {
    saveStoredConfig(states);
  }, [states]);

  const configuredCount = Object.values(states).filter((s) => s.isConfigured).length;
  const totalModels = PROVIDERS.reduce((acc, p) => acc + (states[p.key]?.isConfigured ? p.models.length : 0), 0);

  const setState = (key: ProviderKey, patch: Partial<ProviderState>) => {
    setStates((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const handleSaveKey = (key: ProviderKey) => {
    const keyValue = states[key].apiKey?.trim();
    setState(key, { isConfigured: !!keyValue, apiKey: "" });
  };

  const handleTest = (key: ProviderKey) => {
    setState(key, { isTesting: true });
    setTimeout(() => setState(key, { isTesting: false }), 1500);
  };

  const handleDisconnect = (key: ProviderKey) => {
    setState(key, { isConfigured: false, apiKey: "" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">LLM Provider Config</h1>
        <p className="text-muted-foreground">Connect providers to unlock models for AI agents.</p>
      </div>

      <div className="flex gap-4 flex-wrap">
        <Badge variant="secondary">Connected: {configuredCount}</Badge>
        <Badge variant="outline">Models: {totalModels}</Badge>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>Lovable AI is always available at no cost. Add API keys for OpenAI, Gemini, or Claude to use those models.</AlertDescription>
      </Alert>

      <Separator />

      <div className="grid gap-4 md:grid-cols-2">
        {PROVIDERS.map((provider) => {
          const s = states[provider.key];
          const isDefault = provider.defaultConfigured;
          return (
            <Card key={provider.key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  {provider.key === "lovable" && <Sparkles className="h-5 w-5" />}
                  {provider.name}
                  {s.isConfigured && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                </CardTitle>
                <CardDescription>
                  {provider.models.length} model{provider.models.length !== 1 ? "s" : ""}
                  {!s.isConfigured && ` — connect to unlock`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isDefault ? (
                  <p className="text-sm text-muted-foreground">No API key required. Always on.</p>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>API Key</Label>
                      <div className="flex gap-2">
                        <Input
                          type={s.showKey ? "text" : "password"}
                          placeholder="Paste key (not stored on server)"
                          value={s.apiKey}
                          onChange={(e) => setState(provider.key, { apiKey: e.target.value })}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setState(provider.key, { showKey: !s.showKey })}
                        >
                          {s.showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => handleSaveKey(provider.key)} disabled={!s.apiKey?.trim()}>
                        Save Key
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <a href={provider.getKeyUrl} target="_blank" rel="noopener noreferrer">
                          Get key <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </Button>
                      {s.isConfigured && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleTest(provider.key)} disabled={s.isTesting}>
                            {s.isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDisconnect(provider.key)}>
                            Disconnect
                          </Button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
