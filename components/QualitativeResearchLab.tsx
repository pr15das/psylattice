"use client";

import type { ComponentProps } from "react";
import LegacyQualitativeResearchLab from "./QualitativeResearchLabLegacy";

type Props = ComponentProps<typeof LegacyQualitativeResearchLab>;

export default function QualitativeResearchLab(props: Props) {
  const apiBase =
    props.apiBase && props.apiBase !== "/api/research/qualitative"
      ? props.apiBase
      : "/api/research/qualitative/limited";

  return (
    <LegacyQualitativeResearchLab
      {...props}
      apiBase={apiBase}
      allowImport={false}
    />
  );
}
