import Image from "next/image";

export default function LlamaIcon({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/ai.webp"
      alt="AI Assistant"
      width={40}
      height={40}
      className={`w-8 h-8 object-cover ${className}`}
    />
  );
}
