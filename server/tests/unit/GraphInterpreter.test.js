'use strict';

const { topologicalSort } = require('../../services/GraphInterpreter');

describe('GraphInterpreterTests', () => {
  test('testTopologicalSort_linearChain', () => {
    const nodes = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const edges = [
      { source: 'a', target: 'b' },
      { source: 'b', target: 'c' },
    ];
    const result = topologicalSort(nodes, edges);
    expect(result.indexOf('a')).toBeLessThan(result.indexOf('b'));
    expect(result.indexOf('b')).toBeLessThan(result.indexOf('c'));
  });

  test('testTopologicalSort_multipleInputs', () => {
    const nodes = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const edges = [
      { source: 'a', target: 'c' },
      { source: 'b', target: 'c' },
    ];
    const result = topologicalSort(nodes, edges);
    expect(result.indexOf('a')).toBeLessThan(result.indexOf('c'));
    expect(result.indexOf('b')).toBeLessThan(result.indexOf('c'));
  });

  test('testTopologicalSort_correctOrder_independentNodes', () => {
    const nodes = [{ id: 'x' }, { id: 'y' }, { id: 'z' }];
    const result = topologicalSort(nodes, []);
    expect(result).toHaveLength(3);
    expect(result).toContain('x');
    expect(result).toContain('y');
    expect(result).toContain('z');
  });

  test('testTopologicalSort_throwsOnCycle', () => {
    const nodes = [{ id: 'a' }, { id: 'b' }];
    const edges = [
      { source: 'a', target: 'b' },
      { source: 'b', target: 'a' },
    ];
    expect(() => topologicalSort(nodes, edges)).toThrow();
  });

  test('testTopologicalSort_singleNode', () => {
    const nodes = [{ id: 'alone' }];
    const result = topologicalSort(nodes, []);
    expect(result).toEqual(['alone']);
  });

  test('testTopologicalSort_emptyGraph', () => {
    const result = topologicalSort([], []);
    expect(result).toEqual([]);
  });

  test('testTopologicalSort_returnsAllNodeIds', () => {
    const nodes = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
    const edges = [
      { source: 'a', target: 'b' },
      { source: 'c', target: 'd' },
    ];
    const result = topologicalSort(nodes, edges);
    expect(result).toHaveLength(4);
    ['a', 'b', 'c', 'd'].forEach((id) => expect(result).toContain(id));
  });

  test('testTopologicalSort_respectsEdgeDirection', () => {
    const nodes = [{ id: 'indicator' }, { id: 'cross' }, { id: 'signal' }];
    const edges = [
      { source: 'indicator', target: 'cross' },
      { source: 'cross', target: 'signal' },
    ];
    const result = topologicalSort(nodes, edges);
    expect(result.indexOf('indicator')).toBeLessThan(result.indexOf('cross'));
    expect(result.indexOf('cross')).toBeLessThan(result.indexOf('signal'));
  });
});
