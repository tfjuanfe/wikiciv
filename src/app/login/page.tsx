import AuthForm from "@/components/AuthForm";

export const dynamic = "force-dynamic";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  return (
    <>
      <h1 className="page-title">Log in</h1>
      <p className="lede">Log in to contribute records and accounts.</p>
      <AuthForm mode="login" next={searchParams.next ?? "/"} />
    </>
  );
}
