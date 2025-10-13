interface AuthLayoutProps {
  children: React.ReactNode;
}

// Importar a logo Decolagem
const logoDecolagem = new URL('../../assets/logos/Logo decolagem.png', import.meta.url).href;

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <div className="min-h-screen flex">
        {/* Lado esquerdo - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 relative overflow-hidden">
          {/* Padrão decorativo */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full">
              <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>
          </div>

          {/* Conteúdo do branding */}
          <div className="relative z-10 flex flex-col justify-center px-12 py-12 text-white">
            <div className="max-w-md">
              {/* Logo */}
              <div className="mb-8">
                <div className="w-56 h-56 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm">
                  <img 
                    src={logoDecolagem} 
                    alt="Decolagem" 
                    className="w-44 h-44 object-contain"
                    style={{
                      filter: 'brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%)',
                      WebkitFilter: 'brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%)'
                    }}
                  />
                </div>
                <h1 className="text-3xl font-bold">Programa de Superação da Pobreza</h1>
              </div>

              {/* Recursos */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-secondary-400 rounded-full"></div>
                  <span className="text-primary-100">Gestão do programa As Maras</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-secondary-400 rounded-full"></div>
                  <span className="text-primary-100">Gestão do programa Decolagem</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-secondary-400 rounded-full"></div>
                  <span className="text-primary-100">Dashboards e Relatórios</span>
                </div>
              </div>


            </div>
          </div>

          {/* Elementos decorativos */}
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-secondary-400/20 rounded-full -mr-16 -mb-16"></div>
          <div className="absolute top-1/4 right-1/4 w-8 h-8 bg-secondary-300/30 rounded-full"></div>
          <div className="absolute top-1/3 right-1/3 w-4 h-4 bg-white/20 rounded-full"></div>
        </div>

        {/* Lado direito - Formulário */}
        <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12">
          <div className="mx-auto w-full max-w-md">
            {/* Logo mobile */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-56 h-56 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4 relative">
                <img 
                  src={logoDecolagem} 
                  alt="Decolagem" 
                  className="w-44 h-44 object-contain"
                  style={{
                    filter: 'brightness(0) saturate(100%) invert(14%) sepia(93%) saturate(7151%) hue-rotate(318deg) brightness(92%) contrast(92%)'
                  }}
                />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Programa de Superação da Pobreza</h1>
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}