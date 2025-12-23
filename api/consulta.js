export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

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

    // Mapeamento completo de IDs para nomes legíveis
    const faseMap = {
      "C5:NEW": "Ajuizado/Aguardando despacho",
      "C5:PREPARATION": "Audiência agendada",
      "C5:UC_EW0CY9": "Acordo - Aguardando cumprir",
      "C5:PREPAYMENT_INVOICE": "Aguardando contestação/Impug...",
      "C5:EXECUTING": "Concluso para sentença",
      "C5:FINAL_INVOICE": "Sentença proferida",
      "C5:UC_LGL7VU": "Cumprimento de sentença",
      "C5:UC_7ODNO2": "Aguardando pagamento/Cumpr...",
      "C5:UC_47AKQC": "FASE RECURSAL",
      "C5:WON": "Arquivado"
    };

    const url =
      `${BITRIX_WEBHOOK}/crm.deal.list.json` +
      `?filter[${CAMPO_PROCESSO}]=${encodeURIComponent(processo)}` +
      `&select[]=ID` +
      `&select[]=TITLE` +
      `&select[]=STAGE_ID` +
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

    const deal = data.result.find(d => d.CLOSED === "N") || data.result[0];

    const status =
      deal.STAGE_SEMANTIC_ID === "S"
        ? "Ganhou"
        : deal.STAGE_SEMANTIC_ID === "F"
        ? "Perdeu"
        : "Em andamento";

    const faseLegivel = faseMap[deal.STAGE_ID] || deal.STAGE_ID;

    return res.status(200).json({
      ok: true,
      result: {
        processo: deal[CAMPO_PROCESSO] || "",
        cliente: deal[CAMPO_CLIENTE] || "",
        status,
        fechado: deal.CLOSED === "Y",
        comarca: deal[CAMPO_COMARCA] || "",
        assunto: deal[CAMPO_ASSUNTO] || "",
        fase: faseLegivel,
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
