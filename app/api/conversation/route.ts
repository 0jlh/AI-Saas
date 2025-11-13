import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { Configuration, OpenAIApi } from "openai";

import { checkApiLimit, incrementApiLimit } from "@/lib/api-limit";
import { checkSubscription } from "@/lib/subscription";
import prismadb from "@/prismadb";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export async function GET(req: Request) {
  try {
    const { userId } = auth();

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId");

    if (sessionId) {
      const session = await prismadb.chatSession.findUnique({
        where: { id: sessionId },
        select: { id: true, userId: true },
      });

      if (!session || session.userId !== userId)
        return new NextResponse("Not Found", { status: 404 });

      const messages = await prismadb.chatMessage.findMany({
        where: { sessionId },
        orderBy: { createdAt: "asc" },
      });

      return NextResponse.json({ sessionId, messages });
    }

    const sessions = await prismadb.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("[CONVERSATION_GET_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    const body = await req.json();
    const { messages, sessionId, title } = body;

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    if (!configuration.apiKey)
      return new NextResponse("OpenAI API Key not configured.", {
        status: 500,
      });

    if (!messages || !Array.isArray(messages) || messages.length === 0)
      return new NextResponse("Messages are required", { status: 400 });

    const freeTrial = await checkApiLimit();
    const isPro = await checkSubscription();

    if (!freeTrial && !isPro)
      return new NextResponse(
        "Free trial has expired. Please upgrade to pro.",
        { status: 403 }
      );

    let session = null;

    if (sessionId) {
      session = await prismadb.chatSession.findUnique({
        where: { id: sessionId },
      });

      if (!session || session.userId !== userId)
        return new NextResponse("Not Found", { status: 404 });
    } else {
      const derivedTitle =
        title ||
        (messages[messages.length - 1]?.content ?? "New chat").slice(0, 60);

      session = await prismadb.chatSession.create({
        data: {
          userId,
          title: derivedTitle,
        },
      });
    }

    const response = await openai.createChatCompletion({
      model: "gpt-4o",
      messages,
    });

    const assistantMessage = response.data.choices[0]?.message;

    if (!assistantMessage)
      return new NextResponse("No response from model", { status: 500 });

    const latestUserMessage = messages[messages.length - 1];

    await prismadb.$transaction([
      prismadb.chatMessage.create({
        data: {
          sessionId: session.id,
          role: latestUserMessage.role,
          content: latestUserMessage.content ?? "",
        },
      }),
      prismadb.chatMessage.create({
        data: {
          sessionId: session.id,
          role: assistantMessage.role ?? "assistant",
          content: assistantMessage.content ?? "",
        },
      }),
      prismadb.chatSession.update({
        where: { id: session.id },
        data: { updatedAt: new Date() },
      }),
    ]);

    if (!isPro) await incrementApiLimit();

    return NextResponse.json({
      sessionId: session.id,
      message: assistantMessage,
    });
  } catch (error: any) {
    console.error("[CONVERSATION_POST_ERROR]", error);

    if (error.response?.status === 429) {
      return new NextResponse("Too many requests. Please slow down.", {
        status: 429,
      });
    }

    return new NextResponse("Internal Error", { status: 500 });
  }
}
