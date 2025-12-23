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

    // Campos personalizados
    const CAMPO_PROCESSO = "UF_CRM_1758883069045";
    const CAMPO_CLIENTE  = "UF_CRM_1758883087045";
    const CAMPO_COMARCA  = "UF_CRM_1758883106364";
    const CAMPO_ASSUNTO  = "UF_CRM_1758883116821";
    const CAMPO_FASE     = "UF_CRM_1758883132316";
    const CAMPO_ULT_MOV  = "UF_CRM_1758883141020";
    const CAMPO_DATA_UM  = "UF_CRM_1758883152876";

    const url =
      `${BITRIX_WEBHOOK}/crm.deal.list.json` +
      `?filter[${CAMPO_PROCESSO}]=${encodeURIComponent(processo)}` +
      `&select[]=ID` +
      `&select[]=TITLE` +
      `&select[]=STAGE_SEMANTIC_ID` +
      `&select[]=CLOSED` +
      `&select[]=${CAMPO_PROCESSO}` +
      `&select[]=${CAMPO_CLIENTE}` +
      `&select[]=${CAMPO_COMARCA}` +
      `&select[]=${CAMPO_ASSUNTO}` +
      `&select[]=${CAMPO_FASE}` +
      `&select[]=${CAMPO_ULT_MOV}` +
      `&select[]=${CAMPO_DATA_UM}`;

    const response = await fetch(url);
    const data = await response.json();

    const result = (data.result || []).map(deal => ({
      id: deal.ID,
      titulo: deal.TITLE,
      processo: deal[CAMPO_PROCESSO] || "",
      cliente: deal[CAMPO_CLIENTE] || "",
      status:
        deal.STAGE_SEMANTIC_ID === "S"
          ? "Ganhou"
          : deal.STAGE_SEMANTIC_ID === "F"
          ? "Perdeu"
          : "Em andamento",
      fechado: deal.CLOSED === "Y",
      comarca: deal[CAMPO_COMARCA] || "",
      assunto: deal[CAMPO_ASSUNTO] || "",
      fase: deal[CAMPO_FASE] || "",
      ultima_movimentacao: deal[CAMPO_ULT_MOV] || "",
      data_ultima_movimentacao: deal[CAMPO_DATA_UM] || ""
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
