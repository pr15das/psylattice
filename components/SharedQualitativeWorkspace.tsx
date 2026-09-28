"use client";

import QualitativeResearchLab from "@/components/QualitativeResearchLab";

type Props = {
  studyId: string;
  studyTitle: string;
  permissions: Record<string, boolean>;
};

export default function SharedQualitativeWorkspace({
  studyId,
  studyTitle,
  permissions,
}: Props) {
  const canEdit = permissions?.can_edit === true;
  const canReview = permissions?.can_review === true;
  const canManageStructure =
    permissions?.can_manage_qualitative_structure === true && canEdit;
  const canExport = permissions?.exports === true;

  return (
    <div className="shared-qualitative-workspace min-w-0">
      <QualitativeResearchLab
        initialStudyId={studyId}
        lockedStudyId={studyId}
        lockedStudyTitle={studyTitle}
        apiBase="/api/research/shared-qualitative"
        importApiBase="/api/research/shared-qualitative/import"
        exportApiBase="/api/research/shared-qualitative/export"
        readOnly={!canEdit}
        allowImport={canEdit}
        allowExport={canExport}
        sharedMode
        canReview={canReview}
        canManageStructure={canManageStructure}
      />
    </div>
  );
}
