export default function UserIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
