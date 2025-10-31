// 'use client';

import { ChartNoAxesColumn } from "lucide-react";
import { Card } from "@/components/Card";

export default function Emptystate() {
  return (
    <>
      <Card className="sm:mx-auto sm:max-w-lg rounded-xl">
        <h3 className="text-tremor-default text-tremor-content ">
          Recent Notifications
        </h3>
        <p className="text-tremor-metric font-semibold text-tremor-content-strong">
          0
        </p>
        <div className="mt-4 flex h-44 items-center justify-center rounded-lg border border-gray-300 p-4">
          <div className="text-center">
            <ChartNoAxesColumn
              className="mx-auto h-7 w-7 text-tremor-content-subtle"
              aria-hidden={true}
            />
            <p className="mt-2 text-sm font-medium text-tremor-content-strong">
              No data to show
            </p>
            {/* <p className="text-sm text-tremor-content">
              May take 24 hours for data to load
            </p> */}
          </div>
        </div>
      </Card>
    </>
  );
}
