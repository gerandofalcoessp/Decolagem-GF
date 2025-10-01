import React from 'react';

const AsMarasLogo: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Logo As Maras - Baseado na imagem fornecida */}
      <circle cx="50" cy="50" r="45" fill="white" stroke="currentColor" strokeWidth="2"/>
      
      {/* Texto "AS MARAS" estilizado */}
      <text x="50" y="35" textAnchor="middle" fontSize="12" fontWeight="bold" fill="currentColor">
        AS MARAS
      </text>
      
      {/* Elementos decorativos - olhos estilizados */}
      <path d="M35 45 Q40 40 45 45" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M55 45 Q60 40 65 45" stroke="currentColor" strokeWidth="2" fill="none"/>
      
      {/* Texto inferior */}
      <text x="50" y="70" textAnchor="middle" fontSize="8" fill="currentColor">
        GERANDO FALCÕES
      </text>
    </svg>
  );
};

export default AsMarasLogo;