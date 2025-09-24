import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";

export function ChatPanel({
  open, onClose, agent, onSend, pending, messages
}: {
  open: boolean;
  onClose: () => void;
  agent: any | null;
  onSend: (message: string) => void;
  pending: boolean;
  messages: { role: "user" | "assistant"; content: string }[];
}) {
  const [input, setInput] = useState("");
  
  if (!open || !agent) return null;

  const handleSend = () => {
    if (!input.trim() || pending) return;
    onSend(input);
    setInput("");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Chat with {agent.name}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-0">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                Start a conversation with {agent.name}
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground ml-8"
                    : "bg-muted mr-8"
                }`}
              >
                <div className="text-sm font-medium mb-1">
                  {message.role === "user" ? "You" : agent.name}
                </div>
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
            ))}
            {pending && (
              <div className="bg-muted mr-8 p-3 rounded-lg">
                <div className="text-sm font-medium mb-1">{agent.name}</div>
                <div className="text-muted-foreground">Thinking...</div>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="min-h-[60px]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button 
              disabled={!input.trim() || pending} 
              onClick={handleSend}
              className="w-full"
            >
              {pending ? "Sending..." : "Send"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}