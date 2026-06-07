import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canReview } from "@/lib/permissions";
import ServerForm from "@/components/ServerForm";

export const dynamic = "force-dynamic";

export default async function NewServerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/servers/new");
  if (!canReview(user)) redirect("/");

  return (
    <>
      <nav className="breadcrumbs">
        <Link href="/">Home</Link> / New server
      </nav>
      <h1 className="page-title">New server</h1>
      <p className="lede">
        Add a Minecraft server whose civilization events this archive will
        document.
      </p>
      <ServerForm mode="create" initial={{ name: "", description: "" }} />
    </>
  );
}
