import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.join(root, "public/icons/technologies");
mkdirSync(target, { recursive: true });

// Each entry maps a catalog ID to a local Iconify collection and its technology-specific glyph.
const sources = {
  "aws-ec2": ["logos", "aws-ec2"],
  "aws-s3": ["logos", "aws-s3"],
  "aws-lambda": ["logos", "aws-lambda"],
  "aws-rds": ["logos", "aws-rds"],
  "aws-vpc": ["logos", "aws-vpc"],
  "gcp-compute": ["gcp", "compute-engine"],
  "gcp-storage": ["gcp", "cloud-storage"],
  "gcp-functions": ["gcp", "cloud-functions"],
  "gcp-bigquery": ["gcp", "bigquery"],
  github: ["logos", "github-icon"],
  gitlab: ["logos", "gitlab-icon"],
  kubernetes: ["logos", "kubernetes"],
  docker: ["logos", "docker-icon"],
  terraform: ["logos", "terraform-icon"],
  argocd: ["devicon", "argocd"],
  jenkins: ["logos", "jenkins"],
  backstage: ["simple-icons", "backstage"],
  n8n: ["logos", "n8n-icon"],
  kafka: ["logos", "kafka-icon"],
  redis: ["logos", "redis"],
  postgresql: ["logos", "postgresql"],
  mongodb: ["logos", "mongodb-icon"],
  rabbitmq: ["logos", "rabbitmq-icon"],
  grafana: ["logos", "grafana"],
  prometheus: ["logos", "prometheus"],
  loki: ["devicon", "grafanaloki"],
  opentelemetry: ["logos", "opentelemetry-icon"],
};

for (const [id, [collection, name]] of Object.entries(sources)) {
  const set = JSON.parse(readFileSync(path.join(root, `node_modules/@iconify-json/${collection}/icons.json`), "utf8"));
  const icon = set.icons[name];
  if (!icon) throw new Error(`Missing icon ${collection}:${name}`);
  const width = icon.width ?? set.width ?? 24;
  const height = icon.height ?? set.height ?? 24;
  const left = icon.left ?? 0;
  const top = icon.top ?? 0;
  const body = icon.body.replace(/currentColor/g, id === "backstage" ? "#54a3a7" : "#eef4f4");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${left} ${top} ${width} ${height}">${body}</svg>`;
  writeFileSync(path.join(target, `${id}.svg`), svg);
}
console.log(`Generated ${Object.keys(sources).length} technology icons.`);
