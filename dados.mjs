import * as XLSX from "xlsx";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

export default async () => {
  const source = process.env.ONEDRIVE_FILE_URL;
  if (!source) return json({error:"A variável ONEDRIVE_FILE_URL ainda não foi configurada no Netlify."},500);

  try {
    const sep = source.includes("?") ? "&" : "?";
    const url = source + sep + "download=1";
    const resp = await fetch(url, {redirect:"follow"});
    if (!resp.ok) throw new Error(`OneDrive respondeu HTTP ${resp.status}.`);
    const contentType = (resp.headers.get("content-type") || "").toLowerCase();
    const buffer = await resp.arrayBuffer();

    // O arquivo precisa ser um XLSX baixável pelo link público do OneDrive.
    if (buffer.byteLength < 1000) throw new Error("O arquivo retornado pelo OneDrive parece estar vazio ou incompleto.");

    const wb = XLSX.read(buffer, {type:"array", cellDates:true});
    const ws = wb.Sheets["Movimentações"] || wb.Sheets["Movimentacao"] || wb.Sheets["Movimentação"];
    if (!ws) throw new Error('A aba "Movimentações" não foi encontrada na planilha.');

    const values = XLSX.utils.sheet_to_json(ws, {header:1, defval:null, raw:true});
    const headers = values[0] || [];
    const rows = values.slice(1).map(row => ({values:[row]}));

    return json({
      updatedAt: new Date().toISOString(),
      sheet: "Movimentações",
      headers,
      rows
    });
  } catch (err) {
    return json({error:"Não foi possível ler a planilha do OneDrive.", detail:String(err?.message || err)},500);
  }
};
