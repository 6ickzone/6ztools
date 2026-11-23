/**
 * 6z brand mark — emerald hexagon (double outline) with a bold "Z" and the
 * signature dot at the top-left of the crossbar.
 * Color comes from `currentColor`, so wrap it in `text-emerald`.
 */
export function LogoMark({ className = "size-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 36"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      <path
        d="M18 2.4 31.7 10.2v15.6L18 33.6 4.3 25.8V10.2L18 2.4Z"
        stroke="currentColor"
        strokeOpacity="0.7"
        strokeWidth="1.3"
      />
      <path
        d="M18 6.6 27.9 12.3v11.4L18 29.4l-9.9-5.7V12.3L18 6.6Z"
        fill="currentColor"
        fillOpacity="0.1"
      />
      <path
        d="M14.2 13.2h8.1l-5.4 8h5.4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="13.1" cy="13.2" r="1.1" fill="currentColor" />
    </svg>
  );
}
