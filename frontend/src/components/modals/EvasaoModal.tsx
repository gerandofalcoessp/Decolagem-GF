import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface EvasaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (motivo: string, data: string) => void;
  ongNome: string;
}

export function EvasaoModal({ isOpen, onClose, onConfirm, ongNome }: EvasaoModalProps) {
  const [motivo, setMotivo] = useState('');
  const [data, setData] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!motivo.trim() || !data) {
      return;
    }
    onConfirm(motivo, data);
    setMotivo('');
    setData('');
  };

  const handleCancel = () => {
    setMotivo('');
    setData('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Registrar Evasão</h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Registrar evasão da ONG: <strong>{ongNome}</strong>
            </p>
          </div>

          {/* Motivo da Evasão */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo da Evasão
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Descreva o motivo da evasão..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
              rows={4}
              required
            />
          </div>

          {/* Data da Evasão */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data da Evasão
            </label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="text-gray-700 border-gray-300 hover:bg-gray-50"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!motivo.trim() || !data}
            className="bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Registrar Evasão
          </Button>
        </div>
      </div>
    </div>
  );
}