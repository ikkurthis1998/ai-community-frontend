"use client";

import dynamic from "next/dynamic";
import LoadingSpinner from "@/components/LoadingSpinner";
import ClientOnly from "@/components/ClientOnly";

const ChatComponent = dynamic(() => import("@/components/ChatComponent"), {
  loading: () => <LoadingSpinner />,
});

export default function Home() {
  return (
    <ClientOnly>
      <ChatComponent />
    </ClientOnly>
  );
}
