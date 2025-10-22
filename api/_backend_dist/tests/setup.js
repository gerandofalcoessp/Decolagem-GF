import 'dotenv/config';
// Configuração global para testes
beforeAll(async () => {
    // Configurações que devem ser executadas antes de todos os testes
    console.log('🧪 Configurando ambiente de testes...');
});
afterAll(async () => {
    // Limpeza após todos os testes
    console.log('🧹 Limpando ambiente de testes...');
});
// Mock do console para testes mais limpos
const originalConsole = console;
global.console = {
    ...originalConsole,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
};
// Configurações de timeout para testes
jest.setTimeout(30000);
