"use client";

import { useState } from "react";
import { useVoters } from "@/lib/voter-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Info,
  Database,
} from "lucide-react";

export function UploadSection() {
  const { voters } = useVoters();

  return (
    <div className="flex flex-col gap-4">
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-card-foreground flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            Data Source
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <Database className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Server API</p>
                <p className="text-xs text-muted-foreground">
                  All data is loaded from the FastAPI backend
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              Active
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  CSV Upload Disabled
                </p>
                <p className="text-blue-700 dark:text-blue-300 mt-1">
                  CSV upload functionality has been disabled. All voter data is now managed exclusively through the server API to ensure data consistency and integrity.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{voters.length}</p>
              <p className="text-xs text-muted-foreground">Loaded Voters</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">API</p>
              <p className="text-xs text-muted-foreground">Data Source</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
