import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Unified UI:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="wrap">
          <p className="page-intro-lead panel-error">
            Darstellung fehlgeschlagen: {this.state.error.message}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
