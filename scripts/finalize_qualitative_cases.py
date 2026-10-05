from pathlib import Path

legacy = Path("components/QualitativeResearchLabLegacy.tsx")
public = Path("components/QualitativeResearchLab.tsx")

text = legacy.read_text()

old_api = '  apiBase = "/api/research/qualitative",'
new_api = '  apiBase = "/api/research/qualitative/limited",'
if old_api not in text:
    raise SystemExit("Could not find the default qualitative apiBase")
text = text.replace(old_api, new_api, 1)

old_import = '  allowImport = true,'
new_import = '  allowImport = false,'
if old_import not in text:
    raise SystemExit("Could not find the default allowImport setting")
text = text.replace(old_import, new_import, 1)

public.write_text(text)
print("Finalized the integrated Qualitative Lab in the original component path.")
