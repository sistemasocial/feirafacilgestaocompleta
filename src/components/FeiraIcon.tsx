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
      {/* Toldo/Telhado arredondado */}
      <path
        d="M3 9C3 9 3 7 12 7C21 7 21 9 21 9C21 9 21 11 12 11C3 11 3 9 3 9Z"
        fill="white"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Estrutura da barraca */}
      <rect
        x="5"
        y="10"
        width="14"
        height="9"
        rx="1"
        fill="white"
        stroke="white"
        strokeWidth="1.5"
      />
      {/* Entrada/Porta */}
      <rect
        x="9"
        y="13"
        width="6"
        height="6"
        rx="0.5"
        fill="white"
        opacity="0.6"
      />
    </svg>
  );
};
