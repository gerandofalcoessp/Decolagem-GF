import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Building2, Edit, ArrowLeft, FileText, Download, Eye, Calendar, MapPin, Phone, Mail, User, Upload, X } from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';
import { InstituicaoService, Instituicao } from '@/services/instituicaoService';
import { Regional, Programa } from '@/types';

export default function OngDetalhesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ong, setOng] = useState<Instituicao | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showError, showSuccess } = useNotificationStore();

  useEffect(() => {
    if (id) {
      loadOng();
    }
  }, [id]);

  const loadOng = async () => {
    try {
      setLoading(true);
      const data = await InstituicaoService.getInstituicaoById(id!);
      setOng(data);
    } catch (error) {
      console.error('Erro ao carregar ONG:', error);
      showError('Erro ao carregar dados da ONG');
      navigate('/ongs');
    } finally {
      setLoading(false);
    }
  };

  const getRegionalLabel = (regional: Regional) => {
    const labels: Record<Regional, string> = {
      nacional: 'Nacional',
      sp: 'São Paulo',
      rj: 'Rio de Janeiro',
      mg: 'Minas Gerais',
      rs: 'Rio Grande do Sul',
      pr: 'Paraná',
      sc: 'Santa Catarina',
      ba: 'Bahia',
      pe: 'Pernambuco',
      ce: 'Ceará',
      go: 'Goiás',
      df: 'Distrito Federal'
    };
    return labels[regional] || regional;
  };

  const getProgramaLabel = (programa: Programa) => {
    const labels: Record<Programa, string> = {
      as_maras: 'As Maras',
      microcredito: 'Microcrédito',
      decolagem: 'Decolagem'
    };
    return labels[programa] || programa;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      ativa: 'bg-green-100 text-green-800',
      inativa: 'bg-gray-100 text-gray-800',
      evadida: 'bg-red-100 text-red-800'
    };
    const labels = {
      ativa: 'Ativa',
      inativa: 'Inativa',
      evadida: 'Evadida'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const handleViewDocument = (documentName: string) => {
    try {
      // Criar URL para visualizar o documento usando a mesma base URL da API
      const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');
      const documentUrl = `/api/instituicoes/${id}/documentos/${encodeURIComponent(documentName)}`;
      window.open(documentUrl, '_blank');
    } catch (error) {
      console.error('Erro ao visualizar documento:', error);
      alert('Erro ao visualizar documento. Tente novamente.');
    }
  };

  const handleDownloadDocument = (documentName: string) => {
    try {
      // Criar URL para download do documento usando a mesma base URL da API
      const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');
      const downloadUrl = `/api/instituicoes/${id}/documentos/${encodeURIComponent(documentName)}?download=true`;
      
      // Criar um link temporário para forçar o download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = documentName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao baixar documento:', error);
      alert('Erro ao baixar documento. Tente novamente.');
    }
  };

  const handleUploadDocument = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

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

    const filesArray = Array.from(files);
    
    // Verificar tipos de arquivo
    for (const file of filesArray) {
      if (!allowedTypes.includes(file.type)) {
        showError(`Tipo de arquivo não permitido: ${file.name}. Use PDF, JPG, PNG, TXT, DOC ou DOCX.`);
        return;
      }
      
      // Validar tamanho (10MB)
      if (file.size > 10 * 1024 * 1024) {
        showError(`Arquivo muito grande: ${file.name}. Máximo 10MB.`);
        return;
      }
    }

    try {
      setUploading(true);
      
      const formData = new FormData();
      
      // Adicionar todos os arquivos ao FormData
      filesArray.forEach(file => {
        formData.append('files', file);
      });
      
      formData.append('tipo', 'documento');

      const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');
      const response = await fetch(`${API_BASE_URL}/api/instituicoes/${id}/documentos`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao fazer upload');
      }

      const result = await response.json();
      
      if (result.errors && result.errors.length > 0) {
        // Mostrar erros específicos se houver
        const errorMessages = result.errors.map((err: any) => `${err.filename}: ${err.error}`).join('\n');
        showError(`Alguns arquivos falharam:\n${errorMessages}`);
      }
      
      if (result.documentos && result.documentos.length > 0) {
        showSuccess(`${result.documentos.length} documento(s) enviado(s) com sucesso!`);
      }
      
      // Recarregar os dados da instituição para mostrar os novos documentos
      await loadOng();
      
      // Limpar o input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      showError(error instanceof Error ? error.message : 'Erro ao fazer upload dos documentos');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-gray-500">Carregando dados da ONG...</div>
      </div>
    );
  }

  if (!ong) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-gray-500">ONG não encontrada</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/ongs')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Building2 className="h-6 w-6 text-pink-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{ong.nome}</h1>
            <p className="text-sm text-gray-600">Detalhes da Instituição</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(ong.status)}
          <Button
            onClick={() => navigate(`/ongs/editar/${id}`, { state: { ong } })}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações Principais */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dados Básicos */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações Básicas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Nome</p>
                  <p className="font-medium">{ong.nome}</p>
                </div>
              </div>
              
              {ong.cnpj && (
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">CNPJ</p>
                    <p className="font-medium">{ong.cnpj}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Localização</p>
                  <p className="font-medium">{ong.cidade}, {ong.estado}</p>
                </div>
              </div>

              {ong.telefone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Telefone</p>
                    <p className="font-medium">{ong.telefone}</p>
                  </div>
                </div>
              )}

              {ong.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">E-mail</p>
                    <p className="font-medium">{ong.email}</p>
                  </div>
                </div>
              )}

              {ong.nome_lider && (
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Líder</p>
                    <p className="font-medium">{ong.nome_lider}</p>
                  </div>
                </div>
              )}
            </div>

            {ong.endereco && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">Endereço Completo</p>
                <p className="font-medium">{ong.endereco}</p>
                {ong.cep && <p className="text-sm text-gray-500">CEP: {ong.cep}</p>}
              </div>
            )}

            {ong.observacoes && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">Observações</p>
                <p className="font-medium">{ong.observacoes}</p>
              </div>
            )}
          </Card>

          {/* Documentos */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentos
              </h2>
              <Button
                size="sm"
                onClick={handleUploadDocument}
                disabled={uploading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Enviando...' : 'Adicionar Documento'}
              </Button>
            </div>
            
            {/* Input oculto para seleção de arquivo */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.txt,.doc,.docx"
              onChange={handleFileSelect}
              multiple
              style={{ display: 'none' }}
            />
            
            {(() => {
              // Filtrar documentos válidos (não vazios e com nome)
              const documentosValidos = (ong.documentos || []).filter(documento => {
                if (typeof documento === 'string' && documento.trim()) {
                  return true;
                }
                if (typeof documento === 'object' && documento !== null) {
                  return documento.nome || documento.nomeOriginal;
                }
                return false;
              });
              
              return documentosValidos.length > 0 ? (
                <div className="space-y-3">
                  {documentosValidos.map((documento, index) => {
                    // Garantir que documento é uma string ou objeto válido
                    const documentoNome = typeof documento === 'string' ? documento : 
                      (documento?.nomeOriginal || documento?.nome);
                    const documentoTipo = typeof documento === 'object' ? documento?.tipo : 'Documento';
                    const documentoTamanho = typeof documento === 'object' ? documento?.tamanho : null;
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-gray-900">{documentoNome}</p>
                            <p className="text-sm text-gray-500">
                              {documentoTipo}
                              {documentoTamanho && ` • ${(documentoTamanho / 1024 / 1024).toFixed(2)} MB`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDocument(documentoNome)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Visualizar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadDocument(documentoNome)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhum documento anexado</p>
                  <p className="text-sm mt-1">Clique em "Adicionar Documento" para enviar arquivos</p>
                </div>
              );
            })()}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Programa e Regional */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Programa</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Programa</p>
                <p className="font-medium">{getProgramaLabel(ong.programa)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Regional</p>
                <p className="font-medium">{getRegionalLabel(ong.regional)}</p>
              </div>
            </div>
          </Card>

          {/* Datas */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Informações de Data
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Data de Cadastro</p>
                <p className="font-medium">
                  {ong.created_at ? new Date(ong.created_at).toLocaleDateString('pt-BR') : 'Não informado'}
                </p>
              </div>
              {ong.updated_at && (
                <div>
                  <p className="text-sm text-gray-600">Última Atualização</p>
                  <p className="font-medium">
                    {new Date(ong.updated_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}