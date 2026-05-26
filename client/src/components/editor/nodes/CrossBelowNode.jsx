import BaseNode from './BaseNode';

export default function CrossBelowNode() {
  return (
    <BaseNode title="Cross Below ↓" borderColor="#F0C060" bg="#FFFEF0"
      inputs={[{ id: 'input1' }, { id: 'input2' }]}>
      <span style={{ fontSize: 11, color: '#7d5a00' }}>value1 перетинає value2 зверху</span>
    </BaseNode>
  );
}
