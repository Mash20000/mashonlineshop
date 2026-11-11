import { Component } from 'react';

// Shows a friendly page instead of a blank screen if something in the app crashes.
export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error('App error:', error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
        <p className="mt-2 text-gray-600">Please reload the page. If it keeps happening, tell the shop.</p>
        <button className="btn-primary mt-6" onClick={() => window.location.assign('/')}>
          Back to the shop
        </button>
      </div>
    );
  }
}
