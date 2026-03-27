"use client";

import { ScrollArea } from "@/components/ui/ScrollArea";
import { StatusAvatar } from "@/components/ui/StatusAvatar";
import { MOCK_USERS } from "@/lib/mock-data";
import { useTranslation } from "@/lib/i18n";

export function MemberList() {
  const { t } = useTranslation();
  const online = MOCK_USERS.filter((u) => u.status !== "OFFLINE");
  const offline = MOCK_USERS.filter((u) => u.status === "OFFLINE");

  return (
    <div className="flex h-full w-[240px] flex-col bg-background-secondary border-l border-border">
      <ScrollArea className="flex-1 px-2 pt-4">
        <MemberSection
          title={`${t("members.online")} — ${online.length}`}
          users={online}
        />
        <MemberSection
          title={`${t("members.offline")} — ${offline.length}`}
          users={offline}
        />
      </ScrollArea>
    </div>
  );
}

function MemberSection({
  title,
  users,
}: {
  title: string;
  users: typeof MOCK_USERS;
}) {
  return (
    <div className="mb-6">
      <h3 className="mb-2 px-3 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-0.5 px-2">
        {users.map((user) => (
          <button
            key={user.id}
            className="group flex w-full items-center gap-3 rounded-md px-3 py-1.5 transition-colors duration-150 hover:bg-secondary/50 cursor-pointer"
          >
            <StatusAvatar
              src={user.avatarUrl}
              fallback={user.username}
              status={user.status}
              size="md"
            />
            <span className="truncate text-[15px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              {user.username}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
