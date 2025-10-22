import { Router } from 'express';
import multer from 'multer';
import { getSupabaseForToken, getUserFromToken, supabaseAdmin } from '../services/supabaseClient.js';
import { AuthService } from '../services/authService.js';
import { cacheMiddleware, invalidateCacheMiddleware } from '../middlewares/cacheMiddleware.js';
import { logger } from '../utils/logger.js';
import { z } from 'zod';
import { requireRole } from '../middlewares/authMiddleware.js';
const router = Router();
// Configurar multer para upload de arquivos em memória
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('file_type_not_allowed'), false);
        }
    }
});
// GET - Listar atividades regionais
router.get('/', cacheMiddleware({ ttl: 180 }), async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
        const supabase = getSupabaseForToken(token);
        if (!supabase) {
            return res.status(500).json({ error: 'supabase_client_unavailable' });
        }
        const user = await getUserFromToken(token);
        if (!user) {
            return res.status(401).json({ error: 'unauthorized' });
        }
        // Usar dados do usuário já disponíveis no middleware
        const memberData = await AuthService.getMemberData(user.id);
        if (!memberData) {
            console.error('Erro ao buscar dados do membro');
            return res.status(404).json({ error: 'member_not_found' });
        }
        const userRegional = memberData.regional;
        const userRole = memberData.role || user.user_metadata?.role;
        console.log('🔍 Dados do usuário:', { userRegional, userRole });
        // Função para mapear regional do usuário para formato das atividades
        const mapUserRegionalToActivityFormat = (regional) => {
            if (!regional)
                return '';
            const mapping = {
                'R. Norte': 'norte',
                'R. Centro-Oeste': 'centro_oeste',
                'R. Nordeste': 'nordeste',
                'R. Sudeste': 'sudeste',
                'R. Sul': 'sul',
                'R. MG/ES': 'mg_es',
                'R. Rio de Janeiro': 'rj',
                'R. São Paulo': 'sp',
                'R. Nordeste 1': 'nordeste_1',
                'R. Nordeste 2': 'nordeste_2',
                'Nacional': 'nacional',
                'Comercial': 'comercial',
                // Casos já no formato correto
                'norte': 'norte',
                'centro_oeste': 'centro_oeste',
                'nordeste': 'nordeste',
                'sudeste': 'sudeste',
                'sul': 'sul',
                'mg_es': 'mg_es',
                'rj': 'rj',
                'sp': 'sp',
                'nordeste_1': 'nordeste_1',
                'nordeste_2': 'nordeste_2',
                'nacional': 'nacional',
                'comercial': 'comercial'
            };
            return mapping[regional] || regional.toLowerCase();
        };
        const mappedUserRegional = mapUserRegionalToActivityFormat(userRegional);
        console.log('🔄 Mapeamento regional:', { original: userRegional, mapped: mappedUserRegional });
        let query = supabaseAdmin
            .from('regional_activities')
            .select('*')
            .order('created_at', { ascending: false });
        // Se o usuário é super_admin ou nacional, buscar todas as atividades
        // Caso contrário, filtrar pela regional mapeada do usuário
        if (userRole !== 'super_admin' && mappedUserRegional !== 'nacional') {
            console.log('👤 Usuário comum - filtrando por regional:', mappedUserRegional);
            query = query.eq('regional', mappedUserRegional);
        }
        else {
            console.log('👑 Super admin ou usuário nacional - buscando todas as atividades');
        }
        const { data, error } = await query;
        console.log('📊 Resultado da query:', { data: data?.length || 0, error });
        if (error) {
            console.error('Erro ao buscar atividades regionais:', error);
            return res.status(500).json({ error: 'internal_server_error' });
        }
        // Buscar dados de responsáveis e instituições para mapeamento
        const responsaveisIds = [...new Set(data?.map(activity => activity.responsavel_id).filter(Boolean))];
        const instituicoesIds = [...new Set(data?.map(activity => activity.instituicao_id).filter(Boolean))];
        // Buscar responsáveis
        const responsaveis = {};
        if (responsaveisIds.length > 0) {
            const { data: responsaveisData } = await supabaseAdmin
                .from('usuarios')
                .select('id, nome')
                .in('id', responsaveisIds);
            responsaveisData?.forEach(resp => {
                responsaveis[resp.id] = { nome: resp.nome };
            });
        }
        // Buscar instituições
        const instituicoes = {};
        if (instituicoesIds.length > 0) {
            const { data: instituicoesData } = await supabaseAdmin
                .from('instituicoes')
                .select('id, nome')
                .in('id', instituicoesIds);
            instituicoesData?.forEach(inst => {
                instituicoes[inst.id] = { nome: inst.nome };
            });
        }
        // Mapear os dados para o formato esperado pelo frontend
        const mappedData = data?.map(activity => ({
            id: activity.id,
            titulo: activity.title,
            descricao: activity.description,
            data_inicio: activity.activity_date,
            tipo: activity.type,
            regional: activity.regional,
            estados: (() => {
                // Parse do campo JSONB estados que pode vir como string
                if (!activity.estados)
                    return [];
                if (Array.isArray(activity.estados))
                    return activity.estados;
                if (typeof activity.estados === 'string') {
                    try {
                        return JSON.parse(activity.estados);
                    }
                    catch {
                        return [];
                    }
                }
                return [];
            })(),
            responsavel_id: activity.responsavel_id,
            responsavel: responsaveis[activity.responsavel_id] || null,
            instituicao_id: activity.instituicao_id,
            instituicao: instituicoes[activity.instituicao_id] || null,
            participantes_confirmados: 0,
            quantidade: activity.quantidade,
            status: activity.status || 'ativo',
            evidencias: (() => {
                // Garantir que evidencias seja sempre um array
                if (!activity.evidences)
                    return [];
                if (Array.isArray(activity.evidences))
                    return activity.evidences;
                // Se for um objeto, tentar extrair o array
                if (typeof activity.evidences === 'object' && activity.evidences.evidences) {
                    return Array.isArray(activity.evidences.evidences) ? activity.evidences.evidences : [];
                }
                return [];
            })(),
            created_at: activity.created_at
        })) || [];
        res.json(mappedData);
    }
    catch (err) {
        logger.error('Error fetching regional activities', {
            resource: 'regional_activities',
            error: {
                name: err instanceof Error ? err.name : 'Error',
                message: err instanceof Error ? err.message : 'Unknown error',
                stack: err instanceof Error ? err.stack : undefined,
            }
        });
        res.status(500).json({ error: 'internal_server_error' });
    }
});
// POST - Criar nova atividade regional
router.post('/', requireRole(['super_admin', 'equipe_interna', 'user']), upload.array('evidencias', 2), invalidateCacheMiddleware(['regional-activities']), async (req, res) => {
    let userId;
    let memberId;
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
        const s = getSupabaseForToken(token);
        if (!s) {
            return res.status(500).json({ error: 'supabase_client_unavailable' });
        }
        const user = await getUserFromToken(token);
        if (!user) {
            return res.status(401).json({ error: 'unauthorized' });
        }
        userId = user.id;
        // Buscar member_id do usuário
        const { data: memberOriginal, error: memberError } = await s
            .from('members')
            .select('id')
            .eq('auth_user_id', user.id)
            .single();
        let member = memberOriginal;
        if (memberError || !member) {
            // Fallback: tentar buscar/criar o member via supabaseAdmin
            if (!supabaseAdmin) {
                return res.status(404).json({ error: 'member_not_found' });
            }
            // Verificar se já existe via admin (bypass RLS)
            const { data: adminMember } = await supabaseAdmin
                .from('members')
                .select('id')
                .eq('auth_user_id', user.id)
                .single();
            if (adminMember) {
                member = adminMember;
            }
            else {
                // Coletar dados do usuário para criar o member
                let nome = user.user_metadata?.nome || null;
                let email = user.email || null;
                let regional = user.user_metadata?.regional || null;
                if (!nome || !regional) {
                    // Tentar obter da tabela usuarios
                    const { data: usuario } = await supabaseAdmin
                        .from('usuarios')
                        .select('nome, email, regional')
                        .eq('id', user.id)
                        .single();
                    nome = nome || usuario?.nome || (email ? email.split('@')[0] : 'Usuário');
                    email = email || usuario?.email || user.email;
                    regional = regional || usuario?.regional || null;
                }
                const { data: created, error: createErr } = await supabaseAdmin
                    .from('members')
                    .insert({
                    auth_user_id: user.id,
                    name: nome,
                    email,
                    regional,
                })
                    .select('id')
                    .single();
                if (createErr || !created) {
                    return res.status(500).json({ error: 'member_creation_failed' });
                }
                member = created;
            }
        }
        memberId = member.id;
        // Validação de payload com Zod (aceitando os campos enviados pelo frontend)
        const createSchema = z.object({
            title: z.string().min(1),
            description: z.string().optional(),
            type: z.string().min(1),
            activity_date: z.string().min(1),
            regional: z.string().min(1),
            status: z.string().optional(),
            responsavel_id: z.union([z.string().uuid(), z.string().length(0)]).optional().nullable(),
            programa: z.string().optional(),
            estados: z.union([z.array(z.string()), z.string()]).optional(),
            instituicaoId: z.union([z.string().uuid(), z.string().length(0)]).optional().nullable(),
            instituicao_id: z.union([z.string().uuid(), z.string().length(0)]).optional().nullable(),
            quantidade: z.coerce.number().int().nonnegative().optional(),
            atividadeLabel: z.string().optional(),
            atividadeCustomLabel: z.string().optional(),
            regionaisNPS: z.any().optional(),
        }).strict();
        const parsedBody = createSchema.safeParse(req.body);
        if (!parsedBody.success) {
            return res.status(400).json({ error: 'invalid_payload', details: parsedBody.error.flatten() });
        }
        const { title, description, type, activity_date, regional, status, responsavel_id, programa, estados, instituicaoId, quantidade, atividadeLabel, atividadeCustomLabel, regionaisNPS, ...otherData } = parsedBody.data;
        const files = req.files;
        // Normalizar estados (aceitar string JSON ou array)
        let estadosArray = [];
        if (typeof estados === 'string') {
            try {
                estadosArray = JSON.parse(estados);
            }
            catch {
                estadosArray = [];
            }
        }
        else if (Array.isArray(estados)) {
            estadosArray = estados;
        }
        // Processar uploads de evidências se houver arquivos
        const evidences = [];
        if (files && files.length > 0) {
            for (const file of files) {
                try {
                    // Gerar nome único para o arquivo
                    const timestamp = Date.now();
                    const randomSuffix = Math.random().toString(36).substring(2, 8);
                    const ext = file.originalname.split('.').pop();
                    const filename = `${timestamp}_${randomSuffix}.${ext}`;
                    const storagePath = `regional-activities/${memberId}/${filename}`;
                    // Upload para o Supabase Storage
                    const { data: uploadData, error: uploadError } = await s.storage
                        .from('documentos')
                        .upload(storagePath, file.buffer, {
                        contentType: file.mimetype,
                        upsert: false
                    });
                    if (uploadError) {
                        continue;
                    }
                    // Obter URL pública do arquivo
                    const { data: publicUrlData } = s.storage
                        .from('documentos')
                        .getPublicUrl(uploadData.path);
                    evidences.push({
                        filename: file.originalname,
                        storagePath: uploadData.path,
                        url: publicUrlData.publicUrl,
                        mimetype: file.mimetype,
                        size: file.size,
                        uploadedAt: new Date().toISOString()
                    });
                }
                catch (error) {
                    // Continue processing other files if one fails
                }
            }
        }
        // Construir payload para inserção
        const payload = {
            // Campos básicos mapeados do frontend
            title,
            description: description || '',
            type,
            activity_date,
            regional,
            // Campos adicionais e normalizados
            member_id: memberId,
            evidences: evidences,
            programa: programa || null,
            estados: JSON.stringify(estadosArray || []),
            instituicao_id: instituicaoId || null,
            quantidade: typeof quantidade === 'number' ? quantidade : (quantidade ? parseInt(String(quantidade)) : null),
            atividade_label: atividadeLabel || null,
            atividade_custom_label: atividadeCustomLabel || null,
            regionais_nps: regionaisNPS ? JSON.stringify(regionaisNPS) : null,
            ...(responsavel_id && { responsavel_id })
        };
        const { data, error } = await s
            .from('regional_activities')
            .insert(payload)
            .select()
            .single();
        if (error) {
            // Se falhou ao salvar no banco, remover arquivos do storage
            for (const evidence of evidences) {
                await s.storage
                    .from('documentos')
                    .remove([evidence.storagePath]);
            }
            logger.logDatabaseError('insert', 'regional_activities', new Error(error.message), user.id);
            logger.error('Failed to create regional activity', {
                userId: user.id,
                resource: 'regional_activities',
                context: {
                    memberId: memberId,
                    payloadSummary: { ...payload, evidences: evidences.length }
                }
            });
            return res.status(400).json({ error: error.message });
        }
        logger.info('Regional activity created successfully', {
            userId: user.id,
            resource: 'regional_activities',
            context: {
                activityId: data.id,
                memberId: memberId,
                programa: payload.programa,
                regional: payload.regional,
                evidencesCount: evidences.length
            }
        });
        res.status(201).json({ data });
    }
    catch (err) {
        logger.error('Error creating regional activity', {
            userId: userId,
            resource: 'regional_activities',
            error: {
                name: err instanceof Error ? err.name : 'Error',
                message: err instanceof Error ? err.message : 'Unknown error',
                stack: err instanceof Error ? err.stack : undefined,
            },
            context: {
                memberId: memberId
            }
        });
        res.status(500).json({ error: 'internal_server_error' });
    }
});
// GET - Buscar atividade regional por ID
router.get('/:id', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
        const supabase = getSupabaseForToken(token);
        if (!supabase) {
            return res.status(500).json({ error: 'supabase_client_unavailable' });
        }
        const user = await getUserFromToken(token);
        if (!user) {
            return res.status(401).json({ error: 'unauthorized' });
        }
        const id = req.params.id;
        // Buscar a atividade específica
        const { data: activity, error } = await supabaseAdmin
            .from('regional_activities')
            .select('*')
            .eq('id', id)
            .single();
        if (error || !activity) {
            console.error('Erro ao buscar atividade:', error);
            return res.status(404).json({ error: 'activity_not_found' });
        }
        // Buscar dados do responsável se existir
        let responsavel = null;
        if (activity.responsavel_id) {
            const { data: responsavelData } = await supabaseAdmin
                .from('usuarios')
                .select('id, nome')
                .eq('id', activity.responsavel_id)
                .single();
            if (responsavelData) {
                responsavel = { id: responsavelData.id, nome: responsavelData.nome };
            }
        }
        // Buscar dados da instituição se existir
        let instituicao = null;
        if (activity.instituicao_id) {
            const { data: instituicaoData } = await supabaseAdmin
                .from('instituicoes')
                .select('id, nome')
                .eq('id', activity.instituicao_id)
                .single();
            if (instituicaoData) {
                instituicao = { id: instituicaoData.id, nome: instituicaoData.nome };
            }
        }
        // Mapear os dados para o formato esperado pelo frontend
        const mappedActivity = {
            id: activity.id,
            titulo: activity.title,
            descricao: activity.description,
            data_inicio: activity.activity_date,
            tipo: activity.type,
            regional: activity.regional,
            programa: activity.programa,
            estados: (() => {
                // Parse do campo JSONB estados que pode vir como string
                if (!activity.estados)
                    return [];
                if (Array.isArray(activity.estados))
                    return activity.estados;
                if (typeof activity.estados === 'string') {
                    try {
                        return JSON.parse(activity.estados);
                    }
                    catch {
                        return [];
                    }
                }
                return [];
            })(),
            responsavel_id: activity.responsavel_id,
            responsavel: responsavel,
            instituicao_id: activity.instituicao_id,
            instituicao: instituicao,
            quantidade: activity.quantidade,
            status: activity.status || 'ativo',
            evidencias: activity.evidences || [],
            created_at: activity.created_at
        };
        res.json(mappedActivity);
    }
    catch (err) {
        console.error('Erro interno:', err);
        res.status(500).json({ error: 'internal_server_error' });
    }
});
// GET - Buscar atividade regional por ID com arquivos (para edição)
router.get('/:id/with-files', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
        const supabase = getSupabaseForToken(token);
        if (!supabase) {
            return res.status(500).json({ error: 'supabase_client_unavailable' });
        }
        const user = await getUserFromToken(token);
        if (!user) {
            return res.status(401).json({ error: 'unauthorized', details: 'token_missing' });
        }
        const id = req.params.id;
        // Buscar a atividade específica
        const { data: activity, error } = await supabaseAdmin
            .from('regional_activities')
            .select('*')
            .eq('id', id)
            .single();
        if (error || !activity) {
            console.error('Erro ao buscar atividade:', error);
            return res.status(404).json({ error: 'activity_not_found' });
        }
        // Buscar dados do responsável se existir
        let responsavel = null;
        if (activity.responsavel_id) {
            const { data: responsavelData } = await supabaseAdmin
                .from('usuarios')
                .select('id, nome')
                .eq('id', activity.responsavel_id)
                .single();
            if (responsavelData) {
                responsavel = { id: responsavelData.id, nome: responsavelData.nome };
            }
        }
        // Buscar dados da instituição se existir
        let instituicao = null;
        if (activity.instituicao_id) {
            const { data: instituicaoData } = await supabaseAdmin
                .from('instituicoes')
                .select('id, nome')
                .eq('id', activity.instituicao_id)
                .single();
            if (instituicaoData) {
                instituicao = { id: instituicaoData.id, nome: instituicaoData.nome };
            }
        }
        // Buscar arquivos/evidências da atividade
        const { data: files, error: filesError } = await supabaseAdmin
            .from('regional_activity_files')
            .select('*')
            .eq('activity_id', id);
        if (filesError) {
            console.warn('Erro ao buscar arquivos da atividade:', filesError);
        }
        // Mapear os dados para o formato esperado pelo frontend
        const mappedActivity = {
            id: activity.id,
            titulo: activity.title,
            descricao: activity.description,
            data_inicio: activity.activity_date,
            tipo: activity.type,
            regional: activity.regional,
            programa: activity.programa,
            estados: (() => {
                // Parse do campo JSONB estados que pode vir como string
                if (!activity.estados)
                    return [];
                if (Array.isArray(activity.estados))
                    return activity.estados;
                if (typeof activity.estados === 'string') {
                    try {
                        return JSON.parse(activity.estados);
                    }
                    catch {
                        return [];
                    }
                }
                return [];
            })(),
            responsavel_id: activity.responsavel_id,
            responsavel: responsavel,
            instituicao_id: activity.instituicao_id,
            instituicao: instituicao,
            quantidade: activity.quantidade,
            status: activity.status || 'ativo',
            evidencias: activity.evidences || [],
            files: files || [],
            created_at: activity.created_at
        };
        res.json(mappedActivity);
    }
    catch (err) {
        console.error('Erro interno:', err);
        res.status(500).json({ error: 'internal_server_error' });
    }
});
// PUT - Atualizar atividade regional com arquivos
router.put('/:id/with-files', requireRole(['super_admin', 'equipe_interna', 'user']), upload.array('evidencias', 10), invalidateCacheMiddleware(['regional-activities']), async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
        const s = getSupabaseForToken(token);
        if (!s)
            return res.status(500).json({ error: 'supabase_client_unavailable' });
        // Validar id do parâmetro com Zod
        const idParamsSchema = z.object({ id: z.string().uuid() });
        const idParse = idParamsSchema.safeParse(req.params);
        if (!idParse.success) {
            return res.status(400).json({ error: 'invalid_id', details: idParse.error.flatten() });
        }
        // Validar payload básico com Zod (aceitando strings para arrays JSON)
        const updateWithFilesSchema = z.object({
            responsavel_id: z.string().uuid().optional().nullable(),
            instituicaoId: z.union([z.string().uuid(), z.string().length(0)]).optional().nullable(),
            instituicao_id: z.union([z.string().uuid(), z.string().length(0)]).optional().nullable(),
            quantidade: z.coerce.number().int().nonnegative().optional(),
            estados: z.union([z.array(z.string()), z.string()]).optional(),
            evidencias: z.union([z.array(z.any()), z.string()]).optional(),
            title: z.string().optional(),
            description: z.string().optional(),
            type: z.string().optional(),
            activity_date: z.string().optional(),
            regional: z.string().optional(),
            programa: z.string().optional(),
            status: z.string().optional(),
        }).strict();
        const bodyParse = updateWithFilesSchema.safeParse(req.body || {});
        if (!bodyParse.success) {
            return res.status(400).json({ error: 'invalid_payload', details: bodyParse.error.flatten() });
        }
        const id = idParse.data.id;
        const body = bodyParse.data;
        const files = req.files || [];
        logger.info('Dados recebidos para atualização com arquivos', {
            context: {
                body: JSON.stringify(body, null, 2),
                filesCount: files.length
            }
        });
        // Processar evidências existentes
        let existingEvidencias = [];
        if (body.evidencias && typeof body.evidencias === 'string') {
            try {
                existingEvidencias = JSON.parse(body.evidencias);
            }
            catch (e) {
                logger.warn('Erro ao parsear evidências existentes:', {
                    error: e instanceof Error ? { name: e.name, message: e.message, stack: e.stack } : { name: 'Error', message: String(e) },
                });
            }
        }
        else if (Array.isArray(body.evidencias)) {
            existingEvidencias = body.evidencias;
        }
        // Upload de novos arquivos para o Supabase Storage
        const newEvidencias = [];
        for (const file of files) {
            try {
                const fileName = `${Date.now()}-${file.originalname}`;
                const filePath = `regional-activities/${fileName}`;
                const { data: uploadData, error: uploadError } = await s.storage
                    .from('documentos')
                    .upload(filePath, file.buffer, {
                    contentType: file.mimetype,
                    upsert: false
                });
                if (uploadError) {
                    console.error('Erro no upload:', uploadError);
                    throw uploadError;
                }
                // Obter URL pública
                const { data: { publicUrl } } = s.storage
                    .from('documentos')
                    .getPublicUrl(filePath);
                newEvidencias.push({
                    filename: fileName,
                    storagePath: filePath,
                    url: publicUrl,
                    mimetype: file.mimetype,
                    size: file.size,
                    uploadedAt: new Date().toISOString()
                });
            }
            catch (error) {
                console.error('Erro ao fazer upload do arquivo:', error);
                return res.status(500).json({ error: 'upload_files_failed' });
            }
        }
        // Combinar evidências existentes com as novas
        const allEvidencias = [...existingEvidencias, ...newEvidencias];
        // Mapear campos do frontend para o formato do banco
        const payload = {};
        // Mapear campos básicos
        if (body.title !== undefined)
            payload.title = body.title;
        if (body.description !== undefined)
            payload.description = body.description;
        if (body.type !== undefined)
            payload.type = body.type;
        if (body.activity_date !== undefined)
            payload.activity_date = body.activity_date;
        if (body.regional !== undefined)
            payload.regional = body.regional;
        if (body.programa !== undefined)
            payload.programa = body.programa;
        if (body.quantidade !== undefined)
            payload.quantidade = body.quantidade;
        if (body.status !== undefined)
            payload.status = body.status;
        // Mapear responsavel_id
        if (body.responsavel_id !== undefined) {
            if (body.responsavel_id) {
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
                payload.responsavel_id = uuidRegex.test(body.responsavel_id) ? body.responsavel_id : null;
            }
            else {
                payload.responsavel_id = null;
            }
        }
        // Mapear instituicao_id (pode vir como instituicaoId)
        if (body.instituicao_id !== undefined) {
            const val = body.instituicao_id;
            if (!val || val === '') {
                payload.instituicao_id = null;
            }
            else {
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
                payload.instituicao_id = uuidRegex.test(val) ? val : null;
            }
        }
        else if (body.instituicaoId !== undefined) {
            const val = body.instituicaoId;
            if (!val || val === '') {
                payload.instituicao_id = null;
            }
            else {
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
                payload.instituicao_id = uuidRegex.test(val) ? val : null;
            }
        }
        // Mapear estados (garantir que seja array)
        if (body.estados !== undefined) {
            if (typeof body.estados === 'string') {
                try {
                    payload.estados = JSON.parse(body.estados);
                }
                catch {
                    payload.estados = [];
                }
            }
            else if (Array.isArray(body.estados)) {
                payload.estados = body.estados;
            }
            else {
                payload.estados = [];
            }
        }
        // Adicionar evidências combinadas
        payload.evidences = allEvidencias;
        // Remover campos que não devem ser atualizados
        delete payload.member_id;
        delete payload.id;
        delete payload.created_at;
        console.log('💾 Payload final para atualização com arquivos:', JSON.stringify(payload, null, 2));
        const { data, error } = await s.from('regional_activities').update(payload).eq('id', id).select('*').single();
        if (error) {
            console.error('❌ Erro ao atualizar atividade:', error);
            return res.status(400).json({ error: error.message });
        }
        logger.info('Atividade atualizada com sucesso (com arquivos)', {
            resource: 'regional_activities',
            context: {
                activityId: id,
                data
            }
        });
        res.json({ data });
    }
    catch (err) {
        logger.error('Erro interno ao atualizar atividade com arquivos', {
            resource: 'regional_activities',
            error: {
                name: err instanceof Error ? err.name : 'Error',
                message: err instanceof Error ? err.message : 'Unknown error',
                stack: err instanceof Error ? err.stack : undefined,
            },
            context: {
                activityId: req.params.id
            }
        });
        res.status(500).json({ error: 'internal_server_error' });
    }
});
// PUT - Atualizar atividade regional
router.put('/:id', requireRole(['super_admin', 'equipe_interna', 'user']), invalidateCacheMiddleware(['regional-activities']), async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
        const s = getSupabaseForToken(token);
        if (!s)
            return res.status(500).json({ error: 'supabase_client_unavailable' });
        const id = req.params.id;
        const body = req.body || {};
        logger.info('Dados recebidos para atualização', {
            context: {
                body: JSON.stringify(body, null, 2)
            }
        });
        // Mapear campos do frontend para o formato do banco
        const payload = {};
        // Mapear campos básicos
        if (body.title !== undefined)
            payload.title = body.title;
        if (body.description !== undefined)
            payload.description = body.description;
        if (body.type !== undefined)
            payload.type = body.type;
        if (body.activity_date !== undefined)
            payload.activity_date = body.activity_date;
        if (body.regional !== undefined)
            payload.regional = body.regional;
        if (body.programa !== undefined)
            payload.programa = body.programa;
        if (body.quantidade !== undefined)
            payload.quantidade = body.quantidade;
        if (body.status !== undefined)
            payload.status = body.status;
        // Mapear responsavel_id
        if (body.responsavel_id !== undefined) {
            if (body.responsavel_id) {
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
                payload.responsavel_id = uuidRegex.test(body.responsavel_id) ? body.responsavel_id : null;
            }
            else {
                payload.responsavel_id = null;
            }
        }
        // Mapear instituicao_id (pode vir como instituicaoId)
        if (body.instituicao_id !== undefined) {
            const val = body.instituicao_id;
            if (!val || val === '') {
                payload.instituicao_id = null;
            }
            else {
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
                payload.instituicao_id = uuidRegex.test(val) ? val : null;
            }
        }
        else if (body.instituicaoId !== undefined) {
            const val = body.instituicaoId;
            if (!val || val === '') {
                payload.instituicao_id = null;
            }
            else {
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
                payload.instituicao_id = uuidRegex.test(val) ? val : null;
            }
        }
        // Mapear estados (garantir que seja array)
        if (body.estados !== undefined) {
            if (typeof body.estados === 'string') {
                try {
                    payload.estados = JSON.parse(body.estados);
                }
                catch {
                    payload.estados = [];
                }
            }
            else if (Array.isArray(body.estados)) {
                payload.estados = body.estados;
            }
            else {
                payload.estados = [];
            }
        }
        // Mapear evidências
        if (body.evidences !== undefined) {
            payload.evidences = body.evidences;
        }
        else if (body.evidencias !== undefined) {
            payload.evidences = body.evidencias;
        }
        // Remover campos que não devem ser atualizados
        delete payload.member_id;
        delete payload.id;
        delete payload.created_at;
        logger.info('Payload final para atualização', {
            context: {
                payload: JSON.stringify(payload, null, 2),
                activityId: id
            }
        });
        const { data, error } = await s.from('regional_activities').update(payload).eq('id', id).select('*').single();
        if (error) {
            logger.logDatabaseError('update', 'regional_activities', new Error(error.message));
            logger.error('Erro ao atualizar atividade', {
                resource: 'regional_activities',
                context: { activityId: id, payload }
            });
            return res.status(400).json({ error: error.message });
        }
        logger.info('Atividade atualizada com sucesso', {
            resource: 'regional_activities',
            context: {
                activityId: id,
                data: data
            }
        });
        res.json({ data });
    }
    catch (err) {
        logger.error('Erro interno ao atualizar atividade', {
            resource: 'regional_activities',
            error: {
                name: err instanceof Error ? err.name : 'Error',
                message: err instanceof Error ? err.message : 'Unknown error',
                stack: err instanceof Error ? err.stack : undefined,
            },
            context: {
                activityId: req.params.id
            }
        });
        res.status(500).json({ error: 'internal_server_error' });
    }
});
// DELETE - Deletar atividade regional
router.delete('/:id', requireRole(['super_admin', 'equipe_interna', 'user']), invalidateCacheMiddleware(['regional-activities']), async (req, res) => {
    try {
        // Validar id do parâmetro com Zod
        const idParamsSchema = z.object({ id: z.string().uuid() });
        const idParse = idParamsSchema.safeParse(req.params);
        if (!idParse.success) {
            return res.status(400).json({ error: 'invalid_id', details: idParse.error.flatten() });
        }
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
        if (!token) {
            return res.status(401).json({ error: 'unauthorized' });
        }
        const s = getSupabaseForToken(token);
        if (!s) {
            return res.status(500).json({ error: 'supabase_client_unavailable' });
        }
        // Verificar se o usuário está autenticado
        const user = await getUserFromToken(token);
        if (!user) {
            return res.status(401).json({ error: 'unauthorized' });
        }
        console.log(`[DELETE] Tentando deletar atividade ${req.params.id} para usuário ${user.id}`);
        const { data, error } = await s.from('regional_activities').delete().eq('id', req.params.id).select('*');
        if (error) {
            console.error(`[DELETE] Erro ao deletar atividade ${req.params.id}:`, error);
            return res.status(400).json({ error: error.message });
        }
        console.log(`[DELETE] Atividade ${req.params.id} deletada com sucesso`);
        res.json({ success: true, data: data || [] });
    }
    catch (error) {
        console.error('[DELETE] Erro interno:', error);
        res.status(500).json({ error: 'internal_server_error' });
    }
});
export default router;
