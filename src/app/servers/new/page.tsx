import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canHostEvents, canReview } from "@/lib/permissions";
import ServerForm from "@/components/ServerForm";

export const dynamic = "force-dynamic";

export default async function NewServerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/servers/new");
  if (!canHostEvents(user)) redirect("/");

  const isArchivist = canReview(user);
  const submitMode = isArchivist ? "create" : "request";

  return (
    <>
      <nav className="breadcrumbs">
        <Link href="/">Home</Link> /{" "}
        {isArchivist ? "New server" : "Suggest a server"}
      </nav>
      <h1 className="page-title">
        {isArchivist ? "New server" : "Suggest a server"}
      </h1>
      <p className="lede">
        {isArchivist
          ? "Add a Minecraft server whose civilization events this archive will document."
          : "Suggest a Minecraft server for the archive. Include a Discord link so archivists can verify it; they'll review and publish it."}
      </p>
      <ServerForm
        mode="create"
        submitMode={submitMode}
        initial={{ name: "", description: "", discordUrl: "" }}
      />
    </>
  );
}
