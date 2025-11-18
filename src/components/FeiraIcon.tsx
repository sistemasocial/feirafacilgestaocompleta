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
      {/* Toldo arredondado */}
      <path
        d="M3 10C3 10 3 7 12 7C21 7 21 10 21 10"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Parte de baixo do toldo */}
      <line
        x1="3"
        y1="10"
        x2="21"
        y2="10"
        stroke={color}
        strokeWidth="2"
      />
      {/* Corpo da barraca */}
      <rect
        x="4"
        y="10"
        width="16"
        height="11"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      {/* Porta */}
      <rect
        x="9"
        y="14"
        width="6"
        height="7"
        fill={color}
      />
    </svg>
  );
};
