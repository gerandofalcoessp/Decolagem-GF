import { useState } from 'react';
import { 
  MapPin, 
  Users, 
  Crown, 
  Shield, 
  UserCheck,
  Calendar,
  Plus,
  Activity,
  Building2
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';

interface Regional {
  id: string;
  name: string;
  states: string[];
  leader: {
    name: string;
    role: string;
  };
  coordinator?: {
    name: string;
    role: string;
  };
  consultants: Array<{
    name: string;
    role: string;
  }>;
  totalMembers: number;
  color: string;
}

const regionaisData: Regional[] = [
  {
    id: 'nacional',
    name: 'Nacional',
    states: ['Todas as Regiões'],
    leader: { name: 'Maria Silva', role: 'Líder Nacional' },
    coordinator: { name: 'João Santos', role: 'Coordenador' },
    consultants: [
      { name: 'Ana Costa', role: 'Consultor' },
      { name: 'Pedro Lima', role: 'Consultor' }
    ],
    totalMembers: 8,
    color: 'bg-blue-50 border-blue-200'
  },
  {
    id: 'comercial',
    name: 'Comercial',
    states: ['Área Comercial'],
    leader: { name: 'Carlos Mendes', role: 'Líder Comercial' },
    coordinator: { name: 'Lucia Ferreira', role: 'Coordenador' },
    consultants: [
      { name: 'Roberto Alves', role: 'Consultor' },
      { name: 'Fernanda Rocha', role: 'Consultor' }
    ],
    totalMembers: 6,
    color: 'bg-green-50 border-green-200'
  },
  {
    id: 'centro-oeste',
    name: 'Centro-Oeste',
    states: ['DF', 'GO', 'MT', 'MS'],
    leader: { name: 'Flávio', role: 'Líder Regional' },
    coordinator: { name: 'Deise', role: 'Coordenador' },
    consultants: [],
    totalMembers: 2,
    color: 'bg-purple-50 border-purple-200'
  },
  {
    id: 'mg-es',
    name: 'MG/ES',
    states: ['MG', 'ES'],
    leader: { name: 'Sérgio', role: 'Líder Regional' },
    coordinator: { name: 'Alcione', role: 'Coordenador' },
    consultants: [],
    totalMembers: 2,
    color: 'bg-emerald-50 border-emerald-200'
  },
  {
    id: 'nordeste-1',
    name: 'Nordeste 1',
    states: ['CE', 'PB', 'RN', 'MA', 'PI'],
    leader: { name: 'Ana Neiry', role: 'Líder Regional' },
    coordinator: { name: 'Louisiany', role: 'Coordenador' },
    consultants: [
      { name: 'Aline', role: 'Consultor' },
      { name: 'Anailton', role: 'Consultor' },
      { name: 'Neuza', role: 'Consultor' }
    ],
    totalMembers: 5,
    color: 'bg-violet-50 border-violet-200'
  },
  {
    id: 'nordeste-2',
    name: 'Nordeste 2',
    states: ['BA', 'SE', 'PE', 'AL'],
    leader: { name: 'Eduardo', role: 'Líder Regional' },
    coordinator: { name: 'Alessandro', role: 'Coordenador' },
    consultants: [
      { name: 'Carlos Henrique', role: 'Consultor' },
      { name: 'Luciana', role: 'Consultor' }
    ],
    totalMembers: 4,
    color: 'bg-orange-50 border-orange-200'
  },
  {
    id: 'norte',
    name: 'Norte',
    states: ['AC', 'AP', 'AM', 'PA', 'RO', 'RR', 'TO'],
    leader: { name: 'Marcos Silva', role: 'Líder Regional' },
    coordinator: { name: 'Patricia Santos', role: 'Coordenador' },
    consultants: [
      { name: 'Rafael Costa', role: 'Consultor' }
    ],
    totalMembers: 3,
    color: 'bg-teal-50 border-teal-200'
  },
  {
    id: 'rio-janeiro',
    name: 'Rio de Janeiro',
    states: ['RJ'],
    leader: { name: 'Beatriz Lima', role: 'Líder Regional' },
    coordinator: { name: 'Gabriel Oliveira', role: 'Coordenador' },
    consultants: [
      { name: 'Camila Souza', role: 'Consultor' },
      { name: 'Diego Martins', role: 'Consultor' }
    ],
    totalMembers: 4,
    color: 'bg-cyan-50 border-cyan-200'
  },
  {
    id: 'sul',
    name: 'Sul',
    states: ['RS', 'PR', 'SC'],
    leader: { name: 'Amanda Pereira', role: 'Líder Regional' },
    coordinator: { name: 'Rodrigo Almeida', role: 'Coordenador' },
    consultants: [
      { name: 'Juliana Barbosa', role: 'Consultor' },
      { name: 'Thiago Ribeiro', role: 'Consultor' }
    ],
    totalMembers: 4,
    color: 'bg-indigo-50 border-indigo-200'
  },
  {
    id: 'sao-paulo',
    name: 'São Paulo',
    states: ['SP'],
    leader: { name: 'Ricardo Fernandes', role: 'Líder Regional' },
    coordinator: { name: 'Vanessa Castro', role: 'Coordenador' },
    consultants: [
      { name: 'Leonardo Dias', role: 'Consultor' },
      { name: 'Priscila Moreira', role: 'Consultor' },
      { name: 'Bruno Carvalho', role: 'Consultor' }
    ],
    totalMembers: 5,
    color: 'bg-rose-50 border-rose-200'
  }
];

export default function RegionaisPage() {
  const [selectedRegional, setSelectedRegional] = useState<string | null>(null);
  const navigate = useNavigate();

  const mapRegionalId = (id: string): string => {
    switch (id) {
      case 'centro-oeste': return 'centro_oeste';
      case 'mg-es': return 'mg_es';
      case 'nordeste-1': return 'nordeste_1';
      case 'nordeste-2': return 'nordeste_2';
      case 'rio-janeiro': return 'rj';
      case 'sao-paulo': return 'sp';
      default: return id; // nacional, comercial, norte, sul já compatíveis
    }
  };

  const totalLideres = regionaisData.filter(r => r.leader).length;
  const totalCoordenadores = regionaisData.filter(r => r.coordinator).length;
  const totalConsultores = regionaisData.reduce((acc, r) => acc + r.consultants.length, 0);
  const totalMembros = regionaisData.reduce((acc, r) => acc + r.totalMembers, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Regionais</h1>
        <p className="text-gray-600">Gestão das 8 Regionais e Equipes</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4 border-l-4 border-l-yellow-500">
          <div className="flex items-center">
            <Crown className="h-8 w-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalLideres}</p>
              <p className="text-sm text-gray-600">Líderes Regionais</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalCoordenadores}</p>
              <p className="text-sm text-gray-600">Coordenadores</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-green-500">
          <div className="flex items-center">
            <UserCheck className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalConsultores}</p>
              <p className="text-sm text-gray-600">Consultores</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-purple-500">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalMembros}</p>
              <p className="text-sm text-gray-600">Total de Membros</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Regional Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {regionaisData.map((regional) => (
          <Card key={regional.id} className={`p-6 ${regional.color} hover:shadow-lg transition-shadow`}>
            {/* Header */}
            <div className="flex items-center mb-4">
              <MapPin className="h-5 w-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">{regional.name}</h3>
            </div>

            {/* States */}
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <Users className="h-4 w-4 text-gray-500 mr-1" />
                <span className="text-sm text-gray-600">{regional.totalMembers} membros</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {regional.states.map((state) => (
                  <span
                    key={state}
                    className="px-2 py-1 bg-white bg-opacity-60 rounded text-xs font-medium text-gray-700"
                  >
                    {state}
                  </span>
                ))}
              </div>
            </div>

            {/* Team Members */}
            <div className="space-y-2 mb-4">
              {/* Leader */}
              <div className="flex items-center">
                <Crown className="h-4 w-4 text-yellow-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{regional.leader.name}</p>
                  <p className="text-xs text-gray-600">{regional.leader.role}</p>
                </div>
              </div>

              {/* Coordinator */}
              {regional.coordinator && (
                <div className="flex items-center">
                  <Shield className="h-4 w-4 text-blue-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{regional.coordinator.name}</p>
                    <p className="text-xs text-gray-600">{regional.coordinator.role}</p>
                  </div>
                </div>
              )}

              {/* Consultants */}
              {regional.consultants.map((consultant, index) => (
                <div key={index} className="flex items-center">
                  <UserCheck className="h-4 w-4 text-green-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{consultant.name}</p>
                    <p className="text-xs text-gray-600">{consultant.role}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 text-white text-sm py-2"
                size="sm"
                onClick={() => navigate(`/regionais/calendario?regional=${mapRegionalId(regional.id)}&open=new`)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Registrar Atividade
              </Button>

              <Button 
                className="w-full bg-pink-600 hover:bg-pink-700 text-white text-sm py-2"
                size="sm"
                onClick={() => navigate(`/ongs/cadastrar?regional=${regional.id}`)}
              >
                <Building2 className="h-4 w-4 mr-1" />
                Cadastrar ONGs
              </Button>

              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2"
                size="sm"
                onClick={() => navigate(`/regionais/calendario?regional=${mapRegionalId(regional.id)}&view=gestao`)}
              >
                <Activity className="h-4 w-4 mr-1" />
                Todas as Atividades
              </Button>

              <Button 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm py-2"
                size="sm"
                onClick={() => navigate(`/regionais/calendario?regional=${regional.id}`)}
              >
                <Calendar className="h-4 w-4 mr-1" />
                Calendário Atividades
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}