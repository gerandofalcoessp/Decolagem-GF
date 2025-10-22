import { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
// import { Input } from '@/components/ui/Input';
// import { Select } from '@/components/ui/Select';
import { ONGForm, Programa, ProgramaArray, Regional } from '@/types';
import { Building2, Save } from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';
import { InstituicaoService, CreateInstituicaoData, UpdateInstituicaoData } from '@/services/instituicaoService';

export default function OngCadastroPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEditing = !!id;
  const ongToEdit = location.state?.ong;
  const [saving, setSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { showSuccess, showError } = useNotificationStore();

  // Extrair regional inicial da URL ou do objeto de edição
  const initialRegional = useMemo(() => {
    if (isEditing && ongToEdit) {
      return ongToEdit.regional;
    }
    const params = new URLSearchParams(location.search);
    const regional = params.get('regional');
    return regional as Regional || 'nacional';
  }, [location.search, isEditing, ongToEdit]);

  const [form, setForm] = useState<ONGForm>({
    nome: '',
    cnpj: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    telefone: '',
    email: '',
    regional: initialRegional,
    programas: [], // Nova propriedade para múltiplos programas
    status: 'ativa', // Status padrão
    observacoes: '',
    nome_lider: '',
    documentos: []
  });

  // Carregar dados da ONG para edição
  useEffect(() => {
    if (isEditing && ongToEdit) {
      setForm(ongToEdit);
    } else if (isEditing && id) {
      // Carregar dados da API se não temos os dados no state
      const loadInstituicao = async () => {
        try {
          const instituicao = await InstituicaoService.getInstituicaoById(id);
          setForm({
          nome: instituicao.nome,
          cnpj: instituicao.cnpj,
          endereco: instituicao.endereco,
          cidade: instituicao.cidade,
          estado: instituicao.estado,
          cep: instituicao.cep,
          telefone: instituicao.telefone,
          email: instituicao.email,
          regional: instituicao.regional,
          programas: instituicao.programas || (instituicao.programa ? [instituicao.programa] : []), // Migrar programa único para array
          status: instituicao.status, // Incluir status na edição
          observacoes: instituicao.observacoes || '',
          nome_lider: instituicao.nome_lider,
          documentos: instituicao.documentos || []
        });
        } catch (error) {
          console.error('Erro ao carregar instituição:', error);
          showError('Erro ao carregar dados da instituição');
          navigate('/ongs');
        }
      };
      loadInstituicao();
    }
  }, [isEditing, ongToEdit, id, showError, navigate]);

  const onlyDigits = (s: string) => (s || '').replace(/\D/g, '');

  const formatCNPJ = (value: string) => {
    const d = onlyDigits(value).slice(0, 14);
    let out = d;
    if (d.length > 2) out = d.replace(/^(\d{2})(\d)/, '$1.$2');
    if (d.length > 5) out = out.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
    if (d.length > 8) out = out.replace(/\.(\d{3})(\d)/, '.$1/$2');
    if (d.length > 12) out = out.replace(/\/(\d{4})(\d{1,2})$/, '/$1-$2');
    return out;
  };

  const validateCNPJ = (cnpj: string) => {
    const d = onlyDigits(cnpj);
    if (!d) return '';
    if (d.length !== 14) return 'CNPJ deve ter 14 dígitos';
    // Aceita qualquer número de 14 dígitos sem validar se é um CNPJ válido
    return '';
  };

  const formatCEP = (value: string) => {
    const d = onlyDigits(value).slice(0, 8);
    return d.replace(/^(\d{5})(\d)/, '$1-$2');
  };

  const validateCEP = (cep: string) => {
    const d = onlyDigits(cep);
    if (!d) return '';
    return d.length === 8 ? '' : 'CEP deve ter 8 dígitos';
  };

  const formatTelefone = (value: string) => {
    const d = onlyDigits(value).slice(0, 11);
    if (d.length <= 10) {
      return d
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return d
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  };

  const validateTelefone = (tel: string) => {
    const len = onlyDigits(tel).length;
    if (!len) return '';
    return (len === 10 || len === 11) ? '' : 'Telefone deve ter 10 ou 11 dígitos';
  };

  const validateEmail = (email: string) => {
    if (!email) return '';
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email) ? '' : 'Email inválido';
  };

  const validateField = (field: 'cnpj'|'cep'|'telefone'|'email', value: string) => {
    switch (field) {
      case 'cnpj': return validateCNPJ(value);
      case 'cep': return validateCEP(value);
      case 'telefone': return validateTelefone(value);
      case 'email': return validateEmail(value);
      default: return '';
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Validar campo nome obrigatório
    if (!form.nome || form.nome.trim() === '') {
      newErrors.nome = 'Nome é obrigatório';
    }
    
    // Validar programas obrigatório
    if (!form.programas || form.programas.length === 0) {
      newErrors.programas = 'Selecione pelo menos um programa';
    }
    
    // Validar outros campos
    const fields: Array<[('cnpj'|'cep'|'telefone'|'email'), string]> = [
      ['cnpj', form.cnpj || ''],
      ['cep', form.cep || ''],
      ['telefone', form.telefone || ''],
      ['email', form.email || ''],
    ];
    fields.forEach(([f, v]) => { newErrors[f] = validateField(f, v); });
    
    setErrors(newErrors);
    return Object.values(newErrors).every(msg => !msg);
  };

  const handleChange = (field: keyof ONGForm, value: string | ProgramaArray) => {
    let newValue = value;
    if (field === 'cnpj' && typeof value === 'string') newValue = formatCNPJ(value);
    if (field === 'cep' && typeof value === 'string') newValue = formatCEP(value);
    if (field === 'telefone' && typeof value === 'string') newValue = formatTelefone(value);
    setForm(prev => ({ ...prev, [field]: newValue }));
    
    // Validar campos específicos em tempo real
    if (['cnpj','cep','telefone','email'].includes(field as string) && typeof newValue === 'string') {
      const msg = validateField(field as any, newValue);
      setErrors(prev => ({ ...prev, [field]: msg }));
    }
    
    // Limpar erro do nome quando o usuário começar a digitar
    if (field === 'nome' && errors.nome) {
      setErrors(prev => ({ ...prev, nome: '' }));
    }
    
    // Limpar erro dos programas quando o usuário selecionar algum
    if (field === 'programas' && Array.isArray(newValue) && newValue.length > 0 && errors.programas) {
      setErrors(prev => ({ ...prev, programas: '' }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      // Converter File objects para nomes de arquivos
      const documentosNomes = (form.documentos || []).map(doc => {
        // Se já é string (caso de edição), manter como está
        if (typeof doc === 'string') return doc;
        // Se é File object, extrair apenas o nome
        return doc.name;
      });

      if (isEditing && id) {
        // Atualizar instituição existente
        const updateData: UpdateInstituicaoData = {
          nome: form.nome,
          cnpj: form.cnpj,
          endereco: form.endereco,
          cidade: form.cidade,
          estado: form.estado,
          cep: form.cep,
          telefone: form.telefone,
          email: form.email,
          regional: form.regional,
          programas: form.programas, // Usar programas array
          status: form.status, // Incluir status na atualização
          observacoes: form.observacoes,
          nome_lider: form.nome_lider,
          documentos: documentosNomes
        };
        
        await InstituicaoService.updateInstituicao(id, updateData);
        showSuccess('Instituição atualizada com sucesso!');
      } else {
        // Criar nova instituição
        const createData: CreateInstituicaoData = {
          nome: form.nome,
          cnpj: form.cnpj,
          endereco: form.endereco,
          cidade: form.cidade,
          estado: form.estado,
          cep: form.cep,
          telefone: form.telefone,
          email: form.email,
          regional: form.regional,
          programas: form.programas, // Usar programas array
          observacoes: form.observacoes,
          nome_lider: form.nome_lider,
          documentos: documentosNomes,
          status: 'ativa'
        };
        
        await InstituicaoService.createInstituicao(createData);
        showSuccess('Instituição cadastrada com sucesso!');
      }
      
      navigate('/ongs');
    } catch (error) {
      console.error('Erro ao salvar instituição:', error);
      showError(error instanceof Error ? error.message : 'Erro ao salvar instituição');
    } finally {
      setSaving(false);
    }
  };

  const fetchEnderecoByCEP = async (cepValue: string) => {
    const digits = (cepValue || '').replace(/\D/g, '');
    if (digits.length !== 8) { setCepError('CEP inválido'); return; }
    setCepLoading(true);
    setCepError(null);
    try {
      const resp = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await resp.json();
      if (data?.erro) {
        setCepError('CEP não encontrado.');
        return;
      }
      setForm(prev => ({
        ...prev,
        endereco: [data?.logradouro, data?.bairro].filter(Boolean).join(', '),
        cidade: data?.localidade || prev.cidade,
        estado: data?.uf || prev.estado,
      }));
    } catch (err) {
      setCepError('Erro ao buscar endereço.');
    } finally {
      setCepLoading(false);
    }
  };

  const handleFilesChange = (files: FileList | null) => {
    if (!files) return;
    setUploadError(null);
    const allowed = ['application/pdf','image/jpeg','image/png'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const list = Array.from(files);
    if (list.some(f => !allowed.includes(f.type))) {
      setUploadError('Tipo de arquivo não permitido. Apenas PDF, JPG e PNG.');
      return;
    }
    if (list.some(f => f.size > maxSize)) {
      setUploadError('Arquivo excede o limite de 10MB.');
      return;
    }
    setForm(prev => {
      const current = prev.documentos || [];
      const combined = [...current, ...list];
      if (combined.length > 10) {
        setUploadError('Máximo de 10 arquivos permitidos.');
        return prev;
      }
      return { ...prev, documentos: combined };
    });
  };

  const removeDocumento = (index: number) => {
    setForm(prev => ({
      ...prev,
      documentos: (prev.documentos || []).filter((_, i) => i !== index),
    }));
    setUploadError(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-pink-600" />
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar ONG' : 'Cadastrar ONG'}
          </h1>
        </div>
        <Button className="bg-gray-100 text-gray-700 hover:bg-gray-200" onClick={() => navigate(-1)}>Voltar</Button>
      </div>

      <Card className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" 
              value={form.nome} 
              onChange={e => handleChange('nome', e.target.value)} 
              placeholder="Nome da ONG" 
              spellCheck="false"
            />
            {errors.nome && (<p className="text-xs text-red-600 mt-1">{errors.nome}</p>)}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
            <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" value={form.cnpj || ''} onChange={e => handleChange('cnpj', e.target.value)} placeholder="00.000.000/0000-00" />
            {errors.cnpj && (<p className="text-xs text-red-600 mt-1">{errors.cnpj}</p>)}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Líder</label>
            <input 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" 
              value={form.nome_lider || ''} 
              onChange={e => setForm(prev => ({ ...prev, nome_lider: e.target.value }))} 
              placeholder="Nome do líder responsável" 
              spellCheck="false"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
            <input 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" 
              value={form.endereco || ''} 
              onChange={e => handleChange('endereco', e.target.value)} 
              placeholder="Rua, número" 
              spellCheck="false"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
            <input 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" 
              value={form.cidade || ''} 
              onChange={e => handleChange('cidade', e.target.value)} 
              placeholder="Cidade" 
              spellCheck="false"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" value={form.estado || ''} onChange={e => handleChange('estado', e.target.value)} placeholder="UF" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
            <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" value={form.cep || ''} onChange={e => handleChange('cep', e.target.value)} onBlur={() => fetchEnderecoByCEP(form.cep || '')} placeholder="00000-000" />
            {cepLoading && (<p className="text-xs text-gray-500 mt-1">Buscando endereço pelo CEP...</p>)}
            {cepError && (<p className="text-xs text-red-600 mt-1">{cepError}</p>)}
            {errors.cep && (<p className="text-xs text-red-600 mt-1">{errors.cep}</p>)}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
            <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" value={form.telefone || ''} onChange={e => handleChange('telefone', e.target.value)} placeholder="(00) 00000-0000" />
            {errors.telefone && (<p className="text-xs text-red-600 mt-1">{errors.telefone}</p>)}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" value={form.email || ''} onChange={e => handleChange('email', e.target.value)} placeholder="contato@ong.org" />
            {errors.email && (<p className="text-xs text-red-600 mt-1">{errors.email}</p>)}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Regional</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" value={form.regional} onChange={e => handleChange('regional', e.target.value)}>
              <option value="nacional">Nacional</option>
              <option value="comercial">Comercial</option>
              <option value="centro_oeste">Centro-Oeste</option>
              <option value="mg_es">MG/ES</option>
              <option value="nordeste_1">Nordeste 1</option>
              <option value="nordeste_2">Nordeste 2</option>
              <option value="norte">Norte</option>
              <option value="rj">RJ</option>
              <option value="sp">SP</option>
              <option value="sul">Sul</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Programas</label>
            <div className="space-y-2">
              {(['as_maras', 'microcredito', 'decolagem'] as Programa[]).map((programa) => (
                <label key={programa} className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    checked={form.programas?.includes(programa) || false}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleChange('programas', [...(form.programas || []), programa]);
                      } else {
                        handleChange('programas', (form.programas || []).filter(p => p !== programa));
                      }
                    }}
                  />
                  <span className="text-sm text-gray-700">
                    {programa === 'as_maras' ? 'As Maras' : 
                     programa === 'microcredito' ? 'Microcrédito' : 
                     'Decolagem'}
                  </span>
                </label>
              ))}
            </div>
            {(form.programas?.length || 0) === 0 && (
              <p className="text-xs text-red-600 mt-1">Selecione pelo menos um programa</p>
            )}
          </div>
          {isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" 
                value={form.status || 'ativa'} 
                onChange={e => handleChange('status', e.target.value as 'ativa' | 'inativa' | 'evadida')}
              >
                <option value="ativa">Ativa</option>
                <option value="inativa">Inativa</option>
                <option value="evadida">Evadida</option>
              </select>
            </div>
          )}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Documentos</label>
            <input type="file" multiple onChange={e => handleFilesChange(e.target.files)} className="w-full" />
            {uploadError && (<p className="text-xs text-red-600 mt-1">{uploadError}</p>)}
            {Boolean(form.documentos && form.documentos.length) && (
              <ul className="mt-2 space-y-2">
                {(form.documentos || []).map((file, idx) => {
                  // Obter o nome do arquivo (seja File object ou string)
                  const fileName = typeof file === 'string' ? file : file.name;
                  return (
                    <li key={`${fileName}-${idx}`} className="flex items-center justify-between text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded">
                      <span className="truncate mr-3">{fileName}</span>
                      <button type="button" className="text-red-600 hover:underline" onClick={() => removeDocumento(idx)}>Remover</button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" value={form.observacoes || ''} onChange={e => handleChange('observacoes', e.target.value)} placeholder="Notas adicionais" />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button className="bg-gray-200 text-gray-800 hover:bg-gray-300" onClick={() => navigate(-1)}>Cancelar</Button>
          <Button className="bg-pink-600 hover:bg-pink-700 text-white" onClick={handleSubmit} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : (isEditing ? 'Atualizar ONG' : 'Salvar ONG')}
          </Button>
        </div>
      </Card>
    </div>
  );
}