import BaseNode from './BaseNode';

export default function BuySignalNode() {
  return (
    <BaseNode title="🟢 Сигнал покупки" borderColor="#82c91e" bg="#f4fce3" outputs={[]}>
      <span style={{ fontSize: 11, color: '#2f7516' }}>Відкрити лонг позицію</span>
    </BaseNode>
  );
}
