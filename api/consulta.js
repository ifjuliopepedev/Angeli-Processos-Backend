export default async function handler(req, res) {
  // Habilita CORS
  res.setHeader("Access-Control-Allow-Origin", "*"); // permite qualquer domínio
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Responde a requisições OPTIONS (preflight)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

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
      `&select[]=${CAMPO_DATA_UM}` +
      `&order[DATE_MODIFY]=DESC`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.result || data.result.length === 0) {
      return res.status(200).json({ ok: true, result: null });
    }

    // Escolhe o processo mais relevante
    let deal =
      data.result.find(d => d.CLOSED === "N") ||
      data.result[0];

    const status =
      deal.STAGE_SEMANTIC_ID === "S"
        ? "Ganhou"
        : deal.STAGE_SEMANTIC_ID === "F"
        ? "Perdeu"
        : "Em andamento";

    return res.status(200).json({
      ok: true,
      result: {
        processo: deal[CAMPO_PROCESSO] || "",
        cliente: deal[CAMPO_CLIENTE] || "",
        status,
        fechado: deal.CLOSED === "Y",
        comarca: deal[CAMPO_COMARCA] || "",
        assunto: deal[CAMPO_ASSUNTO] || "",
        fase: deal[CAMPO_FASE] || "",
        ultima_movimentacao: deal[CAMPO_ULT_MOV] || "",
        data_ultima_movimentacao: deal[CAMPO_DATA_UM] || ""
      }
    });

  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: "Erro ao consultar o Bitrix",
      details: err.message
    });
  }
}
