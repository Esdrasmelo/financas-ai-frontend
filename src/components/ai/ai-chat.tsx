"use client";

import * as React from "react";
import { Bot, Send, User, Sparkles, Loader2, MessageSquarePlus, History, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiBase, authFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

function formatInline(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code class="rounded bg-black/10 px-1 py-0.5 text-xs">$1</code>');
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ConversationSummary {
  id: string;
  title: string | null;
  updatedAt: string;
  _count: { messages: number };
}

const SUGGESTIONS = [
  "Quanto gastei este mês?",
  "Qual minha maior categoria de gasto?",
  "Como estão meus cartões?",
  "Tenho faturas pra vencer?",
];

export function AiChat() {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [conversationId, setConversationId] = React.useState<string | undefined>();
  const [conversations, setConversations] = React.useState<ConversationSummary[]>([]);
  const [showHistory, setShowHistory] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  React.useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations() {
    const base = getApiBase();
    try {
      const res = await authFetch(`${base}/ai/conversations`);
      if (res.ok) setConversations(await res.json() as ConversationSummary[]);
    } catch {}
  }

  async function loadConversation(id: string) {
    const base = getApiBase();
    try {
      const res = await authFetch(`${base}/ai/conversations/${id}`);
      if (res.ok) {
        const data = await res.json() as { id: string; messages: Message[] };
        setConversationId(data.id);
        setMessages(data.messages);
        setShowHistory(false);
      }
    } catch {}
  }

  async function deleteConversation(id: string) {
    const base = getApiBase();
    try {
      await authFetch(`${base}/ai/conversations/${id}`, { method: "DELETE" });
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (conversationId === id) startNewChat();
    } catch {}
  }

  function startNewChat() {
    setConversationId(undefined);
    setMessages([]);
    setShowHistory(false);
  }

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const base = getApiBase();
      const res = await authFetch(`${base}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          conversationId,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { reply: string; conversationId: string };
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
        setConversationId(data.conversationId);
        void loadConversations();
      } else {
        const err = await res.json().catch(() => null);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: (err as { message?: string })?.message ?? "Desculpe, ocorreu um erro. Tente novamente." },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Não foi possível conectar ao assistente. Verifique sua conexão." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void sendMessage(input);
  }

  return (
    <div className="flex h-[480px] flex-col overflow-hidden rounded-2xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">Assistente financeiro</p>
            <p className="text-[11px] text-muted-foreground">IA integrada aos seus dados</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowHistory(!showHistory)}
            aria-label="Histórico"
          >
            <History className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={startNewChat}
            aria-label="Nova conversa"
          >
            <MessageSquarePlus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* History sidebar */}
      {showHistory ? (
        <div className="flex-1 overflow-y-auto">
          <div className="p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Conversas anteriores</p>
            {conversations.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">Nenhuma conversa salva</p>
            ) : (
              <div className="space-y-1">
                {conversations.map((c) => (
                  <div
                    key={c.id}
                    className={cn(
                      "group flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted",
                      c.id === conversationId && "bg-primary/10",
                    )}
                  >
                    <button
                      onClick={() => void loadConversation(c.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="truncate text-sm">{c.title || "Sem título"}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {c._count.messages} mensagens
                      </p>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => void deleteConversation(c.id)}
                      aria-label="Excluir conversa"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium">Como posso ajudar?</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Faça perguntas sobre suas finanças.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => void sendMessage(s)}
                      className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn("flex gap-2.5", msg.role === "user" ? "justify-end" : "justify-start")}
              >
                {msg.role === "assistant" && (
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground",
                  )}
                >
                  {msg.content.split("\n").map((line, j) => (
                    <p key={j} className={j > 0 ? "mt-1.5" : ""} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
                  ))}
                </div>
                {msg.role === "user" && (
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-muted px-3.5 py-2.5 text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Analisando...
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t border-border p-3">
            <div className="flex gap-2">
              <Input
                placeholder="Pergunte sobre suas finanças..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={loading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
