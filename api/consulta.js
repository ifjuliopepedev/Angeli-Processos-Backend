export default async function handler(req, res) {
  // Habilita CORS
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
    const CAMPO_PROCESSO = "UF_CRM_1758883069045";
    const CAMPO_COMARCA  = "UF_CRM_1758883106364";
    const CAMPO_ASSUNTO  = "UF_CRM_1758883116821";
    const CAMPO_ULT_MOV  = "UF_CRM_1758883141020";
    const CAMPO_DATA_UM  = "UF_CRM_1758883152876";

    // 1️⃣ Busca o deal pelo número do processo
    const urlDeal = `${BITRIX_WEBHOOK}/crm.deal.list.json` +
      `?filter[${CAMPO_PROCESSO}]=${encodeURIComponent(processo)}` +
      `&select[]=ID` +
      `&select[]=STAGE_ID` +
      `&select[]=PIPELINE_ID` +
      `&select[]=STAGE_SEMANTIC_ID` +
      `&select[]=CLOSED` +
      `&select[]=${CAMPO_PROCESSO}` +
      `&select[]=${CAMPO_COMARCA}` +
      `&select[]=${CAMPO_ASSUNTO}` +
      `&select[]=${CAMPO_ULT_MOV}` +
      `&select[]=${CAMPO_DATA_UM}` +
      `&select[]=CONTACT_ID` +
      `&order[DATE_MODIFY]=DESC`;

    const responseDeal = await fetch(urlDeal);
    const dataDeal = await responseDeal.json();

    if (!dataDeal.result || dataDeal.result.length === 0) {
      return res.status(200).json({ ok: true, result: null });
    }

    // Escolhe o deal mais relevante
    let deal = dataDeal.result.find(d => d.CLOSED === "N") || dataDeal.result[0];

    // 2️⃣ Pega o contato associado (nome do cliente)
    let nomeCliente = "";
    if (deal.CONTACT_ID) {
      const urlContact = `${BITRIX_WEBHOOK}/crm.contact.get.json?id=${deal.CONTACT_ID}`;
      const responseContact = await fetch(urlContact);
      const dataContact = await responseContact.json();
      if (dataContact.result) {
        const contato = dataContact.result;
        nomeCliente = `${contato.NAME || ""} ${contato.LAST_NAME || ""}`.trim();
      }
    }

    // 3️⃣ Pega todas as fases do pipeline real do deal
    const pipelineId = deal.PIPELINE_ID || "C5"; // fallback para C5
    const urlStages = `${BITRIX_WEBHOOK}/crm.deal.stage.list.json?pipeline_id=${pipelineId}`;
    const responseStages = await fetch(urlStages);
    const dataStages = await responseStages.json();

    let stagesMap = {};
    if (dataStages.result) {
      dataStages.result.forEach(stage => {
        stagesMap[stage.ID] = stage.NAME; // ID -> nome completo da fase
      });
    }

    // 4️⃣ Converte STAGE_ID em nome legível
    const faseLegivel = stagesMap[deal.STAGE_ID] || deal.STAGE_ID;

    // 5️⃣ Converte STAGE_SEMANTIC_ID em status
    const status = deal.STAGE_SEMANTIC_ID === "S"
      ? "Ganhou"
      : deal.STAGE_SEMANTIC_ID === "F"
      ? "Perdeu"
      : "Em andamento";

    return res.status(200).json({
      ok: true,
      result: {
        processo: deal[CAMPO_PROCESSO] || "",
        cliente: nomeCliente,
        status,
        fechado: deal.CLOSED === "Y",
        comarca: deal[CAMPO_COMARCA] || "",
        assunto: deal[CAMPO_ASSUNTO] || "",
        fase: faseLegivel, // agora retorna a fase correta do Kanban
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
