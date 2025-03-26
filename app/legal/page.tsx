// app/legal/page.tsx
import { redirect } from "next/navigation";

export default function Legal({ searchParams }: { searchParams: { page?: string } }) {
  const page = searchParams.page === "terms" ? "terms" : "privacy";
  redirect(`/${page}.html`);
}