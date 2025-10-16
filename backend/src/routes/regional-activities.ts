import { Router } from 'express';
import multer from 'multer';
import { getSupabaseForToken, getUserFromToken, supabaseAdmin } from '../services/supabaseClient.js';
import { AuthService } from '../services/authService.js';
import { cacheMiddleware, invalidateCacheMiddleware } from '../middlewares/cacheMiddleware.js';
import { logger } from '../utils/logger.js';

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
    } else {
      cb(new Error('Tipo de arquivo não permitido') as any, false);
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
      return res.status(400).json({ error: 'Member data not found' });
    }

    const userRegional = memberData.regional;
    const userRole = memberData.role || user.user_metadata?.role;

    console.log('🔍 Dados do usuário:', { userRegional, userRole });

    // Função para mapear regional do usuário para formato das atividades
    const mapUserRegionalToActivityFormat = (regional: string): string => {
      if (!regional) return '';
      
      const mapping: Record<string, string> = {
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
    } else {
      console.log('👑 Super admin ou usuário nacional - buscando todas as atividades');
    }

    const { data, error } = await query;

    console.log('📊 Resultado da query:', { data: data?.length || 0, error });

    if (error) {
      console.error('Erro ao buscar atividades regionais:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    // Buscar dados de responsáveis e instituições para mapeamento
    const responsaveisIds = [...new Set(data?.map(activity => activity.responsavel_id).filter(Boolean))];
    const instituicoesIds = [...new Set(data?.map(activity => activity.instituicao_id).filter(Boolean))];

    // Buscar responsáveis
    const responsaveis: Record<string, any> = {};
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
    const instituicoes: Record<string, any> = {};
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
        if (!activity.estados) return [];
        if (Array.isArray(activity.estados)) return activity.estados;
        if (typeof activity.estados === 'string') {
          try {
            return JSON.parse(activity.estados);
          } catch {
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
        if (!activity.evidences) return [];
        if (Array.isArray(activity.evidences)) return activity.evidences;
        // Se for um objeto, tentar extrair o array
        if (typeof activity.evidences === 'object' && activity.evidences.evidences) {
          return Array.isArray(activity.evidences.evidences) ? activity.evidences.evidences : [];
        }
        return [];
      })(),
      created_at: activity.created_at
    })) || [];

    res.json(mappedData);
  } catch (err) {
    logger.error('Error fetching regional activities', {
      resource: 'regional_activities',
      error: {
        name: err instanceof Error ? err.name : 'Error',
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
      }
    });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST - Criar nova atividade regional
router.post('/', upload.array('evidencias', 2), invalidateCacheMiddleware(['regional-activities']), async (req, res) => {
  let userId: string | undefined;
  let memberId: string | undefined;
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
    const { data: member, error: memberError } = await s
      .from('members')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (memberError || !member) {
      return res.status(404).json({ error: 'member_not_found' });
    }
    memberId = member.id;

    const { 
      responsavel_id, 
      programa,
      estados,
      instituicaoId,
      quantidade,
      atividadeLabel,
      atividadeCustomLabel,
      regionaisNPS,
      ...otherData 
    } = req.body;
    const files = req.files as Express.Multer.File[];

    // Validar responsavel_id como UUID se fornecido
    if (responsavel_id) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(responsavel_id)) {
        return res.status(400).json({ error: 'Invalid responsavel_id format' });
      }
    }

    // Validar instituicaoId como UUID se fornecido
    if (instituicaoId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(instituicaoId)) {
        return res.status(400).json({ error: 'Invalid instituicaoId format' });
      }
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
          const storagePath = `regional-activities/${member.id}/${filename}`;

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

        } catch (error) {
          // Continue processing other files if one fails
        }
      }
    }

    // Construir payload para inserção
    const payload = {
      ...otherData,
      member_id: member.id,
      evidences: evidences,
      // Mapear campos específicos do formulário
      programa: programa || null,
      estados: estados ? JSON.stringify(estados) : '[]',
      instituicao_id: instituicaoId || null,
      quantidade: quantidade ? parseInt(quantidade) : null,
      atividade_label: atividadeLabel || null,
      atividade_custom_label: atividadeCustomLabel || null,
      // Para atividades NPS, armazenar as regionais selecionadas
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
          memberId: member.id,
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
        memberId: member.id,
        programa: payload.programa,
        regional: payload.regional,
        evidencesCount: evidences.length
      }
    });

    res.status(201).json({ data });
  } catch (err) {
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
      return res.status(404).json({ error: 'Atividade não encontrada' });
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
        if (!activity.estados) return [];
        if (Array.isArray(activity.estados)) return activity.estados;
        if (typeof activity.estados === 'string') {
          try {
            return JSON.parse(activity.estados);
          } catch {
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
  } catch (err) {
    console.error('Erro interno:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT - Atualizar atividade regional com arquivos
router.put('/:id/with-files', upload.array('evidencias', 2), invalidateCacheMiddleware(['regional-activities']), async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const s = getSupabaseForToken(token);
    if (!s) return res.status(500).json({ error: 'supabase_client_unavailable' });

    const id = req.params.id;
    const body = req.body || {};
    const files = req.files as Express.Multer.File[] || [];
    
    logger.info('Dados recebidos para atualização com arquivos', {
      context: {
        body: JSON.stringify(body, null, 2),
        filesCount: files.length
      }
    });
    
    // Processar evidências existentes
    let existingEvidencias: any[] = [];
    if (body.evidencias && typeof body.evidencias === 'string') {
      try {
        existingEvidencias = JSON.parse(body.evidencias);
      } catch (e) {
        logger.warn('Erro ao parsear evidências existentes:', {
          error: e instanceof Error ? { name: e.name, message: e.message, stack: e.stack } : { name: 'Error', message: String(e) },
        });
      }
    } else if (Array.isArray(body.evidencias)) {
      existingEvidencias = body.evidencias;
    }

    // Upload de novos arquivos para o Supabase Storage
    const newEvidencias: any[] = [];
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
      } catch (error) {
        console.error('Erro ao fazer upload do arquivo:', error);
        return res.status(500).json({ error: 'Erro ao fazer upload dos arquivos' });
      }
    }

    // Combinar evidências existentes com as novas
    const allEvidencias = [...existingEvidencias, ...newEvidencias];
    
    // Mapear campos do frontend para o formato do banco
    const payload: any = {};
    
    // Mapear campos básicos
    if (body.title !== undefined) payload.title = body.title;
    if (body.description !== undefined) payload.description = body.description;
    if (body.type !== undefined) payload.type = body.type;
    if (body.activity_date !== undefined) payload.activity_date = body.activity_date;
    if (body.regional !== undefined) payload.regional = body.regional;
    if (body.programa !== undefined) payload.programa = body.programa;
    if (body.quantidade !== undefined) payload.quantidade = body.quantidade;
    if (body.status !== undefined) payload.status = body.status;
    
    // Mapear responsavel_id
    if (body.responsavel_id !== undefined) {
      if (body.responsavel_id) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        payload.responsavel_id = uuidRegex.test(body.responsavel_id) ? body.responsavel_id : null;
      } else {
        payload.responsavel_id = null;
      }
    }
    
    // Mapear instituicao_id (pode vir como instituicaoId)
    if (body.instituicao_id !== undefined) {
      payload.instituicao_id = body.instituicao_id;
    } else if (body.instituicaoId !== undefined) {
      payload.instituicao_id = body.instituicaoId;
    }
    
    // Mapear estados (garantir que seja array)
    if (body.estados !== undefined) {
      if (typeof body.estados === 'string') {
        try {
          payload.estados = JSON.parse(body.estados);
        } catch {
          payload.estados = [];
        }
      } else if (Array.isArray(body.estados)) {
        payload.estados = body.estados;
      } else {
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
  } catch (err) {
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
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT - Atualizar atividade regional
router.put('/:id', invalidateCacheMiddleware(['regional-activities']), async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const s = getSupabaseForToken(token);
    if (!s) return res.status(500).json({ error: 'supabase_client_unavailable' });

    const id = req.params.id;
    const body = req.body || {};
    
    logger.info('Dados recebidos para atualização', {
      context: {
        body: JSON.stringify(body, null, 2)
      }
    });
    
    // Mapear campos do frontend para o formato do banco
    const payload: any = {};
    
    // Mapear campos básicos
    if (body.title !== undefined) payload.title = body.title;
    if (body.description !== undefined) payload.description = body.description;
    if (body.type !== undefined) payload.type = body.type;
    if (body.activity_date !== undefined) payload.activity_date = body.activity_date;
    if (body.regional !== undefined) payload.regional = body.regional;
    if (body.programa !== undefined) payload.programa = body.programa;
    if (body.quantidade !== undefined) payload.quantidade = body.quantidade;
    if (body.status !== undefined) payload.status = body.status;
    
    // Mapear responsavel_id
    if (body.responsavel_id !== undefined) {
      if (body.responsavel_id) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        payload.responsavel_id = uuidRegex.test(body.responsavel_id) ? body.responsavel_id : null;
      } else {
        payload.responsavel_id = null;
      }
    }
    
    // Mapear instituicao_id (pode vir como instituicaoId)
    if (body.instituicao_id !== undefined) {
      payload.instituicao_id = body.instituicao_id;
    } else if (body.instituicaoId !== undefined) {
      payload.instituicao_id = body.instituicaoId;
    }
    
    // Mapear estados (garantir que seja array)
    if (body.estados !== undefined) {
      if (typeof body.estados === 'string') {
        try {
          payload.estados = JSON.parse(body.estados);
        } catch {
          payload.estados = [];
        }
      } else if (Array.isArray(body.estados)) {
        payload.estados = body.estados;
      } else {
        payload.estados = [];
      }
    }
    
    // Mapear evidências
    if (body.evidences !== undefined) {
      payload.evidences = body.evidences;
    } else if (body.evidencias !== undefined) {
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
  } catch (err) {
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
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE - Deletar atividade regional
router.delete('/:id', invalidateCacheMiddleware(['regional-activities']), async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    
    if (!token) {
      return res.status(401).json({ error: 'Token de autorização não fornecido' });
    }
    
    const s = getSupabaseForToken(token);
    if (!s) {
      return res.status(500).json({ error: 'supabase_client_unavailable' });
    }

    // Verificar se o usuário está autenticado
    const user = await getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }

    console.log(`[DELETE] Tentando deletar atividade ${req.params.id} para usuário ${user.id}`);
    
    const { data, error } = await s.from('regional_activities').delete().eq('id', req.params.id).select('*');
    
    if (error) {
      console.error(`[DELETE] Erro ao deletar atividade ${req.params.id}:`, error);
      return res.status(400).json({ error: error.message });
    }
    
    console.log(`[DELETE] Atividade ${req.params.id} deletada com sucesso`);
    res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('[DELETE] Erro interno:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;