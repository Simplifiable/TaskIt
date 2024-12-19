import { useState } from "react";
import { Card } from "@/components/ui/card";

export default function Dashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Today</h2>
        {/* Task list will go here */}
      </Card>
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Tomorrow</h2>
        {/* Task list will go here */}
      </Card>
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Overdue</h2>
        {/* Task list will go here */}
      </Card>
    </div>
  );
}