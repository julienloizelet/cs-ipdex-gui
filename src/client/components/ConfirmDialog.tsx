interface ConfirmDialogProps {
  ipCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({ ipCount, onCancel, onConfirm }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
      />
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Confirm Query
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Your API key needs to handle{' '}
            <span className="font-semibold text-gray-900 dark:text-white">
              {ipCount} IP{ipCount !== 1 ? 's' : ''}
            </span>
            . Make sure your key has sufficient quota before continuing.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            className="btn btn-secondary flex-1"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary flex-1"
            onClick={onConfirm}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
