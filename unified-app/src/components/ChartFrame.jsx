export default function ChartFrame({ title, children }) {
  return (
    <div className="unified-card chart-frame">
      {title ? <div className="chart-frame-title">{title}</div> : null}
      <div className="chart-frame-body">{children}</div>
    </div>
  );
}
