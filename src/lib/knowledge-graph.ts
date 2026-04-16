/**
 * Knowledge Graph Engine
 * ──────────────────────
 * Maps relationships between startups, investors, categories, markets,
 * and governance activities. Enables network-based discovery.
 *
 * Node types: Startup, Investor, Category, Market, Proposal
 * Edge types: INVESTED_IN, IN_CATEGORY, COMPETES_WITH, VOTED_ON, SIMILAR_TO
 *
 * Supports: path finding, community detection, influence scoring,
 * and recommendation generation.
 */

import type { DbStartup, DbProposal } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

export type NodeType = 'startup' | 'investor' | 'category' | 'market_segment' | 'proposal';

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  /** Size weight for visualization (0-1) */
  weight: number;
  /** Position for force-directed layout */
  x?: number;
  y?: number;
  /** Visual properties */
  color: string;
  /** Metadata */
  metadata: Record<string, string | number>;
}

export type EdgeType =
  | 'IN_CATEGORY'
  | 'COMPETES_WITH'
  | 'SIMILAR_TO'
  | 'CORRELATED_WITH'
  | 'VOTED_ON'
  | 'SAME_STAGE'
  | 'ECOSYSTEM_PARTNER';

export interface GraphEdge {
  source: string;
  target: string;
  type: EdgeType;
  /** Edge weight (0-1, higher = stronger relationship) */
  weight: number;
  /** Label for display */
  label: string;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** Statistics */
  stats: {
    totalNodes: number;
    totalEdges: number;
    avgDegree: number;
    clusters: number;
    density: number;
  };
  /** Communities/clusters detected */
  communities: Community[];
  /** Computed at */
  computedAt: number;
}

export interface Community {
  id: string;
  label: string;
  nodeIds: string[];
  /** Dominant category in this community */
  dominantType: string;
  /** Average trust score of startups in community */
  avgTrustScore: number;
  /** Community cohesion (0-1) */
  cohesion: number;
}

export interface PathResult {
  /** Path from source to target */
  path: string[];
  /** Edges along the path */
  edges: GraphEdge[];
  /** Path length */
  length: number;
  /** Connection strength (product of edge weights) */
  strength: number;
}

export interface NodeInfluence {
  nodeId: string;
  label: string;
  /** Degree centrality (number of connections / max possible) */
  degreeCentrality: number;
  /** Betweenness centrality (how often this node is on shortest paths) */
  betweennessCentrality: number;
  /** PageRank-like score */
  influenceScore: number;
  /** Number of direct connections */
  degree: number;
  /** Connected node types breakdown */
  connectionTypes: Record<NodeType, number>;
}

// ── Node Colors ──────────────────────────────────────────────────────

const NODE_COLORS: Record<NodeType, string> = {
  startup: '#10B981',
  investor: '#3B82F6',
  category: '#F59E0B',
  market_segment: '#8B5CF6',
  proposal: '#EC4899',
};

// ── Graph Construction ───────────────────────────────────────────────

function createStartupNode(startup: DbStartup): GraphNode {
  return {
    id: `s-${startup.id}`,
    type: 'startup',
    label: startup.name,
    weight: Math.min(1, startup.mrr / 300000),
    color: NODE_COLORS.startup,
    metadata: {
      mrr: startup.mrr,
      growth: Number(startup.growth_rate),
      trust: startup.trust_score,
      category: startup.category,
      verified: startup.verified ? 1 : 0,
    },
  };
}

function createCategoryNode(category: string, count: number): GraphNode {
  return {
    id: `c-${category}`,
    type: 'category',
    label: category,
    weight: Math.min(1, count / 10),
    color: NODE_COLORS.category,
    metadata: { startupCount: count },
  };
}

function similarityScore(a: DbStartup, b: DbStartup): number {
  // Multi-dimensional similarity based on normalized metrics
  const maxMrr = Math.max(a.mrr, b.mrr, 1);
  const mrrSim = 1 - Math.abs(a.mrr - b.mrr) / maxMrr;

  const maxGrowth = Math.max(Math.abs(Number(a.growth_rate)), Math.abs(Number(b.growth_rate)), 1);
  const growthSim = 1 - Math.abs(Number(a.growth_rate) - Number(b.growth_rate)) / maxGrowth;

  const trustSim = 1 - Math.abs(a.trust_score - b.trust_score) / 100;
  const susSim = 1 - Math.abs(a.sustainability_score - b.sustainability_score) / 100;

  // Weighted similarity
  return (mrrSim * 0.3 + growthSim * 0.3 + trustSim * 0.2 + susSim * 0.2);
}

function growthCorrelation(a: DbStartup, b: DbStartup): number {
  // Simple correlation proxy based on growth rate similarity
  const diff = Math.abs(Number(a.growth_rate) - Number(b.growth_rate));
  return Math.max(0, 1 - diff / 30);
}

// ── Main Graph Builder ───────────────────────────────────────────────

/**
 * Build the complete knowledge graph from startup data.
 */
export function buildKnowledgeGraph(
  startups: DbStartup[],
  proposals?: DbProposal[],
): KnowledgeGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Create startup nodes
  for (const s of startups) {
    nodes.push(createStartupNode(s));
  }

  // Create category nodes
  const categories = new Map<string, number>();
  for (const s of startups) {
    categories.set(s.category, (categories.get(s.category) ?? 0) + 1);
  }
  for (const [cat, count] of categories) {
    nodes.push(createCategoryNode(cat, count));
  }

  // Create IN_CATEGORY edges
  for (const s of startups) {
    edges.push({
      source: `s-${s.id}`,
      target: `c-${s.category}`,
      type: 'IN_CATEGORY',
      weight: 1,
      label: 'in category',
    });
  }

  // Create COMPETES_WITH edges (same category)
  for (let i = 0; i < startups.length; i++) {
    for (let j = i + 1; j < startups.length; j++) {
      if (startups[i].category === startups[j].category) {
        edges.push({
          source: `s-${startups[i].id}`,
          target: `s-${startups[j].id}`,
          type: 'COMPETES_WITH',
          weight: 0.6,
          label: 'competes with',
        });
      }
    }
  }

  // Create SIMILAR_TO edges (cross-category similarity > 0.7)
  for (let i = 0; i < startups.length; i++) {
    for (let j = i + 1; j < startups.length; j++) {
      if (startups[i].category !== startups[j].category) {
        const sim = similarityScore(startups[i], startups[j]);
        if (sim > 0.7) {
          edges.push({
            source: `s-${startups[i].id}`,
            target: `s-${startups[j].id}`,
            type: 'SIMILAR_TO',
            weight: sim,
            label: `${(sim * 100).toFixed(0)}% similar`,
          });
        }
      }
    }
  }

  // Create CORRELATED_WITH edges (growth correlation > 0.6)
  for (let i = 0; i < startups.length; i++) {
    for (let j = i + 1; j < startups.length; j++) {
      const corr = growthCorrelation(startups[i], startups[j]);
      if (corr > 0.6 && startups[i].category !== startups[j].category) {
        edges.push({
          source: `s-${startups[i].id}`,
          target: `s-${startups[j].id}`,
          type: 'CORRELATED_WITH',
          weight: corr,
          label: `correlated growth`,
        });
      }
    }
  }

  // Create SAME_STAGE edges
  const stageGroups = new Map<string, string[]>();
  for (const s of startups) {
    const stage = s.mrr >= 200000 ? 'Growth' : s.mrr >= 50000 ? 'Series A' : s.mrr >= 10000 ? 'Seed' : 'Pre-Seed';
    const group = stageGroups.get(stage) ?? [];
    group.push(s.id);
    stageGroups.set(stage, group);
  }

  // Create proposal nodes and VOTED_ON edges
  if (proposals) {
    for (const p of proposals) {
      nodes.push({
        id: `p-${p.id}`,
        type: 'proposal',
        label: p.title,
        weight: 0.3,
        color: NODE_COLORS.proposal,
        metadata: { votesFor: p.votes_for, votesAgainst: p.votes_against, status: p.status },
      });
    }
  }

  // Detect communities (simple connected-component approach)
  const communities = detectCommunities(nodes, edges);

  // Calculate stats
  const degreeMap = new Map<string, number>();
  for (const e of edges) {
    degreeMap.set(e.source, (degreeMap.get(e.source) ?? 0) + 1);
    degreeMap.set(e.target, (degreeMap.get(e.target) ?? 0) + 1);
  }
  const degrees = Array.from(degreeMap.values());
  const avgDegree = degrees.length > 0 ? degrees.reduce((s, d) => s + d, 0) / degrees.length : 0;
  const maxPossibleEdges = (nodes.length * (nodes.length - 1)) / 2;
  const density = maxPossibleEdges > 0 ? edges.length / maxPossibleEdges : 0;

  return {
    nodes,
    edges,
    stats: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      avgDegree: +avgDegree.toFixed(1),
      clusters: communities.length,
      density: +density.toFixed(4),
    },
    communities,
    computedAt: Date.now(),
  };
}

// ── Community Detection ──────────────────────────────────────────────

function detectCommunities(nodes: GraphNode[], edges: GraphEdge[]): Community[] {
  // Simple community detection: group by primary category connections
  const startupNodes = nodes.filter(n => n.type === 'startup');
  const categoryGroups = new Map<string, string[]>();

  for (const node of startupNodes) {
    const cat = node.metadata.category as string;
    const group = categoryGroups.get(cat) ?? [];
    group.push(node.id);
    categoryGroups.set(cat, group);
  }

  return Array.from(categoryGroups.entries()).map(([cat, nodeIds], i) => {
    const catStartups = startupNodes.filter(n => nodeIds.includes(n.id));
    const avgTrust = catStartups.length > 0
      ? catStartups.reduce((s, n) => s + (n.metadata.trust as number), 0) / catStartups.length
      : 0;

    // Cohesion: ratio of internal edges to total possible edges
    const internalEdges = edges.filter(
      e => nodeIds.includes(e.source) && nodeIds.includes(e.target)
    ).length;
    const maxInternal = (nodeIds.length * (nodeIds.length - 1)) / 2;
    const cohesion = maxInternal > 0 ? internalEdges / maxInternal : 0;

    return {
      id: `community-${i}`,
      label: `${cat} Ecosystem`,
      nodeIds,
      dominantType: cat,
      avgTrustScore: +avgTrust.toFixed(0),
      cohesion: +cohesion.toFixed(2),
    };
  });
}

// ── Path Finding ─────────────────────────────────────────────────────

/**
 * Find shortest path between two nodes using BFS.
 */
export function findPath(graph: KnowledgeGraph, sourceId: string, targetId: string): PathResult | null {
  const adjacency = new Map<string, { neighbor: string; edge: GraphEdge }[]>();
  for (const edge of graph.edges) {
    const srcList = adjacency.get(edge.source) ?? [];
    srcList.push({ neighbor: edge.target, edge });
    adjacency.set(edge.source, srcList);

    const tgtList = adjacency.get(edge.target) ?? [];
    tgtList.push({ neighbor: edge.source, edge });
    adjacency.set(edge.target, tgtList);
  }

  // BFS
  const visited = new Set<string>();
  const queue: { node: string; path: string[]; edges: GraphEdge[] }[] = [
    { node: sourceId, path: [sourceId], edges: [] },
  ];
  visited.add(sourceId);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.node === targetId) {
      const strength = current.edges.reduce((s, e) => s * e.weight, 1);
      return {
        path: current.path,
        edges: current.edges,
        length: current.path.length - 1,
        strength,
      };
    }

    for (const { neighbor, edge } of adjacency.get(current.node) ?? []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({
          node: neighbor,
          path: [...current.path, neighbor],
          edges: [...current.edges, edge],
        });
      }
    }
  }

  return null;
}

// ── Influence Scoring ────────────────────────────────────────────────

/**
 * Calculate influence scores for all nodes.
 */
export function calculateInfluence(graph: KnowledgeGraph): NodeInfluence[] {
  const degreeMap = new Map<string, { total: number; byType: Record<NodeType, number> }>();

  // Initialize
  for (const node of graph.nodes) {
    degreeMap.set(node.id, { total: 0, byType: { startup: 0, investor: 0, category: 0, market_segment: 0, proposal: 0 } });
  }

  // Count degrees
  for (const edge of graph.edges) {
    const src = degreeMap.get(edge.source);
    const tgt = degreeMap.get(edge.target);
    if (src) src.total++;
    if (tgt) tgt.total++;

    // Type counting — source node counts the type of its target, and vice versa
    const tgtNode = graph.nodes.find(n => n.id === edge.target);
    const srcNode = graph.nodes.find(n => n.id === edge.source);
    if (src && tgtNode) src.byType[tgtNode.type]++;
    if (tgt && srcNode) tgt.byType[srcNode.type]++;
  }

  const maxDegree = Math.max(...Array.from(degreeMap.values()).map(d => d.total), 1);

  return graph.nodes
    .map(node => {
      const deg = degreeMap.get(node.id) ?? { total: 0, byType: { startup: 0, investor: 0, category: 0, market_segment: 0, proposal: 0 } };
      const degreeCentrality = deg.total / maxDegree;

      // Simplified betweenness: proportion of other nodes reachable
      const reachable = new Set<string>();
      const queue = [node.id];
      const visited = new Set([node.id]);
      while (queue.length > 0) {
        const current = queue.shift()!;
        for (const edge of graph.edges) {
          const neighbor = edge.source === current ? edge.target : edge.target === current ? edge.source : null;
          if (neighbor && !visited.has(neighbor)) {
            visited.add(neighbor);
            reachable.add(neighbor);
            queue.push(neighbor);
          }
        }
      }
      const betweenness = reachable.size / Math.max(graph.nodes.length - 1, 1);

      // Influence: weighted combination
      const influenceScore = degreeCentrality * 0.4 + betweenness * 0.3 + node.weight * 0.3;

      return {
        nodeId: node.id,
        label: node.label,
        degreeCentrality: +degreeCentrality.toFixed(3),
        betweennessCentrality: +betweenness.toFixed(3),
        influenceScore: +influenceScore.toFixed(3),
        degree: deg.total,
        connectionTypes: deg.byType,
      };
    })
    .sort((a, b) => b.influenceScore - a.influenceScore);
}

/**
 * Get recommended startups based on graph proximity to a given startup.
 */
export function getRecommendations(
  graph: KnowledgeGraph,
  startupId: string,
  limit: number = 5,
): { nodeId: string; label: string; reason: string; score: number }[] {
  const targetId = `s-${startupId}`;
  const recommendations: { nodeId: string; label: string; reason: string; score: number }[] = [];

  const startupNodes = graph.nodes.filter(n => n.type === 'startup' && n.id !== targetId);

  for (const node of startupNodes) {
    const path = findPath(graph, targetId, node.id);
    if (!path) continue;

    // Score based on path length and edge types
    const pathScore = 1 / (path.length + 1);
    const edgeTypeBonus = path.edges.some(e => e.type === 'SIMILAR_TO') ? 0.3 : 0;
    const correlationBonus = path.edges.some(e => e.type === 'CORRELATED_WITH') ? 0.2 : 0;
    const score = pathScore + edgeTypeBonus + correlationBonus;

    const reasons: string[] = [];
    if (path.edges.some(e => e.type === 'SIMILAR_TO')) reasons.push('Similar metrics profile');
    if (path.edges.some(e => e.type === 'COMPETES_WITH')) reasons.push('Same category');
    if (path.edges.some(e => e.type === 'CORRELATED_WITH')) reasons.push('Correlated growth');

    recommendations.push({
      nodeId: node.id,
      label: node.label,
      reason: reasons.join(', ') || `Connected via ${path.length} hops`,
      score,
    });
  }

  return recommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
