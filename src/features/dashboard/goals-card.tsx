"use client";

import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { GoalRow } from "@/components/finance/goal-row";
import { useFinance } from "@/components/finance/finance-provider";

export function GoalsCard() {
  const t = useTranslations("dashboard");
  const { goals } = useFinance();
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{t("goals")}</CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("goalsSubtitle", { count: goals.length })}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.slice(0, 3).map((goal) => (
          <GoalRow key={goal.id} goal={goal} />
        ))}
      </CardContent>
    </Card>
  );
}
