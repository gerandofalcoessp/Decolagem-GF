import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

import { useAuthActions } from '@/store/authStore';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import logoDecolagemPng from '@/assets/logos/Logo decolagem.png';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
    .min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthActions();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    
    try {
      await login(data.email, data.password);
      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="space-y-6" aria-labelledby="login-title">
      {/* Cabeçalho */}
      <div className="text-center">
        {/* Logo Decolagem */}
        <div className="mb-6 flex justify-center">
          <img 
            src={logoDecolagemPng} 
            alt="Decolagem" 
            className="w-56 h-56 object-contain"
            style={{
              filter: 'brightness(0) saturate(100%) invert(18%) sepia(89%) saturate(2476%) hue-rotate(315deg) brightness(95%) contrast(95%)',
              WebkitFilter: 'brightness(0) saturate(100%) invert(18%) sepia(89%) saturate(2476%) hue-rotate(315deg) brightness(95%) contrast(95%)'
            }}
          />
        </div>
        
        <h2 id="login-title" className="text-3xl font-bold text-gray-900">
          Programa de Superação da Pobreza
        </h2>
        <p className="mt-2 text-gray-600">
          Faça login para acessar o sistema
        </p>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" aria-describedby="form-status" noValidate>
        {/* Região de status acessível */}
        <div id="form-status" aria-live="polite" className="sr-only">
          {isLoading ? 'Processando login…' : (errors.email || errors.password) ? 'Há erros no formulário.' : 'Pronto para enviar.'}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <div className="relative">
            <input
              {...register('email')}
              type="email"
              id="email"
              autoComplete="email"
              autoFocus
              spellCheck="false"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              className={`input ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="seu@email.com"
              disabled={isLoading}
            />
          </div>
          {errors.email && (
            <p id="email-error" role="alert" className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Senha */}
        <div>
          <label htmlFor="password" className="label">
            Senha
          </label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              className={`input pr-10 ${errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="Sua senha"
              disabled={isLoading}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              aria-pressed={showPassword}
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" role="alert" className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        {/* Botão de login */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-primary flex items-center justify-center py-2 px-4 text-sm"
          aria-busy={isLoading}
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" color="white" className="mr-2" />
              <span className="sr-only">Carregando</span>
              Entrando...
            </>
          ) : (
            'Entrar'
          )}
        </button>
      </form>



      {/* Links adicionais */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Problemas para acessar?{' '}
          <button 
            type="button"
            className="font-medium text-primary-600 hover:text-primary-500"
            onClick={() => toast('Fale com seu Líder')}
          >
            Fale com seu Líder
          </button>
        </p>
      </div>
    </main>
  );
}