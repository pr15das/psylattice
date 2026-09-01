declare module "mammoth" {
  export function convertToHtml(
    input: { arrayBuffer: ArrayBuffer },
    options?: Record<string, unknown>
  ): Promise<{ value: string; messages: unknown[] }>;
}

declare module "html2pdf.js" {
  const html2pdf: any;
  export default html2pdf;
}

declare module "html-docx-js-typescript" {
  export function asBlob(
    html: string,
    options?: Record<string, unknown>
  ): Promise<Blob | ArrayBuffer | Uint8Array> | Blob | ArrayBuffer | Uint8Array;
}
