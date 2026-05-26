import BaseNode from './BaseNode';

export default function SellSignalNode() {
  return (
    <BaseNode title="🔴 Сигнал продажу" borderColor="#e03131" bg="#fff5f5" outputs={[]}>
      <span style={{ fontSize: 11, color: '#a61e1e' }}>Закрити лонг позицію</span>
    </BaseNode>
  );
}
