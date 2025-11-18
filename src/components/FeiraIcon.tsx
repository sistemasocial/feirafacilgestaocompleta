import feiraIconClean from "@/assets/feira-icon-clean.png";

interface FeiraIconProps {
  className?: string;
  color?: string;
}

export const FeiraIcon = ({ className = "w-6 h-6" }: FeiraIconProps) => {
  return (
    <img 
      src={feiraIconClean} 
      alt="Feira" 
      className={className}
      style={{ 
        mixBlendMode: 'multiply',
        filter: 'contrast(1.2)'
      }}
    />
  );
};
