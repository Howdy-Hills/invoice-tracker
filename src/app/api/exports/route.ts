import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  generateBudgetReport,
  generateInvoiceReport,
  generateVendorReport,
} from "@/lib/excel-export";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const projectId = searchParams.get("projectId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const status = searchParams.get("status");

  if (!type || !projectId) {
    return new Response("Missing required parameters", { status: 400 });
  }

  // Auth check
  let orgId: string;
  try {
    const user = await getCurrentUser();
    orgId = user.orgId;
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  // Verify project belongs to org
  const project = await prisma.project.findFirst({
    where: { id: projectId, orgId },
  });
  if (!project) {
    return new Response("Not found", { status: 404 });
  }

  let buffer: Buffer;
  let filename: string;

  try {
    switch (type) {
      case "budget":
        buffer = await generateBudgetReport(orgId, projectId);
        filename = `${project.name} - Budget vs Actual.xlsx`;
        break;
      case "invoices":
        buffer = await generateInvoiceReport(orgId, projectId, {
          dateFrom,
          dateTo,
          status,
        });
        filename = `${project.name} - Invoice Detail.xlsx`;
        break;
      case "vendors":
        buffer = await generateVendorReport(orgId, projectId);
        filename = `${project.name} - Vendor Summary.xlsx`;
        break;
      default:
        return new Response("Invalid export type", { status: 400 });
    }
  } catch (e) {
    console.error("Export generation failed:", e);
    return new Response("Export generation failed", { status: 500 });
  }

  const encodedFilename = encodeURIComponent(filename);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`,
    },
  });
}
