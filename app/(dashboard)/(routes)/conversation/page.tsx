"use client";

import * as z from "zod";
import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import ReactMarkdown from "react-markdown";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquare } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChatCompletionRequestMessage } from "openai";
import { useProModal } from "@/hooks/use-pro-modal";

import { cn } from "@/lib/utils";
import { Heading } from "@/components/heading";
import { Empty } from "@/components/ui/empty";
import { Loader } from "@/components/loader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BotAvatar } from "@/components/bot-avatar";
import { UserAvatar } from "@/components/user-avatar";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";

import { formSchema } from "./constants";
import toast from "react-hot-toast";

type ConversationMessage = ChatCompletionRequestMessage & {
  id?: string;
  createdAt?: string;
};

type ChatSession = {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
};

type SessionHistoryResponse = {
  sessionId: string;
  messages: {
    id: string;
    role: string;
    content: string;
    createdAt: string;
    updatedAt: string;
  }[];
};

type SessionListResponse = {
  sessions: ChatSession[];
};

const ConversationPage = () => {
  const router = useRouter();
  const proModal = useProModal();
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const hasInitializedSession = useRef(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  const fetchSessions = useCallback(async () => {
    try {
      const response = await axios.get<SessionListResponse>(
        "/api/conversation"
      );
      setSessions(response.data.sessions ?? []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load conversations");
    }
  }, []);

  const loadSessionMessages = useCallback(
    async (sessionId: string) => {
      try {
        setIsHistoryLoading(true);
        const response = await axios.get<SessionHistoryResponse>(
          `/api/conversation?sessionId=${sessionId}`
        );
        const sessionMessages = response.data.messages.map((message) => ({
          id: message.id,
          role: message.role as ConversationMessage["role"],
          content: message.content,
          createdAt: message.createdAt,
        }));
        setMessages(sessionMessages);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load chat history");
      } finally {
        setIsHistoryLoading(false);
      }
    },
    [setMessages]
  );

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (hasInitializedSession.current) return;
    if (sessions.length === 0) return;

    setActiveSessionId((current) => current ?? sessions[0].id);
    hasInitializedSession.current = true;
  }, [sessions]);

  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }

    loadSessionMessages(activeSessionId);
  }, [activeSessionId, loadSessionMessages]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const userMessage: ChatCompletionRequestMessage = {
        role: "user",
        content: values.prompt,
      };
      const newMessages = [...messages, userMessage];
      const payloadMessages = newMessages.map((message) => ({
        role: message.role,
        content: message.content ?? "",
      }));

      const response = await axios.post("/api/conversation", {
        sessionId: activeSessionId,
        messages: payloadMessages,
      });

      setMessages((current) => [
        ...current,
        { ...userMessage, createdAt: new Date().toISOString() },
        {
          role: response.data.message.role ?? "assistant",
          content: response.data.message.content ?? "",
          createdAt: new Date().toISOString(),
        },
      ]);

      if (!activeSessionId && response.data.sessionId) {
        setActiveSessionId(response.data.sessionId);
      }

      await fetchSessions();

      form.reset();
    } catch (error: any) {
      if (error?.response?.status === 403) {
        proModal.onOpen();
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      router.refresh();
    }
  };

  const handleNewChat = () => {
    hasInitializedSession.current = true;
    setActiveSessionId(null);
    setMessages([]);
    form.reset();
  };

  return (
    <div>
      <Heading
        title="Conversation"
        sub="Our most advanced chat system yet."
        icon={MessageSquare}
        iconColor="text-violet-500"
        bgColor="bg-violet-500/10"
      />
      <div className="px-4 lg:px-8 ">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={handleNewChat}>
              New chat
            </Button>
            {sessions.map((session) => (
              <Button
                key={session.id}
                variant={session.id === activeSessionId ? "default" : "outline"}
                onClick={() => setActiveSessionId(session.id)}
              >
                {session.title || "Untitled chat"}
              </Button>
            ))}
          </div>
        </div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="
              rounded-lg
              border
              w-full
              p-4
              px-3
              md:px-6
              focus-within:shadow-sm
              grid
              grid-cols-12
              gap-2
            "
          >
            <FormField
              name="prompt"
              render={({ field }) => (
                <FormItem className="col-span-12 lg:col-span-10">
                  <FormControl className="m-0 p-0">
                    <Input
                      className="border-0 outline-none focus-visible:ring-0 focus-visible:ring-transparent"
                      disabled={isLoading}
                      placeholder="How fast does a elephant run?"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button
              className="col-span-12 lg:col-span-2 w-full"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="animate-spin" /> : "Generate"}
            </Button>
          </form>
        </Form>
      </div>
      <div className="space-y-4 mt-4 p-4">
        {isLoading && (
          <div className="p-8 w-full rounded-lg flex items-center justify-center bg-muted">
            <Loader />
          </div>
        )}
        {isHistoryLoading && (
          <div className="p-6 w-full rounded-lg flex items-center justify-center bg-muted">
            <Loader />
          </div>
        )}
        {messages.length === 0 && !isLoading && !isHistoryLoading && (
          <Empty label="No conversation started" />
        )}
        <div className="flex flex-col-reverse gap-y-4">
          {messages.map((message, index) => (
            <div
              key={message.id ?? `${message.role}-${index}`}
              className={cn(
                "p-8 w-full flex items-start gap-x-8 rounded-lg",
                message.role === "user"
                  ? "bg-white border border-black/10"
                  : "bg-muted"
              )}
            >
              {message.role === "user" ? <UserAvatar /> : <BotAvatar />}
              <ReactMarkdown
                components={{
                  pre: ({ node, ...props }) => (
                    <div className="overflow-auto w-full my-2 bg-black/10 p-2 rounded-lg">
                      <pre {...props} />
                    </div>
                  ),
                  code: ({ node, ...props }) => (
                    <code className="bg-black/10 rounded-lg p-1" {...props} />
                  ),
                }}
                className="text-sm overflow-hidden leading-7"
              >
                {message.content || ""}
              </ReactMarkdown>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConversationPage;
