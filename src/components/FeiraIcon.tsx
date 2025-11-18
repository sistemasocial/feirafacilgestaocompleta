interface FeiraIconProps {
  className?: string;
  color?: string;
}

export const FeiraIcon = ({ className = "w-6 h-6", color = "currentColor" }: FeiraIconProps) => {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Telhado da barraca */}
      <path
        d="M50 15 L85 45 L15 45 Z"
        fill="white"
        stroke="none"
      />
      {/* Corpo da barraca */}
      <rect
        x="20"
        y="45"
        width="60"
        height="40"
        fill="white"
        stroke="none"
      />
      {/* Círculo decorativo */}
      <circle
        cx="50"
        cy="55"
        r="6"
        fill="#f97316"
      />
      {/* Letra F */}
      <text
        x="35"
        y="80"
        fontFamily="Arial, sans-serif"
        fontSize="24"
        fontWeight="bold"
        fill="#f97316"
      >
        F
      </text>
      {/* Letra L */}
      <text
        x="52"
        y="80"
        fontFamily="Arial, sans-serif"
        fontSize="24"
        fontWeight="bold"
        fill="#f97316"
      >
        L
      </text>
    </svg>
  );
};
