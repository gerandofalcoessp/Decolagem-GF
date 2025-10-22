import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
// Cache para evitar consultas desnecessárias ao banco
let regionalsCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
/**
 * Busca todas as regionais do banco de dados
 */
async function getRegionals() {
    const now = Date.now();
    // Usar cache se ainda válido
    if (regionalsCache && (now - cacheTimestamp) < CACHE_DURATION) {
        return regionalsCache;
    }
    const { data, error } = await supabase
        .from('regionals')
        .select('*')
        .order('name');
    if (error) {
        console.error('Erro ao buscar regionais:', error);
        throw new Error('Falha ao buscar regionais do banco de dados');
    }
    regionalsCache = data;
    cacheTimestamp = now;
    return data;
}
/**
 * Converte o nome da regional do usuário para o ID da regional
 * Ex: "R. Nordeste 2" -> "623870a6-ce6a-4cdb-ae0c-923c747d2de1"
 */
export async function getUserRegionalId(userRegional) {
    try {
        const regionals = await getRegionals();
        // Remover prefixo "R. " se existir
        const cleanRegional = userRegional.replace(/^R\.\s*/, '');
        // Buscar regional correspondente
        const regional = regionals.find(r => r.name.toLowerCase() === cleanRegional.toLowerCase());
        return regional?.id || null;
    }
    catch (error) {
        console.error('Erro ao buscar ID da regional:', error);
        return null;
    }
}
/**
 * Converte o nome da regional do evento para o ID da regional
 * Ex: "norte" -> "72a4376a-9ed4-48f1-9a4f-8e02255abd04"
 */
export async function getEventRegionalId(eventRegional) {
    try {
        const regionals = await getRegionals();
        // Mapeamento de nomes de eventos para nomes de regionais
        const eventToRegionalMapping = {
            'norte': 'Norte',
            'nordeste_1': 'Nordeste 1',
            'nordeste_2': 'Nordeste 2',
            'centro_oeste': 'Centro-Oeste',
            'sao_paulo': 'São Paulo',
            'rio_de_janeiro': 'Rio de Janeiro',
            'rj': 'Rio de Janeiro',
            'mg_es': 'MG/ES',
            'sul': 'Sul',
            'nacional': 'Nacional',
            'comercial': 'Comercial'
        };
        const regionalName = eventToRegionalMapping[eventRegional.toLowerCase()];
        if (!regionalName) {
            // Se não encontrar no mapeamento, tentar busca direta
            const regional = regionals.find(r => r.name.toLowerCase() === eventRegional.toLowerCase());
            return regional?.id || null;
        }
        const regional = regionals.find(r => r.name.toLowerCase() === regionalName.toLowerCase());
        return regional?.id || null;
    }
    catch (error) {
        console.error('Erro ao buscar ID da regional do evento:', error);
        return null;
    }
}
/**
 * Verifica se um usuário pode ver eventos de uma determinada regional
 */
export async function canUserSeeRegionalEvents(userRegional, eventRegional) {
    try {
        const userRegionalId = await getUserRegionalId(userRegional);
        const eventRegionalId = await getEventRegionalId(eventRegional);
        // Se não conseguir determinar os IDs, não mostrar o evento
        if (!userRegionalId || !eventRegionalId) {
            return false;
        }
        // Usuários podem ver eventos da sua própria regional
        if (userRegionalId === eventRegionalId) {
            return true;
        }
        // Usuários "Nacional" podem ver todos os eventos
        if (userRegional.toLowerCase().includes('nacional')) {
            return true;
        }
        return false;
    }
    catch (error) {
        console.error('Erro ao verificar permissão de regional:', error);
        return false;
    }
}
/**
 * Limpa o cache das regionais (útil para testes)
 */
export function clearRegionalsCache() {
    regionalsCache = null;
    cacheTimestamp = 0;
}
