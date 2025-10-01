import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
// import { Input } from '@/components/ui/Input';
// import { Select } from '@/components/ui/Select';
import { ONGForm, Programa, Regional } from '@/types';
import { Building2, Save } from 'lucide-react';

export default function OngCadastroPage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const [saving, setSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadError, setUploadError] = useState<string | null>(null);

  const initialRegional = useMemo(() => (
    (new URLSearchParams(search).get('regional') || 'nacional') as Regional
  ), [search]);

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
    programa: 'decolagem',
    observacoes: '',
  });

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
    if (/^(\d)\1+$/.test(d)) return 'CNPJ inválido';
    const calc = (base: string, factors: number[]) => {
      let sum = 0;
      for (let i = 0; i < factors.length; i++) sum += parseInt(base[i], 10) * factors[i];
      const mod = sum % 11;
      return mod < 2 ? 0 : 11 - mod;
    };
    const base12 = d.slice(0, 12);
    const d1 = calc(base12, [5,4,3,2,9,8,7,6,5,4,3,2]);
    const d2 = calc(base12 + String(d1), [6,5,4,3,2,9,8,7,6,5,4,3,2]);
    const ok = d.endsWith(String(d1) + String(d2));
    return ok ? '' : 'CNPJ inválido';
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
    const fields: Array<[('cnpj'|'cep'|'telefone'|'email'), string]> = [
      ['cnpj', form.cnpj || ''],
      ['cep', form.cep || ''],
      ['telefone', form.telefone || ''],
      ['email', form.email || ''],
    ];
    const newErrors: Record<string, string> = {};
    fields.forEach(([f, v]) => { newErrors[f] = validateField(f, v); });
    setErrors(newErrors);
    return Object.values(newErrors).every(msg => !msg);
  };

  const handleChange = (field: keyof ONGForm, value: string) => {
    let newValue = value;
    if (field === 'cnpj') newValue = formatCNPJ(value);
    if (field === 'cep') newValue = formatCEP(value);
    if (field === 'telefone') newValue = formatTelefone(value);
    setForm(prev => ({ ...prev, [field]: newValue }));
    if (['cnpj','cep','telefone','email'].includes(field as string)) {
      const msg = validateField(field as any, newValue);
      setErrors(prev => ({ ...prev, [field]: msg }));
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    const isValid = validateForm();
    if (!isValid) {
      setSaving(false);
      return;
    }
    try {
      // TODO: integrar com backend quando endpoint estiver disponível
      // Ex: await api.post('/ongs', form)
      await new Promise(res => setTimeout(res, 800));

      // Persistência simples em localStorage para uso no calendário
      try {
        const raw = localStorage.getItem('ongs');
        const current = raw ? JSON.parse(raw) : [];
        const list = Array.isArray(current) ? current : [];
        const record = {
          id: `ong-${Date.now()}`,
          nome: form.nome,
          regional: form.regional,
          programa: form.programa,
          created_at: new Date().toISOString(),
        };
        const updated = [...list, record];
        localStorage.setItem('ongs', JSON.stringify(updated));
      } catch (e) {
        // Se falhar, apenas segue navegação
        console.warn('Falha ao salvar ONG no localStorage', e);
      }

      navigate('/programas/decolagem');
    } catch (e) {
      console.error('Erro ao salvar ONG', e);
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
          <h1 className="text-2xl font-bold text-gray-900">Cadastrar ONG</h1>
        </div>
        <Button className="bg-gray-100 text-gray-700 hover:bg-gray-200" onClick={() => navigate(-1)}>Voltar</Button>
      </div>

      <Card className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" value={form.nome} onChange={e => handleChange('nome', e.target.value)} placeholder="Nome da ONG" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
            <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" value={form.cnpj || ''} onChange={e => handleChange('cnpj', e.target.value)} placeholder="00.000.000/0000-00" />
            {errors.cnpj && (<p className="text-xs text-red-600 mt-1">{errors.cnpj}</p>)}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Líder</label>
            <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" value={form.nome_lider || ''} onChange={e => setForm(prev => ({ ...prev, nome_lider: e.target.value }))} placeholder="Nome do líder responsável" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
            <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" value={form.endereco || ''} onChange={e => handleChange('endereco', e.target.value)} placeholder="Rua, número" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
            <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" value={form.cidade || ''} onChange={e => handleChange('cidade', e.target.value)} placeholder="Cidade" />
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Programa</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" value={form.programa} onChange={e => handleChange('programa', e.target.value as Programa)}>
              <option value="as_maras">As Maras</option>
              <option value="microcredito">Microcrédito</option>
              <option value="decolagem">Decolagem</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Documentos</label>
            <input type="file" multiple onChange={e => handleFilesChange(e.target.files)} className="w-full" />
            {uploadError && (<p className="text-xs text-red-600 mt-1">{uploadError}</p>)}
            {Boolean(form.documentos && form.documentos.length) && (
              <ul className="mt-2 space-y-2">
                {(form.documentos || []).map((file, idx) => (
                  <li key={`${file.name}-${idx}`} className="flex items-center justify-between text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded">
                    <span className="truncate mr-3">{file.name}</span>
                    <button type="button" className="text-red-600 hover:underline" onClick={() => removeDocumento(idx)}>Remover</button>
                  </li>
                ))}
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
            {saving ? 'Salvando...' : 'Salvar ONG'}
          </Button>
        </div>
      </Card>
    </div>
  );
}