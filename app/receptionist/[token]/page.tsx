"use client";

import { useParams } from "next/navigation";
import ReceptionistAppointmentsPortal from "@/components/ReceptionistAppointmentsPortal";

export default function ReceptionistAppointmentsPage() {
  const params = useParams<{
    token: string;
  }>();

  return (
    <ReceptionistAppointmentsPortal
      token={params.token}
    />
  );
}
