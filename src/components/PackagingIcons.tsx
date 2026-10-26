type IconProps = {
  className?: string;
};

export function CupPackagingIcon({
  className = "h-5 w-5",
}: IconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 3.5 19 8.5" />
      <path d="M6 8.5h20v2.5H6z" />
      <path d="M8.2 11.5h15.6L21.7 27a2 2 0 0 1-2 1.7h-7.4a2 2 0 0 1-2-1.7L8.2 11.5Z" />
    </svg>
  );
}

export function BottlePackagingIcon({
  className = "h-5 w-5",
}: IconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="12" y="3" width="8" height="5" rx="1" />
      <path d="M12 8v2.2c0 1.1-1 1.8-2.1 2.7a6.4 6.4 0 0 0-2.4 5v7.3A3.8 3.8 0 0 0 11.3 29h9.4a3.8 3.8 0 0 0 3.8-3.8v-7.3a6.4 6.4 0 0 0-2.4-5c-1.1-.9-2.1-1.6-2.1-2.7V8" />
      <path d="M9 18h14v6H9z" />
    </svg>
  );
}

export function CoffeeMugIcon({
  className = "h-6 w-6",
}: IconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 12h15v8a5 5 0 0 1-5 5h-5a5 5 0 0 1-5-5z" />
      <path d="M23 14h1.5a3.25 3.25 0 0 1 0 6.5H23" />
      <path d="M11 8c-1-1 .5-2 0-3M16 8c-1-1 .5-2 0-3M21 8c-1-1 .5-2 0-3" />
      <path d="M6 29h20" />
    </svg>
  );
}