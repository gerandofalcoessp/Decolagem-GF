import { Router } from 'express';
import multer from 'multer';
import { getSupabaseForToken, getUserFromToken } from '../services/supabaseClient';
import { logger } from '../utils/logger';

const router = Router();

// Configurar multer para upload de arquivos em memória
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'), false);
    }
  }
});

// Interface para os dados da instituição
interface InstituicaoData {
  nome: string;
  cnpj?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  telefone?: string;
  email?: string;
  regional: string;
  programa: string;
  observacoes?: string;
  nome_lider?: string;
  status?: 'ativa' | 'inativa' | 'evadida';
  evasao_motivo?: string;
  evasao_data?: string;
  evasao_registrado_em?: string;
  documentos?: any[];
}

// GET /instituicoes - Listar todas as instituições
router.get('/', async (req, res) => {
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

    const { data, error } = await s
      .from('instituicoes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching instituicoes', { error: error.message, userId: user.id });
      return res.status(400).json({ error: error.message });
    }

    res.json({ data });
  } catch (err) {
    logger.error('Unexpected error in GET /instituicoes', { error: err });
    res.status(500).json({ error: 'internal_server_error' });
  }
});

// GET /instituicoes/:id - Buscar instituição por ID
router.get('/:id', async (req, res) => {
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

    const { data, error } = await s
      .from('instituicoes')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) {
      logger.error('Error fetching instituicao', { error: error.message, userId: user.id, instituicaoId: req.params.id });
      return res.status(404).json({ error: 'instituicao_not_found' });
    }

    res.json({ data });
  } catch (err) {
    logger.error('Unexpected error in GET /instituicoes/:id', { error: err });
    res.status(500).json({ error: 'internal_server_error' });
  }
});

// POST /instituicoes - Criar nova instituição
router.post('/', async (req, res) => {
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

    const instituicaoData: InstituicaoData = req.body;

    // Validação básica
    if (!instituicaoData.nome) {
      return res.status(400).json({ error: 'nome_required' });
    }

    // Preparar dados para inserção
    const payload = {
      ...instituicaoData,
      status: instituicaoData.status || 'ativa',
      documentos: instituicaoData.documentos || []
    };

    const { data, error } = await s
      .from('instituicoes')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      logger.error('Error creating instituicao', { 
        error: error.message, 
        userId: user.id, 
        payload 
      });
      return res.status(400).json({ error: error.message });
    }

    logger.info('Instituicao created successfully', {
      userId: user.id,
      instituicaoId: data.id,
      instituicaoNome: data.nome
    });

    res.status(201).json({ data });
  } catch (err) {
    logger.error('Unexpected error in POST /instituicoes', { error: err });
    res.status(500).json({ error: 'internal_server_error' });
  }
});

// PUT /instituicoes/:id - Atualizar instituição
router.put('/:id', async (req, res) => {
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

    const instituicaoData: Partial<InstituicaoData> = req.body;
    const instituicaoId = req.params.id;

    // Verificar se a instituição existe
    const { data: existingInstituicao, error: checkError } = await s
      .from('instituicoes')
      .select('id')
      .eq('id', instituicaoId)
      .single();

    if (checkError || !existingInstituicao) {
      return res.status(404).json({ error: 'instituicao_not_found' });
    }

    const { data, error } = await s
      .from('instituicoes')
      .update(instituicaoData)
      .eq('id', instituicaoId)
      .select('*')
      .single();

    if (error) {
      logger.error('Error updating instituicao', { 
        error: error.message, 
        userId: user.id, 
        instituicaoId,
        updateData: instituicaoData 
      });
      return res.status(400).json({ error: error.message });
    }

    logger.info('Instituicao updated successfully', {
      userId: user.id,
      instituicaoId: data.id,
      instituicaoNome: data.nome
    });

    res.json({ data });
  } catch (err) {
    logger.error('Unexpected error in PUT /instituicoes/:id', { error: err });
    res.status(500).json({ error: 'internal_server_error' });
  }
});

// DELETE /instituicoes/:id - Deletar instituição
router.delete('/:id', async (req, res) => {
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

    const instituicaoId = req.params.id;

    // Verificar se a instituição existe antes de deletar
    const { data: existingInstituicao, error: checkError } = await s
      .from('instituicoes')
      .select('id, nome')
      .eq('id', instituicaoId)
      .single();

    if (checkError || !existingInstituicao) {
      return res.status(404).json({ error: 'instituicao_not_found' });
    }

    const { error } = await s
      .from('instituicoes')
      .delete()
      .eq('id', instituicaoId);

    if (error) {
      logger.error('Error deleting instituicao', { 
        error: error.message, 
        userId: user.id, 
        instituicaoId 
      });
      return res.status(400).json({ error: error.message });
    }

    logger.info('Instituicao deleted successfully', {
      userId: user.id,
      instituicaoId,
      instituicaoNome: existingInstituicao.nome
    });

    res.json({ message: 'instituicao_deleted_successfully' });
  } catch (err) {
    logger.error('Unexpected error in DELETE /instituicoes/:id', { error: err });
    res.status(500).json({ error: 'internal_server_error' });
  }
});

// PATCH /instituicoes/:id/evasao - Registrar evasão
router.patch('/:id/evasao', async (req, res) => {
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

    const instituicaoId = req.params.id;
    const { motivo, data: dataEvasao } = req.body;

    if (!motivo || !dataEvasao) {
      return res.status(400).json({ error: 'motivo_and_data_required' });
    }

    const { data, error } = await s
      .from('instituicoes')
      .update({
        status: 'evadida',
        evasao_motivo: motivo,
        evasao_data: dataEvasao,
        evasao_registrado_em: new Date().toISOString()
      })
      .eq('id', instituicaoId)
      .select('*')
      .single();

    if (error) {
      logger.error('Error registering evasao', { 
        error: error.message, 
        userId: user.id, 
        instituicaoId,
        motivo,
        dataEvasao
      });
      return res.status(400).json({ error: error.message });
    }

    logger.info('Evasao registered successfully', {
      userId: user.id,
      instituicaoId: data.id,
      instituicaoNome: data.nome,
      motivo,
      dataEvasao
    });

    res.json({ data });
  } catch (err) {
    logger.error('Unexpected error in PATCH /instituicoes/:id/evasao', { error: err });
    res.status(500).json({ error: 'internal_server_error' });
  }
});

// GET /instituicoes/:id/documentos/:filename - Servir documento específico
router.get('/:id/documentos/:filename', async (req, res) => {
  try {
    const { id: instituicaoId, filename } = req.params;
    const { download } = req.query;
    
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

    // Verificar se a instituição existe e se o documento está na lista
    const { data: instituicao, error: instituicaoError } = await s
      .from('instituicoes')
      .select('documentos, nome')
      .eq('id', instituicaoId)
      .single();

    if (instituicaoError || !instituicao) {
      return res.status(404).json({ error: 'instituicao_not_found' });
    }

    // Verificar se o documento existe na lista de documentos da instituição
    const documentos = instituicao.documentos || [];
    const documento = documentos.find((doc: any) => doc.nome === filename);
    
    if (!documento) {
      return res.status(404).json({ error: 'document_not_found' });
    }

    // Construir o caminho do arquivo no Storage
    const storagePath = `instituicoes/${instituicaoId}/${filename}`;
    
    // Tentar baixar o arquivo do Supabase Storage
    const { data: fileData, error: storageError } = await s.storage
      .from('documentos')
      .download(storagePath);
    
    if (storageError) {
      logger.warn('File not found in storage, serving simulated content', {
        userId: user.id,
        instituicaoId,
        filename,
        storagePath,
        error: storageError.message
      });
      
      // Se o arquivo não existe no Storage, retornar conteúdo simulado como fallback
      const ext = filename.toLowerCase().split('.').pop();
      let contentType = 'application/octet-stream';
      let content = '';
      
      if (download === 'true') {
        // Forçar download
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/octet-stream');
        
        // Simular conteúdo de arquivo para download
        const mockFileContent = Buffer.from(`Documento simulado: ${filename}\nInstituição: ${instituicao.nome}\nTipo: ${documento.tipo || 'Documento'}\nData: ${new Date().toISOString()}\n\nAviso: Este é um conteúdo simulado. O arquivo real não foi encontrado no storage.`);
        res.send(mockFileContent);
      } else {
        // Visualizar no navegador
        switch (ext) {
          case 'pdf':
            contentType = 'text/html';
            content = `
              <!DOCTYPE html>
              <html>
              <head>
                <title>Visualização de PDF - ${filename}</title>
                <style>
                  body { font-family: Arial, sans-serif; padding: 20px; }
                  .header { background: #f0f0f0; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
                  .content { line-height: 1.6; }
                  .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; margin: 10px 0; }
                </style>
              </head>
              <body>
                <div class="warning">
                  <strong>⚠️ Aviso:</strong> Este é um documento simulado. O arquivo real não foi encontrado no storage.
                </div>
                <div class="header">
                  <h2>📄 ${filename}</h2>
                  <p><strong>Instituição:</strong> ${instituicao.nome}</p>
                  <p><strong>Tipo:</strong> ${documento.tipo || 'Documento'}</p>
                </div>
                <div class="content">
                  <p>Este é um documento PDF simulado para a instituição <strong>${instituicao.nome}</strong>.</p>
                  <p>Para que os documentos funcionem corretamente, eles precisam ser enviados para o Supabase Storage.</p>
                  <p><strong>Nome do arquivo:</strong> ${filename}</p>
                  <p><strong>Caminho esperado no Storage:</strong> ${storagePath}</p>
                </div>
              </body>
              </html>
            `;
            break;
          case 'txt':
            contentType = 'text/plain';
            content = `Conteúdo simulado do arquivo de texto: ${filename}\n\nInstituição: ${instituicao.nome}\nTipo: ${documento.tipo || 'Documento'}\n\nAviso: Este é um conteúdo simulado. O arquivo real não foi encontrado no storage.`;
            break;
          default:
            contentType = 'text/plain';
            content = `Documento: ${filename}\nInstituição: ${instituicao.nome}\nTipo: ${documento.tipo || 'Documento'}\nData: ${new Date().toLocaleString('pt-BR')}\n\nEste é um documento simulado para demonstração.`;
        }
        
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('Cache-Control', 'private, max-age=3600');
        res.send(content);
      }
      
      return;
    }
    
    // Se chegou aqui, o arquivo foi encontrado no Storage
    logger.info('File found in storage', {
      userId: user.id,
      instituicaoId,
      filename,
      storagePath
    });
    
    // Determinar o tipo de conteúdo baseado na extensão do arquivo
    const ext = filename.toLowerCase().split('.').pop();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case 'pdf':
        contentType = 'application/pdf';
        break;
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'png':
        contentType = 'image/png';
        break;
      case 'txt':
        contentType = 'text/plain';
        break;
      case 'doc':
        contentType = 'application/msword';
        break;
      case 'docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
    }
    
    // Configurar headers para download ou visualização
    if (download === 'true') {
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    } else {
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    
    // Converter o Blob para Buffer e enviar
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.send(buffer);

    logger.info('Document served from storage', {
      userId: user.id,
      instituicaoId,
      filename,
      download: download === 'true',
      size: buffer.length
    });

  } catch (err) {
    logger.error('Unexpected error in GET /instituicoes/:id/documentos/:filename', { error: err });
    res.status(500).json({ error: 'internal_server_error' });
  }
});

// Endpoint para upload de documentos (múltiplos arquivos)
router.post('/:id/documentos', upload.array('files', 10), async (req, res) => {
  try {
    const { id: instituicaoId } = req.params;
    const { tipo } = req.body;
    const files = req.files as Express.Multer.File[];
    
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
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Nenhum arquivo foi enviado' });
    }
    
    logger.info('Multiple documents upload request', {
      instituicaoId,
      filesCount: files.length,
      filenames: files.map(f => f.originalname),
      userId: user.id
    });
    
    // Verificar se a instituição existe
    const { data: instituicao, error: instituicaoError } = await s
      .from('instituicoes')
      .select('*')
      .eq('id', instituicaoId)
      .single();
    
    if (instituicaoError || !instituicao) {
      return res.status(404).json({ error: 'Instituição não encontrada' });
    }
    
    // Validar todos os arquivos antes de fazer upload
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    for (const file of files) {
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({ 
          error: `Tipo de arquivo não permitido: ${file.originalname}`,
          allowedTypes: ['PDF', 'JPG', 'PNG', 'TXT', 'DOC', 'DOCX']
        });
      }
      
      if (file.size > 10 * 1024 * 1024) {
        return res.status(400).json({ 
          error: `Arquivo muito grande: ${file.originalname}. Máximo 10MB` 
        });
      }
    }
    
    // Processar uploads de todos os arquivos
    const documentos = instituicao.documentos || [];
    const novosDocumentos = [];
    const uploadErrors = [];
    
    for (const file of files) {
      try {
        // Gerar nome único para o arquivo
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const ext = file.originalname.split('.').pop();
        const filename = `${timestamp}_${randomSuffix}_${file.originalname}`;
        const storagePath = `instituicoes/${instituicaoId}/${filename}`;
        
        // Upload para o Supabase Storage
        const { data: uploadData, error: uploadError } = await s.storage
          .from('documentos')
          .upload(storagePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false
          });
        
        if (uploadError) {
          uploadErrors.push({
            filename: file.originalname,
            error: uploadError.message
          });
          continue;
        }
        
        // Criar objeto do documento
        const novoDocumento = {
          nome: filename,
          nomeOriginal: file.originalname,
          tipo: tipo || 'documento',
          mimetype: file.mimetype,
          tamanho: file.size,
          uploadedAt: new Date().toISOString(),
          storagePath: uploadData.path
        };
        
        documentos.push(novoDocumento);
        novosDocumentos.push(novoDocumento);
        
      } catch (error) {
        uploadErrors.push({
          filename: file.originalname,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }
    
    // Atualizar a lista de documentos na instituição se houver uploads bem-sucedidos
    if (novosDocumentos.length > 0) {
      const { error: updateError } = await s
        .from('instituicoes')
        .update({ documentos })
        .eq('id', instituicaoId);
      
      if (updateError) {
        // Se falhou ao atualizar o banco, tentar remover os arquivos do storage
        for (const doc of novosDocumentos) {
          await s.storage
            .from('documentos')
            .remove([doc.storagePath]);
        }
        
        logger.error('Database update error after multiple uploads', {
          instituicaoId,
          uploadedCount: novosDocumentos.length,
          error: updateError.message,
          userId: user.id
        });
        return res.status(500).json({ error: 'Erro ao salvar informações dos documentos' });
      }
    }
    
    logger.info('Multiple documents upload completed', {
      instituicaoId,
      totalFiles: files.length,
      successfulUploads: novosDocumentos.length,
      errors: uploadErrors.length,
      userId: user.id
    });
    
    // Resposta com resumo dos uploads
    const response: any = {
      message: `${novosDocumentos.length} documento(s) enviado(s) com sucesso`,
      documentos: novosDocumentos
    };
    
    if (uploadErrors.length > 0) {
      response.errors = uploadErrors;
      response.message += `, ${uploadErrors.length} erro(s)`;
    }
    
    res.status(201).json(response);
    
  } catch (err) {
    logger.error('Unexpected error in POST /instituicoes/:id/documentos (multiple)', { error: err });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /instituicoes/stats - Obter estatísticas das instituições
router.get('/stats', async (req, res) => {
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

    // Contagem total de instituições
    const { count: totalInstituicoes, error: totalError } = await s
      .from('instituicoes')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      logger.error('Error counting total instituicoes', { error: totalError.message, userId: user.id });
      return res.status(400).json({ error: totalError.message });
    }

    // Contagem por programa
    const { data: programData, error: programError } = await s
      .from('instituicoes')
      .select('programa')
      .not('programa', 'is', null);

    if (programError) {
      logger.error('Error fetching programa data', { error: programError.message, userId: user.id });
      return res.status(400).json({ error: programError.message });
    }

    // Contagem por regional (área)
    const { data: regionalData, error: regionalError } = await s
      .from('instituicoes')
      .select('regional')
      .not('regional', 'is', null);

    if (regionalError) {
      logger.error('Error fetching regional data', { error: regionalError.message, userId: user.id });
      return res.status(400).json({ error: regionalError.message });
    }

    // Processar contagens por programa
    const programCounts = programData.reduce((acc: Record<string, number>, item) => {
      const programa = item.programa;
      acc[programa] = (acc[programa] || 0) + 1;
      return acc;
    }, {});

    // Processar contagens por regional
    const regionalCounts = regionalData.reduce((acc: Record<string, number>, item) => {
      const regional = item.regional;
      acc[regional] = (acc[regional] || 0) + 1;
      return acc;
    }, {});

    // Contagens específicas para ONGs Maras e Decolagem
    const ongsMaras = programCounts['as_maras'] || 0;
    const ongsDecolagem = programCounts['decolagem'] || 0;
    const ongsMicrocredito = programCounts['microcredito'] || 0;

    const stats = {
      total: totalInstituicoes || 0,
      porPrograma: {
        as_maras: ongsMaras,
        decolagem: ongsDecolagem,
        microcredito: ongsMicrocredito
      },
      porRegional: regionalCounts,
      resumo: {
        ongsMaras,
        ongsDecolagem,
        ongsMicrocredito,
        totalPorArea: Object.keys(regionalCounts).length
      }
    };

    logger.info('Institution stats retrieved', { 
      total: stats.total, 
      ongsMaras, 
      ongsDecolagem, 
      userId: user.id 
    });

    res.json({ data: stats });
  } catch (err) {
    logger.error('Unexpected error in GET /instituicoes/stats', { error: err });
    res.status(500).json({ error: 'internal_server_error' });
  }
});

export default router;