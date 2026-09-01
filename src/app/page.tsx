import { redirect } from "next/navigation";

import { getDefaultRoute } from "@/lib/navigation";
import { getTenantConfig } from "@/lib/tenant-config";

export default function Home() {
  redirect(getDefaultRoute(getTenantConfig()));
}
