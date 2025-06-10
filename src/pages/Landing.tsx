import { useToast } from '@/components';

export const Landing = () => {
  return (
    <div>
      <h1>Landing page</h1>
      <ToastDemo />
    </div>
  );
};

export const ToastDemo: React.FC = () => {
  const { showToast, hideAllToasts } = useToast();

  const showSuccessToast = () => {
    showToast({
      type: 'success',
      title: 'Success!',
      message: 'Your action was completed successfully.',
      duration: 4000,
    });
  };

  const showErrorToast = () => {
    showToast({
      type: 'error',
      title: 'Error occurred',
      message: 'Something went wrong. Please try again.',
      duration: 6000,
    });
  };

  const showWarningToast = () => {
    showToast({
      type: 'warning',
      message: 'This is a warning message without a title.',
      position: 'top-left',
    });
  };

  const showInfoToast = () => {
    showToast({
      type: 'info',
      title: 'Information',
      message: 'Here is some useful information for you.',
      position: 'bottom-right',
    });
  };

  const showCustomToast = () => {
    showToast({
      message: 'This is a custom styled toast!',
      position: 'top-center',
      className: 'bg-purple-100 border-purple-300 text-purple-900',
      iconClassName: 'text-purple-600',
      renderIcon: () => <span className="text-xl">🎉</span>,
      duration: 3000,
    });
  };

  const showPersistentToast = () => {
    showToast({
      type: 'info',
      title: 'Persistent Toast',
      message: 'This toast will stay until manually closed.',
      persistent: true,
      position: 'bottom-left',
    });
  };

  const showClickableToast = () => {
    showToast({
      type: 'info',
      title: 'Clickable Toast',
      message: 'Click me to see an alert!',
      onClick: () => alert('Toast clicked!'),
      duration: 8000,
    });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">Toast System Demo</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <button
          onClick={showSuccessToast}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          Success Toast
        </button>

        <button
          onClick={showErrorToast}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Error Toast
        </button>

        <button
          onClick={showWarningToast}
          className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
        >
          Warning Toast
        </button>

        <button
          onClick={showInfoToast}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Info Toast
        </button>

        <button
          onClick={showCustomToast}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          Custom Toast
        </button>

        <button
          onClick={showPersistentToast}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Persistent Toast
        </button>

        <button
          onClick={showClickableToast}
          className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
        >
          Clickable Toast
        </button>

        <button
          onClick={hideAllToasts}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Clear All
        </button>
      </div>

      <div className="bg-gray-100 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Features</h2>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>✅ Multiple toast types (success, error, warning, info)</li>
          <li>✅ Customizable positioning (6 positions)</li>
          <li>✅ Auto-dismiss with configurable duration</li>
          <li>✅ Persistent toasts that don't auto-dismiss</li>
          <li>✅ Clickable toasts with custom actions</li>
          <li>✅ Custom styling with className props</li>
          <li>✅ Custom icons and close buttons</li>
          <li>✅ Smooth animations and hover effects</li>
          <li>✅ Global state management with context</li>
          <li>✅ TypeScript support</li>
        </ul>
      </div>
    </div>
  );
};
