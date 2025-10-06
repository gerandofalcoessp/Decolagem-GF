import { useMemo, useState } from 'react';
import { X, FileDown, FileText, Image as ImageIcon, Users, MapPin, Calendar as CalendarIcon, Edit, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';
import { ATIVIDADE_OPTIONS } from '@/pages/calendario/constants';
import type { Atividade } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  events: Atividade[];
  onEdit: (evt: Atividade) => void;
  onDelete: (id: string) => void;
  regionalLabel: string;
}

function getTrimestreLabel(d: Date) {
  const m = d.getMonth();
  if (m <= 2) return '1º Trimestre';
  if (m <= 5) return '2º Trimestre';
  if (m <= 8) return '3º Trimestre';
  return '4º Trimestre';
}

export default function GestaoAtividadesModal({ isOpen, onClose, events, onEdit, onDelete, regionalLabel }: Props) {
  const [activeTab, setActiveTab] = useState<'atividades' | 'filtro' | 'exportacao'>('atividades');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroTrimestre, setFiltroTrimestre] = useState<string>('todos');
  const [filtroEquipe, setFiltroEquipe] = useState<string>('todos');

  const equipeOptions = useMemo(() => {
    const nomes = Array.from(new Set(events.map(e => e.responsavel?.nome).filter(Boolean))) as string[];
    return ['todos', ...nomes];
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const tipoMatch = filtroTipo === 'todos' || e.tipo === filtroTipo;
      const triLabel = getTrimestreLabel(new Date(e.data_inicio));
      const triMatch = filtroTrimestre === 'todos' || triLabel === filtroTrimestre;
      const equipeMatch = filtroEquipe === 'todos' || e.responsavel?.nome === filtroEquipe;
      return tipoMatch && triMatch && equipeMatch;
    });
  }, [events, filtroTipo, filtroTrimestre, filtroEquipe]);

  const stats = useMemo(() => {
    const tiposUnicos = new Set(events.map(e => e.tipo));
    const trimestres = new Set(events.map(e => getTrimestreLabel(new Date(e.data_inicio))));
    const membrosEquipe = new Set(events.map(e => e.responsavel?.nome).filter(Boolean));
    const comEvidencias = events.filter(e => (e.evidencias?.length ?? 0) > 0).length;
    return {
      total: events.length,
      filtradas: filteredEvents.length,
      tiposUnicos: tiposUnicos.size,
      trimestres: trimestres.size,
      membrosEquipe: membrosEquipe.size,
      comEvidencias,
    };
  }, [events, filteredEvents]);

  const exportCSV = () => {
    const headers = ['Titulo','Tipo','Data','Regional','Programa','Responsavel','Participantes','Quantidade','Evidencias'];
    const rows = filteredEvents.map(e => {
      const evid = (e.evidencias ?? []).map(ev => ev.url ?? ev.filename).join('|');
      return [
        e.titulo,
        e.tipo,
        format(new Date(e.data_inicio), 'dd/MM/yyyy'),
        e.regional ?? '',
        e.programa ?? '',
        e.responsavel?.nome ?? '',
        String(e.participantes_confirmados ?? 0),
        e.quantidade != null ? String(e.quantidade) : '',
        evid,
      ].map(v => `"${(v ?? '').toString().replace(/"/g,'""')}"`).join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atividades_${regionalLabel.replace(/\s+/g,'_').toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportHTML = () => {
    const rows = filteredEvents.map(e => {
      const evid = (e.evidencias ?? []).map(ev => ev.url ?? ev.filename).join(', ');
      return `<tr>
        <td>${e.titulo}</td>
        <td>${e.tipo}</td>
        <td>${format(new Date(e.data_inicio), 'dd/MM/yyyy')}</td>
        <td>${e.regional ?? ''}</td>
        <td>${e.programa ?? ''}</td>
        <td>${e.responsavel?.nome ?? ''}</td>
        <td>${e.participantes_confirmados > 0 ? e.participantes_confirmados : ''}</td>
        <td>${e.quantidade && e.quantidade > 0 ? e.quantidade : ''}</td>
        <td>${evid}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Relatório de Atividades - ${regionalLabel}</title>
      <style>body{font-family:Arial,sans-serif;padding:20px;}h1{margin-bottom:12px;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ddd;padding:8px;font-size:12px;}th{background:#f3f4f6;text-align:left;}</style>
    </head><body>
      <h1>Relatório de Atividades - ${regionalLabel}</h1>
      <table><thead><tr>
        <th>Titulo</th><th>Tipo</th><th>Data</th><th>Regional</th><th>Programa</th><th>Responsavel</th><th>Participantes</th><th>Quantidade</th><th>Evidencias</th>
      </tr></thead><tbody>${rows}</tbody></table>
    </body></html>`;
    const w = window.open('about:blank');
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-start justify-center p-4 overflow-auto">
      <Card className="w-full max-w-5xl bg-white rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{regionalLabel} - Gestão de Atividades</h2>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="p-2 rounded-md border hover:bg-gray-50"><X className="w-5 h-5" /></button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-2">
            <button className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab==='atividades'?'bg-gray-900 text-white':'bg-gray-100 text-gray-700'}`} onClick={() => setActiveTab('atividades')}>
              Atividades ({events.length})
            </button>
            <button className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab==='filtro'?'bg-gray-900 text-white':'bg-gray-100 text-gray-700'}`} onClick={() => setActiveTab('filtro')}>
              Filtro
            </button>
            <button className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab==='exportacao'?'bg-gray-900 text-white':'bg-gray-100 text-gray-700'}`} onClick={() => setActiveTab('exportacao')}>
              Exportação
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {activeTab === 'atividades' && (
            <div className="space-y-4">
              {events.map((evt) => {
                const di = new Date(evt.data_inicio);
                const trimestre = getTrimestreLabel(di);
                const evidCount = evt.evidencias?.length ?? 0;
                const tipoLabel = ATIVIDADE_OPTIONS.find(o => o.value === evt.tipo)?.label ?? evt.tipo;
                return (
                  <div key={evt.id} className="border rounded-lg p-4 bg-white">
                    {/* Top badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">{tipoLabel}</span>
                      <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">{trimestre}</span>
                      {evidCount > 0 && (
                        <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                          <ImageIcon className="w-3 h-3 mr-1" /> {evidCount} evidência{evidCount>1?'s':''}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-lg font-semibold text-gray-900">{evt.titulo}</div>
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-700">
                          <div className="flex items-center"><CalendarIcon className="w-4 h-4 mr-1" /> Realizada em: {format(di,'dd/MM/yyyy')}</div>
                          <div className="flex items-center"><CalendarIcon className="w-4 h-4 mr-1" /> Registrada em: {format(new Date(evt.created_at),'dd/MM/yyyy, HH:mm')}</div>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-700">
                          {evt.responsavel?.nome && (<div className="flex items-center"><Users className="w-4 h-4 mr-1" /> {evt.responsavel?.nome}</div>)}
                          {evt.local && (<div className="flex items-center"><MapPin className="w-4 h-4 mr-1" /> {evt.local}</div>)}
                          {evt.participantes_confirmados > 0 && (<div className="flex items-center"><Users className="w-4 h-4 mr-1" /> {evt.participantes_confirmados} participantes</div>)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => onEdit(evt)} className="p-2 rounded-md border hover:bg-gray-50" aria-label="Editar"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => onDelete(evt.id)} className="p-2 rounded-md border hover:bg-red-50" aria-label="Excluir"><Trash2 className="w-4 h-4 text-red-600" /></button>
                      </div>
                    </div>

                    {/* Evidências */}
                    {evidCount > 0 && (
                      <div className="mt-3">
                        <div className="text-sm font-medium text-gray-900 mb-2">Evidências:</div>
                        <div className="flex gap-3">
                          {(evt.evidencias ?? []).map((ev) => (
                            <div key={ev.id} className="w-20 h-20 rounded-lg border overflow-hidden bg-gray-100">
                              {ev.url ? (
                                <img src={ev.url} alt={ev.filename} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">{ev.filename}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Descrição */}
                    {evt.descricao && (
                      <div className="mt-3 text-sm text-gray-700 italic">"{evt.descricao}"</div>
                    )}
                  </div>
                );
              })}
              {events.length === 0 && (
                <div className="text-center text-gray-600">Nenhuma atividade encontrada.</div>
              )}
            </div>
          )}

          {activeTab === 'filtro' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Tipo de Atividade</label>
                  <select className="mt-1 w-full border rounded-md p-2 text-sm" value={filtroTipo} onChange={(e)=>setFiltroTipo(e.target.value)}>
                    <option value="todos">Todos os tipos</option>
                    {ATIVIDADE_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Trimestre</label>
                  <select className="mt-1 w-full border rounded-md p-2 text-sm" value={filtroTrimestre} onChange={(e)=>setFiltroTrimestre(e.target.value)}>
                    <option value="todos">Todos os trimestres</option>
                    <option>1º Trimestre</option>
                    <option>2º Trimestre</option>
                    <option>3º Trimestre</option>
                    <option>4º Trimestre</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Equipe</label>
                  <select className="mt-1 w-full border rounded-md p-2 text-sm" value={filtroEquipe} onChange={(e)=>setFiltroEquipe(e.target.value)}>
                    {equipeOptions.map(opt => (
                      <option key={opt} value={opt}>{opt === 'todos' ? 'Todos os membros' : opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Results summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4"><div className="text-2xl font-bold text-gray-900">{stats.total}</div><div className="text-sm text-gray-600">Total de Atividades</div></Card>
                <Card className="p-4"><div className="text-2xl font-bold text-blue-600">{stats.filtradas}</div><div className="text-sm text-gray-600">Atividades Filtradas</div></Card>
                <Card className="p-4"><div className="text-2xl font-bold text-purple-600">{stats.tiposUnicos}</div><div className="text-sm text-gray-600">Tipos Únicos</div></Card>
                <Card className="p-4"><div className="text-2xl font-bold text-emerald-600">{stats.trimestres}</div><div className="text-sm text-gray-600">Trimestres</div></Card>
              </div>

              {/* Preview list */}
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {filteredEvents.map(e => (
                  <div key={e.id} className="border rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{e.titulo}</div>
                      <div className="text-xs text-gray-600">{format(new Date(e.data_inicio),'dd/MM/yyyy')} • {e.responsavel?.nome ?? 'Sem responsável'}</div>
                    </div>
                    <div className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">{getTrimestreLabel(new Date(e.data_inicio))}</div>
                  </div>
                ))}
                {filteredEvents.length === 0 && (
                  <div className="text-sm text-gray-600">Nenhuma atividade com os filtros atuais.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'exportacao' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4"><div className="text-2xl font-bold text-gray-900">{stats.total}</div><div className="text-sm text-gray-600">Total de Atividades</div></Card>
                <Card className="p-4"><div className="text-2xl font-bold text-green-600">{stats.comEvidencias}</div><div className="text-sm text-gray-600">Com Evidências</div></Card>
                <Card className="p-4"><div className="text-2xl font-bold text-purple-600">{stats.tiposUnicos}</div><div className="text-sm text-gray-600">Tipos Únicos</div></Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-6">
                  <div className="text-lg font-semibold text-gray-900 mb-2">Exportar para Excel</div>
                  <p className="text-sm text-gray-600 mb-4">Planilha com todos os dados das atividades incluindo links das evidências</p>
                  <Button className="bg-gray-900 text-white" onClick={exportCSV}><FileDown className="w-4 h-4 mr-2" /> Baixar Excel</Button>
                </Card>
                <Card className="p-6">
                  <div className="text-lg font-semibold text-gray-900 mb-2">Exportar para PDF</div>
                  <p className="text-sm text-gray-600 mb-4">Relatório em HTML formatado com tabela e links das evidências</p>
                  <Button className="bg-gray-900 text-white" onClick={exportHTML}><FileText className="w-4 h-4 mr-2" /> Gerar PDF</Button>
                </Card>
              </div>

              <div className="text-xs text-gray-500">
                • Exportação reflete os filtros atuais. • Links das evidências são incluídos quando disponíveis. • PDF abre em nova aba como relatório HTML.
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}