export default async function handler(req, res) {
  try {
    const { processo } = req.query;

    if (!processo) {
      return res.status(400).json({
        ok: false,
        error: "Número do processo não informado"
      });
    }

    const BITRIX_WEBHOOK =
      "https://angeliadvogados.bitrix24.com.br/rest/13/rmyrytghiumw6jrx";

    const CAMPO_PROCESSO = "UF_CRM_1758883069045"; // Número do Processo
    const CAMPO_NOME = "UF_CRM_1758883087045";     // Nome do cliente

    const url =
      `${BITRIX_WEBHOOK}/crm.deal.list.json` +
      `?filter[${CAMPO_PROCESSO}]=${encodeURIComponent(processo)}`;

    const response = await fetch(url);
    const data = await response.json();

    const result = (data.result || []).map(deal => ({
      id: deal.ID,
      titulo: deal.TITLE,
      processo: deal[CAMPO_PROCESSO] || "",
      cliente: deal[CAMPO_NOME] || "",
      status:
        deal.STAGE_SEMANTIC_ID === "S"
          ? "Ganhou"
          : deal.STAGE_SEMANTIC_ID === "F"
          ? "Perdeu"
          : "Em andamento",
      fechado: deal.CLOSED === "Y",
      comarca: deal.UF_CRM_1758883106364 || "",
      assunto: deal.UF_CRM_1758883116821 || "",
      fase: deal.UF_CRM_1758883132316 || "",
      ultima_movimentacao: deal.UF_CRM_1758883141020 || "",
      data_ultima_movimentacao: deal.UF_CRM_1758883152876 || ""
    }));

    return res.status(200).json({
      ok: true,
      total: result.length,
      result
    });

  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: "Erro ao consultar o Bitrix",
      details: err.message
    });
  }
}
