import { Component } from "react";

/**
 * Global error boundary.
 *
 * Without this, ANY runtime error thrown during render anywhere in the tree
 * unmounts the entire React app and leaves a blank white page. With it, the
 * error is contained and shown on screen with a reload action, so the app
 * never silently "crashes" again.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary] Caught error:", error, info);
  }

  handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      const message =
        this.state.error?.message || String(this.state.error || "Unknown error");
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f8fafc",
            padding: "24px",
            fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: "560px",
              width: "100%",
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "16px",
              padding: "32px",
              boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                margin: "0 auto 16px",
                background: "#fee2e2",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
              }}
            >
              ⚠️
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: "14px", color: "#475569", margin: "0 0 16px" }}>
              The page hit an unexpected error. Your data is safe — try reloading.
            </p>
            <p
              style={{
                fontSize: "13px",
                color: "#b91c1c",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                padding: "10px 14px",
                margin: "0 0 20px",
                textAlign: "left",
                wordBreak: "break-word",
              }}
            >
              {message}
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={this.handleReload}
                style={{
                  padding: "10px 20px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#4f46e5",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;