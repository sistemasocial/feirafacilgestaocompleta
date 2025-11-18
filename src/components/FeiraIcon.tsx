interface FeiraIconProps {
  className?: string;
  color?: string;
}

export const FeiraIcon = ({ className = "w-6 h-6", color = "currentColor" }: FeiraIconProps) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Ícone de loja/feira */}
      <path
        d="M3 9C3 8.44772 3.44772 8 4 8H20C20.5523 8 21 8.44772 21 9V10H3V9Z"
        fill={color}
      />
      <path
        d="M4 10V20C4 20.5523 4.44772 21 5 21H19C19.5523 21 20 20.5523 20 20V10"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M2 8L12 2L22 8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="10"
        y="14"
        width="4"
        height="7"
        fill={color}
      />
    </svg>
  );
};
