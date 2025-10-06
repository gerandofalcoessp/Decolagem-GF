import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import LoginPage from '../../pages/auth/LoginPage';
import { useAuthStore } from '../../store/authStore';

// Mock do store de autenticação
vi.mock('../../store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

// Mock do react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom') as any;
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderLoginPage = () => {
  return render(
    <BrowserRouter>
      <LoginPage />
    </BrowserRouter>
  );
};

describe('LoginPage', () => {
  const mockLogin = vi.fn();
  const mockClearError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    (useAuthStore as any).mockImplementation((selector: any) => {
      const state = {
        login: mockLogin,
        clearError: mockClearError,
        error: null,
        loading: false,
      };
      return selector(state);
    });
  });

  it('deve renderizar o formulário de login', () => {
    renderLoginPage();

    expect(screen.getByText('Entrar')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('deve mostrar informações sobre conta de teste', () => {
    renderLoginPage();

    expect(screen.getByText(/conta de teste/i)).toBeInTheDocument();
    expect(screen.getByText(/qualquer email e senha válidos/i)).toBeInTheDocument();
  });

  it('deve validar campos obrigatórios', async () => {
    renderLoginPage();

    const submitButton = screen.getByRole('button', { name: /entrar/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email é obrigatório/i)).toBeInTheDocument();
      expect(screen.getByText(/senha é obrigatória/i)).toBeInTheDocument();
    });
  });

  it('deve validar formato do email', async () => {
    renderLoginPage();

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /entrar/i });

    fireEvent.change(emailInput, { target: { value: 'email-invalido' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email deve ter um formato válido/i)).toBeInTheDocument();
    });
  });

  it('deve chamar login com dados corretos', async () => {
    renderLoginPage();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/senha/i);
    const submitButton = screen.getByRole('button', { name: /entrar/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('deve mostrar estado de loading durante login', () => {
    (useAuthStore as any).mockImplementation((selector: any) => {
      const state = {
        login: mockLogin,
        clearError: mockClearError,
        error: null,
        loading: true,
      };
      return selector(state);
    });

    renderLoginPage();

    const submitButton = screen.getByRole('button', { name: /entrando/i });
    expect(submitButton).toBeDisabled();
  });

  it('deve mostrar erro quando login falha', () => {
    const errorMessage = 'Credenciais inválidas';
    (useAuthStore as any).mockImplementation((selector: any) => {
      const state = {
        login: mockLogin,
        clearError: mockClearError,
        error: errorMessage,
        loading: false,
      };
      return selector(state);
    });

    renderLoginPage();

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('deve limpar erro ao digitar nos campos', async () => {
    const errorMessage = 'Credenciais inválidas';
    (useAuthStore as any).mockImplementation((selector: any) => {
      const state = {
        login: mockLogin,
        clearError: mockClearError,
        error: errorMessage,
        loading: false,
      };
      return selector(state);
    });

    renderLoginPage();

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    expect(mockClearError).toHaveBeenCalled();
  });
});