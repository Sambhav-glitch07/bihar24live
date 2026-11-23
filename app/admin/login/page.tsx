import AdminLoginForm from "@/components/AdminLoginForm";

type Props = { searchParams: Promise<{ error?: string | string[]; setup?: string | string[] }> };
export default async function AdminLoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const setup = Array.isArray(params.setup) ? params.setup[0] : params.setup;
  return <AdminLoginForm ownerError={error === "not-owner"} setupMissing={setup === "missing"} />;
}
