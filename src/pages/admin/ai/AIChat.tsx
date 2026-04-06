import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAdminAIAgents } from "@/hooks/useAdminAIAgents";
import {
  useAgentConversations,
  useAgentMessages,
  useSendAgentMessage,
  useDeleteAgentConversation,
  type AgentConversation,
} from "@/hooks/useAgentConversations";
import {
  ArrowLeft,
  Send,
  Loader2,
  Bot,
  Plus,
  MessageSquare,
  Trash2,
  Brain,
  Clock,
  User,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

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
  const deleteConversation = useDeleteAgentConversation(agentId ?? "");
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isNewChat, setIsNewChat] = useState(false);

  useEffect(() => {
    if (convIdParam) {
      setActiveConvId(convIdParam);
      setIsNewChat(false);
    } else if (!isNewChat && conversations.length > 0 && !activeConvId) {
      setActiveConvId(conversations[0].id);
    }
  }, [convIdParam, conversations, activeConvId, isNewChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !agentId) return;
    try {
      const result = await sendMessage.mutateAsync(text);
      setInput("");
      setIsNewChat(false);
      if (result.conversationId && result.conversationId !== activeConvId) {
        setActiveConvId(result.conversationId);
        navigate(`/adminpanel/ai/chat?agent=${agentId}&conversation=${result.conversationId}`, { replace: true });
      }
    } catch (e) {
      toast({ title: "Send failed", description: (e as Error).message, variant: "destructive" });
    }
  };

  const handleNewChat = () => {
    setActiveConvId(null);
    setIsNewChat(true);
    navigate(`/adminpanel/ai/chat?agent=${agentId}`, { replace: true });
  };

  const handleSelectConversation = (convId: string) => {
    setActiveConvId(convId);
    navigate(`/adminpanel/ai/chat?agent=${agentId}&conversation=${convId}`, { replace: true });
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteConversation.mutateAsync(convId);
      if (activeConvId === convId) {
        setActiveConvId(null);
        navigate(`/adminpanel/ai/chat?agent=${agentId}`, { replace: true });
      }
      toast({ title: "Conversation deleted" });
    } catch (err) {
      toast({ title: "Delete failed", description: (err as Error).message, variant: "destructive" });
    }
  };

  if (!agentId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="rounded-full bg-muted p-6">
          <Bot className="h-12 w-12 text-muted-foreground" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">No Agent Selected</h2>
          <p className="text-muted-foreground max-w-sm">
            Select an agent from Agent Management to start a conversation.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/adminpanel/ai/agent-management")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Go to Agent Management
        </Button>
      </div>
    );
  }

  if (agentsLoading || !agent) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[70vh]" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-0 overflow-hidden rounded-lg border bg-background">
      {/* Conversation Sidebar */}
      <div
        className={cn(
          "border-r bg-muted/30 flex flex-col transition-all duration-300",
          sidebarOpen ? "w-72" : "w-0 overflow-hidden"
        )}
      >
        {/* Sidebar Header */}
        <div className="p-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Bot className="h-4 w-4 text-primary shrink-0" />
            <span className="font-medium text-sm truncate">{agent.name}</span>
          </div>
          {agent.memory_enabled && (
            <Badge variant="outline" className="text-xs shrink-0 gap-1">
              <Brain className="h-3 w-3" /> Memory
            </Badge>
          )}
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <Button onClick={handleNewChat} className="w-full gap-2" size="sm">
            <Plus className="h-4 w-4" /> New Chat
          </Button>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="px-2 pb-2 space-y-1">
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                No conversations yet
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={cn(
                    "w-full text-left p-2.5 rounded-md transition-colors group relative",
                    "hover:bg-accent/50",
                    activeConvId === conv.id
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {conv.title || `Chat ${conv.message_count}`}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {conv.last_message_at
                            ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })
                            : "just now"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                    className="absolute right-2 top-2.5 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="h-12 border-b flex items-center gap-2 px-3 bg-background shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => navigate("/adminpanel/ai/agent-management")}
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Agents
          </Button>
          <div className="h-4 w-px bg-border" />
          <span className="text-sm font-medium truncate">
            {activeConvId
              ? conversations.find((c) => c.id === activeConvId)?.title || "Chat"
              : "New Conversation"}
          </span>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
          {!activeConvId && messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 px-4">
              <div className="rounded-full bg-primary/10 p-4">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-semibold">Start a conversation</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Send a message to {agent.name} to begin.
                  {agent.memory_enabled && " This agent has memory enabled and will remember context across conversations."}
                </p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
                {messagesLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-16 w-3/4" />
                    <Skeleton className="h-20 w-3/4 ml-auto" />
                    <Skeleton className="h-16 w-3/4" />
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}
                    >
                      {m.role === "assistant" && (
                        <div className="shrink-0 h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-2.5",
                          m.role === "user"
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted rounded-bl-md"
                        )}
                      >
                        {m.role === "assistant" ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                        )}
                        <p className={cn(
                          "text-[10px] mt-1.5",
                          m.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"
                        )}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      {m.role === "user" && (
                        <div className="shrink-0 h-7 w-7 rounded-full bg-primary flex items-center justify-center mt-0.5">
                          <User className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  ))
                )}
                {sendMessage.isPending && (
                  <div className="flex gap-3 items-start">
                    <div className="shrink-0 h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex gap-1">
                        <div className="h-2 w-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="h-2 w-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="h-2 w-2 bg-muted-foreground/40 rounded-full animate-bounce" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t bg-background p-3 shrink-0">
          <div className="max-w-3xl mx-auto flex gap-2 items-end">
            <Textarea
              placeholder={`Message ${agent.name}...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={1}
              className="resize-none min-h-[40px] max-h-[120px] rounded-xl bg-muted/50 border-muted-foreground/20"
            />
            <Button
              onClick={handleSend}
              disabled={sendMessage.isPending || !input.trim()}
              size="icon"
              className="shrink-0 h-10 w-10 rounded-xl"
            >
              {sendMessage.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
