export function Logo({ size = 32, withWordmark = true }: { size?: number; withWordmark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className="relative inline-block shrink-0"
        style={{ width: size, height: size }}
        aria-hidden
      >
        <svg viewBox="0 0 64 64" width={size} height={size} className="block">
          <rect width="64" height="64" rx="12" fill="#16294A" />
          <path
            d="M32 13 L49 23 V41 L32 51 L15 41 V23 Z"
            fill="none"
            stroke="#D4A017"
            strokeWidth="2.6"
            strokeLinejoin="round"
          />
          <circle cx="32" cy="32" r="4.6" fill="#D4A017" />
          <path d="M23.5 23 L40.5 41 M40.5 23 L23.5 41" stroke="#0F5C56" strokeWidth="1.8" strokeLinecap="round" opacity="0.55" />
        </svg>
      </span>
      {withWordmark && (
        <span className="flex flex-col leading-none">
          <span className="font-serif text-lg font-semibold tracking-tight text-primary-700">
            Senconnect
          </span>
          <span className="font-mono-label text-[9px] text-ink-400 mt-0.5">
            Registre commercial · SN
          </span>
        </span>
      )}
    </span>
  );
}
