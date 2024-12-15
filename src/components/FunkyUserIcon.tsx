export default function FunkyUserIcon({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      className={`${className} hover:rotate-[10deg] transition-all duration-300`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Groovy background */}
      <circle
        cx="12"
        cy="12"
        r="11"
        className="animate-pulse"
        fill="currentColor"
        fillOpacity="0.1"
      />

      {/* Cool hairstyle */}
      <path
        d="M8 8.5C8 8.5 9 4 12 4C15 4 16 8.5 16 8.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Funky head */}
      <circle cx="12" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.5" />

      {/* Sunglasses */}
      <path
        d="M9.5 8.5L10.5 8.5M13.5 8.5L14.5 8.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Smile */}
      <path
        d="M10 10C10.5 10.5 11.3 11 12 11C12.7 11 13.5 10.5 14 10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Funky collar */}
      <path
        d="M7 14C7 14 9 15 12 15C15 15 17 14 17 14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Groovy body */}
      <path
        d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"
        stroke="currentColor"
        strokeWidth="1.5"
        className="hover:translate-x-[1px] transition-transform"
      />
    </svg>
  );
}
