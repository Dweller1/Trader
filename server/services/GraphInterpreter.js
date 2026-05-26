/**
 * Graph utilities for the visual strategy builder.
 * topologicalSort implements Kahn's algorithm on the node/edge graph.
 */

/**
 * @param {Array<{id: string}>} nodes
 * @param {Array<{source: string, target: string}>} edges
 * @returns {string[]} ordered array of node ids
 * @throws {Error} if the graph contains a cycle
 */
function topologicalSort(nodes, edges) {
  const nodeIds = nodes.map((n) => n.id);
  const inDegree = {};
  const adj = {};

  for (const id of nodeIds) {
    inDegree[id] = 0;
    adj[id] = [];
  }

  for (const edge of edges) {
    if (!adj[edge.source]) adj[edge.source] = [];
    adj[edge.source].push(edge.target);
    inDegree[edge.target] = (inDegree[edge.target] || 0) + 1;
  }

  const queue = nodeIds.filter((id) => inDegree[id] === 0);
  const result = [];

  while (queue.length > 0) {
    const node = queue.shift();
    result.push(node);

    for (const neighbor of adj[node] || []) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
      }
    }
  }

  if (result.length !== nodeIds.length) {
    throw new Error('Graph contains a cycle — cannot perform topological sort');
  }

  return result;
}

module.exports = { topologicalSort };
