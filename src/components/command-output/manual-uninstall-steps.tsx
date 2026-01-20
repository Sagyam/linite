'use client';

import { FileText, AlertCircle } from 'lucide-react';

interface ManualUninstallStep {
  appName: string;
  instructions: string;
}

interface ManualUninstallStepsProps {
  steps: ManualUninstallStep[];
}

export function ManualUninstallSteps({
  steps,
}: ManualUninstallStepsProps) {
  if (steps.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="font-medium flex items-center gap-2">
        <FileText className="w-4 h-4" />
        Manual Uninstall Required
      </h4>
      <div className="space-y-3">
        {steps.map((step, i) => (
          <div
            key={i}
            className="bg-amber-500/10 border border-amber-500/20 rounded-md p-4"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-medium text-amber-900 dark:text-amber-100">
                  {step.appName}
                </p>
                <div className="text-sm text-amber-800 dark:text-amber-200 whitespace-pre-wrap">
                  {step.instructions}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
