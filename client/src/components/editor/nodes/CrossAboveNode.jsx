import BaseNode from './BaseNode';

export default function CrossAboveNode() {
  return (
    <BaseNode title="Cross Above ↑" borderColor="#F0C060" bg="#FFFEF0"
      inputs={[{ id: 'input1' }, { id: 'input2' }]}>
      <span style={{ fontSize: 11, color: '#7d5a00' }}>value1 перетинає value2 знизу</span>
    </BaseNode>
  );
}
