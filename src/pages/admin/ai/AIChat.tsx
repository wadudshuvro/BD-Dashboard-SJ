import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAdminAIAgents } from "@/hooks/useAdminAIAgents";
import {
  useAgentConversations,
  useAgentMessages,
  useSendAgentMessage,
  type AgentConversation,
  type AgentMessage,
} from "@/hooks/useAgentConversations";
import { ArrowLeft, Send, Loader2, Bot } from "lucide-react";

export default function AIChat() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const agentId = searchParams.get("agent");
  const convIdParam = searchParams.get("conversation");

  const { data: agents = [], isLoading: agentsLoading } = useAdminAIAgents();
  const agent = agents.find((a) => a.id === agentId);
  const { data: conversations = [] } = useAgentConversations(agentId);
  const [activeConvId, setActiveConvId] = useState<string | null>(convIdParam || null);
  const { data: messages = [], isLoading: messagesLoading } = useAgentMessages(activeConvId);
  const sendMessage = useSendAgentMessage(agentId ?? "", activeConvId);
  const [input, setInput] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (convIdParam) setActiveConvId(convIdParam);
    else if (conversations.length > 0 && !activeConvId) setActiveConvId(conversations[0].id);
  }, [convIdParam, conversations, activeConvId]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !agentId) return;
    try {
      const result = await sendMessage.mutateAsync(text);
      setInput("");
      if (result.conversationId && result.conversationId !== activeConvId) {
        setActiveConvId(result.conversationId);
        navigate(`/adminpanel/ai/chat?agent=${agentId}&conversation=${result.conversationId}`, { replace: true });
      }
    } catch (e) {
      toast({ title: "Send failed", description: (e as Error).message, variant: "destructive" });
    }
  };

  if (!agentId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <p className="text-muted-foreground">Select an agent from Agent Management to start chatting.</p>
        <Button variant="outline" onClick={() => navigate("/adminpanel/ai/agent-management")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Agent Management
        </Button>
      </div>
    );
  }

  if (agentsLoading || !agent) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-4 pb-2 border-b">
        <Button variant="ghost" size="sm" onClick={() => navigate("/adminpanel/ai/agent-management")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <span className="font-semibold">{agent.name}</span>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 gap-4 pt-4">
        {conversations.length > 1 && (
          <div className="w-56 shrink-0 border-r pr-2">
            <p className="text-sm font-medium mb-2">Conversations</p>
            <ScrollArea className="h-64">
              <ul className="space-y-1">
                {conversations.map((c) => (
                  <li key={c.id}>
                    <Button
                      variant={activeConvId === c.id ? "secondary" : "ghost"}
                      size="sm"
                      className="w-full justify-start text-left truncate"
                      onClick={() => {
                        setActiveConvId(c.id);
                        navigate(`/adminpanel/ai/chat?agent=${agentId}&conversation=${c.id}`, { replace: true });
                      }}
                    >
                      {c.title || `Chat ${c.message_count}`}
                    </Button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          {!activeConvId && messages.length === 0 ? (
            <Card className="flex-1 flex flex-col items-center justify-center mb-4">
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground mb-4">Send a message to start a new conversation.</p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="flex-1 pr-4 mb-4">
              {messagesLoading ? (
                <Skeleton className="h-48" />
              ) : (
                <div className="space-y-4">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <Card className={`max-w-[85%] ${m.role === "user" ? "bg-primary text-primary-foreground" : ""}`}>
                        <CardContent className="p-3">
                          {m.role === "assistant" ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                            </div>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                          )}
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(m.created_at).toLocaleTimeString()}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}
          <div className="flex gap-2">
            <Textarea
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={2}
              className="resize-none"
            />
            <Button onClick={handleSend} disabled={sendMessage.isPending || !input.trim()} size="icon" className="shrink-0 h-10 w-10">
              {sendMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
