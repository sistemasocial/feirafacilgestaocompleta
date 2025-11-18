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
      {/* Toldo ondulado da barraca */}
      <path
        d="M2 8C2 8 4 6 6 8C8 10 10 6 12 8C14 10 16 6 18 8C20 10 22 8 22 8V11H2V8Z"
        fill={color}
      />
      {/* Corpo da barraca */}
      <rect
        x="3"
        y="11"
        width="18"
        height="10"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      {/* Porta/entrada */}
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
