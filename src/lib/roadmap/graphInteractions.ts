import type { MasterEdge, MasterNode } from "./types";

export type DomainFilter = "all" | keyof MasterNode["relevance"];

interface DependencyNeighborhood {
  prerequisiteIds: Set<string>;
  unlockIds: Set<string>;
}

function collectConnectedIds(
  startId: string,
  edges: MasterEdge[],
  direction: "upstream" | "downstream"
): Set<string> {
  const connectedIds = new Set<string>();
  const queue = [startId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    for (const edge of edges) {
      const matches = direction === "upstream" ? edge.to === currentId : edge.from === currentId;
      if (!matches) continue;

      const connectedId = direction === "upstream" ? edge.from : edge.to;
      if (connectedIds.has(connectedId)) continue;

      connectedIds.add(connectedId);
      queue.push(connectedId);
    }
  }

  return connectedIds;
}

export function getDependencyNeighborhood(
  nodeId: string,
  edges: MasterEdge[]
): DependencyNeighborhood {
  return {
    prerequisiteIds: collectConnectedIds(nodeId, edges, "upstream"),
    unlockIds: collectConnectedIds(nodeId, edges, "downstream"),
  };
}

function normalizeSearch(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function findNodeIdBySearch(search: string, nodes: MasterNode[]): string | null {
  const normalizedSearch = normalizeSearch(search);
  if (!normalizedSearch) return null;

  return nodes.find((node) => normalizeSearch(node.title).includes(normalizedSearch))?.id ?? null;
}

export function isRelevantToDomain(node: MasterNode, domain: DomainFilter): boolean {
  return domain === "all" || node.relevance[domain] >= 0.55;
}
