import React from 'react';

interface AsMarasLogoProps {
  className?: string;
}

export const AsMarasLogo: React.FC<AsMarasLogoProps> = ({ className = "w-8 h-8" }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Círculo externo com texto curvado "AS MARAS" */}
      <circle
        cx="50"
        cy="50"
        r="45"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      
      {/* Texto curvado "AS MARAS" */}
      <defs>
        <path
          id="circle-path"
          d="M 50,50 m -35,0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0"
        />
      </defs>
      
      <text fontSize="12" fontWeight="bold" fill="currentColor">
        <textPath href="#circle-path" startOffset="25%">
          AS MARAS
        </textPath>
      </text>
      
      {/* Elementos decorativos centrais */}
      <g transform="translate(50,50)">
        {/* Estrela central */}
        <path
          d="M0,-15 L4,-4 L15,-4 L6,2 L10,13 L0,7 L-10,13 L-6,2 L-15,-4 L-4,-4 Z"
          fill="currentColor"
        />
        
        {/* Círculo interno */}
        <circle cx="0" cy="0" r="8" fill="none" stroke="currentColor" strokeWidth="1"/>
        
        {/* Detalhes decorativos */}
        <circle cx="0" cy="-20" r="2" fill="currentColor"/>
        <circle cx="0" cy="20" r="2" fill="currentColor"/>
        <circle cx="-20" cy="0" r="2" fill="currentColor"/>
        <circle cx="20" cy="0" r="2" fill="currentColor"/>
      </g>
    </svg>
  );
};