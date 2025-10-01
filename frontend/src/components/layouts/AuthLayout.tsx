interface AuthLayoutProps {
  children: React.ReactNode;
}

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
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <h1 className="text-3xl font-bold">Sistema Decolagem</h1>
                <p className="text-primary-100 mt-2">
                  Gestão de Programas Sociais
                </p>
              </div>

              {/* Recursos */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-secondary-400 rounded-full"></div>
                  <span className="text-primary-100">Gestão do programa As Maras</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-secondary-400 rounded-full"></div>
                  <span className="text-primary-100">Controle de Microcrédito</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-secondary-400 rounded-full"></div>
                  <span className="text-primary-100">Dashboards e Relatórios</span>
                </div>
              </div>

              {/* Estatísticas */}
              <div className="mt-12 grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">500+</div>
                  <div className="text-sm text-primary-200">Participantes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">15</div>
                  <div className="text-sm text-primary-200">Regionais</div>
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
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Sistema Decolagem</h1>
              <p className="text-gray-600 mt-1">Gestão de Programas Sociais</p>
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}