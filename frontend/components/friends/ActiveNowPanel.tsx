"use client";

import { ScrollArea } from "@/components/ui/ScrollArea";
import { useTranslation } from "@/lib/i18n";

export function ActiveNowPanel() {
  const { t } = useTranslation();

  return (
    <div className="flex h-full w-[340px] flex-col border-l border-border bg-[#2b2d31]">
      <ScrollArea className="flex-1 px-4 pt-4">
        <h2 className="text-[20px] font-bold text-foreground">
          {t("activeNow.title")}
        </h2>

        <div className="mt-8 flex flex-col items-center text-center">
          <p className="text-[15px] font-semibold text-foreground">
            {t("activeNow.empty")}
          </p>
          <p className="mt-2 max-w-[240px] text-[13px] text-muted-foreground leading-relaxed">
            {t("activeNow.emptyDescription")}
          </p>
        </div>
      </ScrollArea>
    </div>
  );
}
