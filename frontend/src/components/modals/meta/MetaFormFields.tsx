import React from 'react';

interface MetaState {
  nome: string;
  quantidade: string;
  nomePersonalizado: string;
}

interface Props {
  meta: MetaState;
  setMeta: (meta: MetaState | ((prev: MetaState) => MetaState)) => void;
  className?: string;
}

const GOAL_OPTIONS = [
  'Ong Mara',
  'Liga Mara Formadas',
  'Ong Decolagem',
  'Liga Decolagem',
  'Formação Liga',
  'Atendidos Indiretos Decolagem',
  'Atendidos Diretos Decolagem',
  'Imersão Ongs',
  'Encontro líder Maras',
  'Processo seletivo',
  'Retenção',
  'Inadimplência',
  'NPS',
  'Outra'
];

export default function MetaFormFields({ meta, setMeta, className }: Props) {
  return (
    <div className={className}>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Meta</label>
          <select
            value={meta.nome}
            onChange={(e) => setMeta({ ...meta, nome: e.target.value, nomePersonalizado: '' })}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
          >
            <option value="">Selecione o nome</option>
            {GOAL_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {meta.nome === 'Retenção' ? 'Porcentagem (%)' : 'Quantidade'}
          </label>
          <input
            type="number"
            value={meta.quantidade}
            onChange={(e) => setMeta({ ...meta, quantidade: e.target.value })}
            placeholder={meta.nome === 'Retenção' ? 'Ex: 85' : 'Ex: 300'}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
          />
          {meta.nome === 'Retenção' && (
            <p className="text-xs text-gray-500 mt-0.5">Digite apenas o número (ex: 85 para 85%)</p>
          )}
        </div>
      </div>
      {meta.nome === 'Outra' && (
        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Meta Personalizada</label>
          <input
            type="text"
            value={meta.nomePersonalizado}
            onChange={(e) => setMeta({ ...meta, nomePersonalizado: e.target.value })}
            placeholder="Digite o nome da meta personalizada"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
          />
        </div>
      )}
    </div>
  );
}