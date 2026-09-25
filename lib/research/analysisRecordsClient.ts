export async function loadPersistedAnalysisRecords<T>(
  studyId: string,
): Promise<T[]> {
  const response = await fetch(
    `/api/research/analysis-records?study_id=${encodeURIComponent(studyId)}`,
    {
      method: "GET",
      cache: "no-store",
      credentials: "include",
    },
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || "Saved analysis records could not be loaded.");
  }

  return Array.isArray(payload.records) ? (payload.records as T[]) : [];
}

export async function persistAnalysisRecord(
  studyId: string,
  record: unknown,
) {
  const response = await fetch("/api/research/analysis-records", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ studyId, record }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || "The analysis record could not be synced.");
  }

  return payload.persisted;
}

export async function deletePersistedAnalysisRecord(
  studyId: string,
  clientRecordId: string,
) {
  const response = await fetch(
    `/api/research/analysis-records?study_id=${encodeURIComponent(
      studyId,
    )}&client_record_id=${encodeURIComponent(clientRecordId)}`,
    {
      method: "DELETE",
      cache: "no-store",
      credentials: "include",
    },
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || "The synced analysis record could not be deleted.");
  }
}
