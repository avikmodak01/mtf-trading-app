import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#121212',
          color: '#E0E0E0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#1E1E1E',
            padding: '30px',
            borderRadius: '8px',
            border: '1px solid #374151',
            maxWidth: '500px',
            textAlign: 'center'
          }}>
            <h2 style={{ color: '#EF4444', marginBottom: '20px' }}>
              Something went wrong
            </h2>
            <p style={{ marginBottom: '20px' }}>
              There was an error loading the application. Please check your internet connection and Supabase configuration.
            </p>
            <details style={{ marginBottom: '20px', textAlign: 'left' }}>
              <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>
                Technical Details
              </summary>
              <pre style={{
                backgroundColor: '#111',
                padding: '10px',
                borderRadius: '4px',
                fontSize: '12px',
                overflow: 'auto'
              }}>
                {this.state.error?.message || 'Unknown error'}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#FF6600',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;