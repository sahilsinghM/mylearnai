import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getMasterRoadmap } from "@/lib/roadmap/masterRoadmap";
import { createClient } from "@/lib/supabase/server";
import type { DepthLevel } from "@/lib/roadmap/types";
import "../roadmap.css";

const DEPTH_LEVELS: DepthLevel[] = ["awareness", "working", "fluent", "expert"];

async function getNode(id: string) {
  const data = await getMasterRoadmap();
  return {
    data,
    node: data.nodes.find((node) => node.id === id),
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { node } = await getNode(id);
  if (!node) return {};

  return {
    title: `${node.title} — AI Engineering Roadmap`,
    description: node.blurb,
  };
}

export default async function RoadmapNodePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data, node } = await getNode(id);
  if (!node) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const nodeMap = new Map(data.nodes.map((item) => [item.id, item]));
  const prerequisites = data.edges.filter((edge) => edge.to === id).map((edge) => nodeMap.get(edge.from)).filter(Boolean);
  const unlocks = data.edges.filter((edge) => edge.from === id).map((edge) => nodeMap.get(edge.to)).filter(Boolean);
  const project = node.projects.find((item) => item.depthLevel === "working") ?? node.projects[0];

  return (
    <main className="mr-node-page">
      <Link href={`/roadmap#${node.id}`} className="mr-node-page-back">
        <ArrowLeft size={14} /> Back to roadmap
      </Link>
      <div className="mr-panel-eyebrow">Master Node</div>
      <h1>{node.title}</h1>
      <p className="mr-panel-blurb">{node.blurb}</p>

      <section>
        <h2>Depth levels</h2>
        <div className="mr-depth-list">
          {DEPTH_LEVELS.map((depth, index) => (
            <div key={depth} className="mr-depth-item">
              <div><strong>{depth}</strong><span>{node.hours[index]}h</span></div>
              <p>{node.depth?.[depth] ?? `${node.blurb} Build a focused ${depth} proof project.`}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Prerequisites</h2>
        <div className="mr-panel-links">
          {prerequisites.length === 0 && <span>None</span>}
          {prerequisites.map((item) => item && <Link key={item.id} href={`/roadmap/${item.id}`}>{item.title}</Link>)}
        </div>
      </section>

      <section>
        <h2>Unlocks</h2>
        <div className="mr-panel-links">
          {unlocks.length === 0 && <span>None</span>}
          {unlocks.map((item) => item && <Link key={item.id} href={`/roadmap/${item.id}`}>{item.title}</Link>)}
        </div>
      </section>

      {project && (
        <section>
          <h2>Working-depth project</h2>
          <div className="mr-panel-card">
            <strong>{project.title}</strong>
            <p>{project.description}</p>
            {project.deliverable && <small>{project.deliverable}</small>}
          </div>
        </section>
      )}

      <section>
        <h2>Resources</h2>
        <div className="mr-resource-list">
          {node.resources.map((resource) => (
            <a key={resource.id} href={resource.url} target="_blank" rel="noreferrer">
              <span>{resource.title}</span>
              <small>{resource.depthLevel}{resource.estimatedMinutes ? ` · ${resource.estimatedMinutes}m` : ""}</small>
            </a>
          ))}
        </div>
      </section>

      {user ? (
        <Link href={`/tutor?node=${node.id}`} className="mr-panel-cta">
          Start tutoring on this node <ArrowRight size={14} />
        </Link>
      ) : (
        <Link href={`/sign-up?from=roadmap&node=${node.id}`} className="mr-panel-cta">
          Personalize this for me <ArrowRight size={14} />
        </Link>
      )}
    </main>
  );
}
