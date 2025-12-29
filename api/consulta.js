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

    const BITRIX_WEBHOOK = "https://angeliadvogados.bitrix24.com.br/rest/13/rmyrytghiumw6jrx";

    // Campos do deal
    const CAMPO_PROCESSO = "UF_CRM_1758883069045";
    const CAMPO_CLIENTE  = "UF_CRM_1758883087045";
    const CAMPO_COMARCA  = "UF_CRM_1758883106364";
    const CAMPO_ASSUNTO  = "UF_CRM_1758883116821";
    const CAMPO_FASE     = "UF_CRM_1758883132316";
    const CAMPO_ULT_MOV  = "UF_CRM_1758883141020";
    const CAMPO_DATA_UM  = "UF_CRM_1758883152876";

    // Mapeamento de fases
    const faseMap = {
      "C5:NEW": "Ação protocolada / Aguardando decisão inicial",
      "C5:PREPARATION": "Audiência agendada",
      "C5:UC_EW0CY9": "Acordo fechado",
      "C5:PREPAYMENT_INVOICE": "Aguardando defesa da requerida",
      "C5:EXECUTING": "Aguardando sentença (decisão do juiz)",
      "C5:FINAL_INVOICE": "Sentença proferida",
      "C5:UC_LGL7VU": "Fase de cumprimento de sentença",
      "C5:UC_7ODNO2": "Aguardando pagamento da condenação",
      "C5:UC_47AKQC": "Fase recursal",
      "C5:WON": "Processo arquivado / encerrado"
    };

    // Consulta os deals pelo processo
    const url = `${BITRIX_WEBHOOK}/crm.deal.list.json` +
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
        cliente: deal[CAMPO_CLIENTE] || "", // já pega o nome direto do campo de texto
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
