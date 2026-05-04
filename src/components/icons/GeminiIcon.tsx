import { SVGProps } from "react";

export const GeminiIcon = ({ className, ...props }: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
    {...props}
  >
    <defs>
      <linearGradient id="gemini-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4796E3" />
        <stop offset="50%" stopColor="#9168C0" />
        <stop offset="100%" stopColor="#E64BCB" />
      </linearGradient>
    </defs>
    <path
      fill="url(#gemini-gradient)"
      d="M12 24A14.304 14.304 0 0 0 0 12 14.304 14.304 0 0 0 12 0a14.305 14.305 0 0 0 12 12 14.305 14.305 0 0 0-12 12"
    />
  </svg>
);

export default GeminiIcon;
