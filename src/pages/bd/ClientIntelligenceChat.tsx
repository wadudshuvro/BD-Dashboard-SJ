import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useClientBySlug } from "@/hooks/useClientBySlug";
import { useRunClientIntelligence } from "@/hooks/useRunClientIntelligence";
import { useIntelligenceSessions, useSaveIntelligenceSession } from "@/hooks/useIntelligenceSessions";
import { IntelligenceChatInput } from "@/components/intelligence/IntelligenceChatInput";
import { IntelligenceChatMessages } from "@/components/intelligence/IntelligenceChatMessages";
import { IntelligenceHistorySidebar } from "@/components/intelligence/IntelligenceHistorySidebar";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: any;
  timestamp: Date;
  mode?: "quick" | "deep";
}

export default function ClientIntelligenceChat() {
  const { clientSlug } = useParams();
  const navigate = useNavigate();
  const { data: client, isLoading: clientLoading } = useClientBySlug(clientSlug);
  const { data: sessions = [], isLoading: sessionsLoading } = useIntelligenceSessions(client?.id || "");
  const runIntelligence = useRunClientIntelligence();
  const saveSession = useSaveIntelligenceSession();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const handleAsk = async (question: string, mode: "quick" | "deep") => {
    if (!client) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: question,
      timestamp: new Date(),
      mode,
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const result = await runIntelligence.mutateAsync({
        clientId: client.id,
        question,
        mode,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result.response || result,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Save session
      await saveSession.mutateAsync({
        clientId: client.id,
        question,
        mode,
        responseData: result.response || result,
        tokensUsed: result.telemetry?.[0]?.tokenUsage?.totalTokens,
        processingTimeMs: result.processing_time_ms,
      });
    } catch (error) {
      console.error("Failed to get intelligence:", error);
    }
  };

  const handleLoadSession = (session: any) => {
    setActiveSessionId(session.id);
    setMessages([
      {
        id: session.id + "-q",
        role: "user",
        content: session.question,
        timestamp: new Date(session.created_at),
        mode: session.mode,
      },
      {
        id: session.id + "-a",
        role: "assistant",
        content: session.response_data,
        timestamp: new Date(session.created_at),
      },
    ]);
  };

  if (clientLoading) {
    return <div className="p-8">Loading client...</div>;
  }

  if (!client) {
    return <div className="p-8">Client not found</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/clients/${clientSlug}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Client
            </Button>
            <div className="h-8 w-px bg-border" />
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">{client.name}</h1>
                <p className="text-sm text-muted-foreground">Intelligence Assistant</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* History Sidebar */}
          <div className="col-span-3">
            <IntelligenceHistorySidebar
              sessions={sessions}
              activeSessionId={activeSessionId}
              onLoadSession={handleLoadSession}
              onNewChat={() => {
                setMessages([]);
                setActiveSessionId(null);
              }}
              isLoading={sessionsLoading}
            />
          </div>

          {/* Chat Area */}
          <div className="col-span-6">
            <Card className="flex h-[calc(100vh-200px)] flex-col">
              <IntelligenceChatMessages messages={messages} clientId={client.id} />
              <IntelligenceChatInput
                onAsk={handleAsk}
                isLoading={runIntelligence.isPending}
              />
            </Card>
          </div>

          {/* Stats Panel */}
          <div className="col-span-3">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Session Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Sessions</span>
                  <span className="font-medium">{sessions.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Quick Analyses</span>
                  <span className="font-medium">
                    {sessions.filter((s) => s.mode === "quick").length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Deep Analyses</span>
                  <span className="font-medium">
                    {sessions.filter((s) => s.mode === "deep").length}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
