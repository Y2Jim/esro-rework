/**
 * FIGMA CAPTURE MANIFEST (development tooling only).
 *
 * Serves the capture registry as JSON so the Playwright automation
 * (scripts/capture-figma.mjs) can iterate every registered capture without
 * importing TypeScript. GET /figma-capture/manifest
 */

import { NextResponse } from "next/server"
import {
  CAPTURE_REGISTRY,
  CAPTURE_CATEGORIES,
  CAPTURE_VIEWPORT,
} from "@/lib/figma-capture-registry"

export const dynamic = "force-static"

export function GET() {
  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    viewport: CAPTURE_VIEWPORT,
    categories: CAPTURE_CATEGORIES,
    count: CAPTURE_REGISTRY.length,
    captures: CAPTURE_REGISTRY.map((c) => ({
      slug: c.slug,
      category: c.category,
      folder: c.folder,
      title: c.title,
      description: c.description,
      source: c.source,
      fixture: c.fixture ?? "base",
      render: c.render ?? "shell",
      theme: c.state?.uiTheme ?? "default",
      scroll: c.scroll ?? null,
      animation: c.animation ?? "none",
      filename: c.filename,
      route: `/figma-capture/${c.slug}?capture=1`,
      notes: c.notes ?? null,
    })),
  })
}
