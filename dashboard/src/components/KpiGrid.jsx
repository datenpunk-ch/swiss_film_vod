export default function KpiGrid({ items }) {
  return (
    <div className="kpi-grid" role="list">
      {items.map((item, i) => (
        <div className="kpi-card" role="listitem" key={item.key} style={{ animationDelay: `${i * 60}ms` }}>
          <div className="kpi-v">{item.value}</div>
          <div className="kpi-k">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
