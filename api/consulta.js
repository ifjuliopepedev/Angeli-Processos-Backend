export default async function handler(req, res) {
  try {
    const BITRIX_WEBHOOK =
      "https://angeliadvogados.bitrix24.com.br/rest/13/rmyrytghiumw6jrx";

    const CAMPO_PROCESSO = "UF_CRM_1758883069045";

    const url =
      `${BITRIX_WEBHOOK}/crm.deal.list.json` +
      `?select[]=ID` +
      `&select[]=TITLE` +
      `&select[]=${CAMPO_PROCESSO}` +
      `&order[ID]=DESC` +
      `&start=0`;

    const response = await fetch(url);
    const data = await response.json();

    const lista = (data.result || []).map(d => ({
      id: d.ID,
      titulo: d.TITLE,
      processo: d[CAMPO_PROCESSO] || ""
    }));

    return res.status(200).json({
      ok: true,
      total: lista.length,
      result: lista
    });

  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
}
