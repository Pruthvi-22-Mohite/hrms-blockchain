/**
 * LoadingState - Shows a spinner with optional message.
 */
export default function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="loading-state" role="status" aria-label={message}>
      <div className="spinner" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
