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
      {/* Tenda/Barraca de feira */}
      <path
        d="M3 9H21V11H3V9Z"
        fill={color}
      />
      <path
        d="M4 11V20C4 20.5523 4.44772 21 5 21H19C19.5523 21 20 20.5523 20 20V11"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Toldo superior */}
      <path
        d="M2 9L12 3L22 9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Entrada da loja */}
      <rect
        x="9"
        y="13"
        width="6"
        height="8"
        stroke={color}
        strokeWidth="2"
      />
    </svg>
  );
};
