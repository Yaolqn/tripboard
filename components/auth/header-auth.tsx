"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogIn, LogOut, MapPin, Plus, Settings as SettingsIcon } from "lucide-react";
import { useSession } from "@/components/auth/session-provider";
import { signOut } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function Avatar({ url, name }: { url?: string | null; name?: string | null }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className="size-7 rounded-full border bg-muted object-cover"
      />
    );
  }
  return (
    <span className="flex size-7 items-center justify-center rounded-full border bg-secondary text-xs font-semibold text-secondary-foreground">
      {initial}
    </span>
  );
}

/** Header auth controls: "Log in" for guests, avatar menu for users. */
export function HeaderAuth() {
  const { user } = useSession();
  const { t } = useI18n();
  const router = useRouter();

  if (!isSupabaseConfigured()) return null;

  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <LogIn className="size-3.5" />
        {t("logIn")}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Link
        href="/my-trips"
        className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <MapPin className="size-3.5" />
        {t("myTrips")}
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Account"
            className="rounded-full transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Avatar
              url={user.user_metadata?.avatar_url as string | undefined}
              name={(user.user_metadata?.full_name as string) ?? user.email}
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            {user.email}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => router.push("/my-trips")}>
            <MapPin />
            {t("myTrips")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => router.push("/settings")}>
            <SettingsIcon />
            {t("settings")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={async () => {
              await signOut();
              toast.success(t("signedOut"));
              router.push("/");
              router.refresh();
            }}
          >
            <LogOut />
            {t("signOut")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/** Compact "Create trip" button used in headers. */
export function CreateTripButton({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <Button asChild size="sm" className={className}>
      <Link href="/new">
        <Plus />
        {t("createTrip")}
      </Link>
    </Button>
  );
}
