import React from 'react';
import { Button } from '../../ui/Button';

interface Props {
  onCancel: () => void;
  onSubmit: () => void | Promise<void>;
  cancelLabel?: string;
  submitLabel?: string;
  submitDisabled?: boolean;
  isSubmitting?: boolean;
  containerClassName?: string;
  submitClassName?: string;
}

export default function ActionButtons({
  onCancel,
  onSubmit,
  cancelLabel = 'Cancelar',
  submitLabel = 'Salvar',
  submitDisabled = false,
  isSubmitting = false,
  containerClassName = 'flex justify-end space-x-2 mt-4 pt-3 border-t border-gray-100',
  submitClassName = 'bg-pink-500 hover:bg-pink-600 text-white text-sm px-4 py-2 shadow-sm'
}: Props) {
  return (
    <div className={containerClassName}>
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isSubmitting}
        className="text-sm px-4 py-2"
      >
        {cancelLabel}
      </Button>
      <Button
        onClick={onSubmit}
        className={submitClassName}
        disabled={submitDisabled || isSubmitting}
      >
        {isSubmitting ? 'Processando...' : submitLabel}
      </Button>
    </div>
  );
}