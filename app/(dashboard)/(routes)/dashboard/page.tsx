"use client";

import { useRouter } from "next/navigation";

import { ToolItems } from "@/components/tool-items";

const DashboardPage = () => {
  const router = useRouter();

  return (
    <div>
      <div className="mb-8 space-y-4">
        <h2 className="text-2xl md:text-4xl font-bold text-center">
          Explore the power of AI
        </h2>
        <p className="text-center pb-10 text-muted-foreground text-sm md:text-lg">
          Aurora AI is a platform that allows you to generate images, videos, and code using the power of AI.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-10">
        <ToolItems modal={false} />
      </div>
    </div>
  );
};
export default DashboardPage;
