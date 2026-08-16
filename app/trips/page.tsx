import { redirect } from "next/navigation";

/** V0.1 route — kept as a redirect so old links keep working. */
export default function TripsRedirect() {
  redirect("/my-trips");
}
