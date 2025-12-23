export default async function handler(req, res) {
  try {
    const { processo } = req.query;

    if (!processo) {
      return res.status(400).json({
        ok: false,
        error: "Número do processo não informado"
      });
    }

    // 🔗 Webhook do Bitrix
    const BITRIX_WEBHOOK =
      "https://angeliadvogados.bitrix24.com.br/rest/13/rmyrytghiumw6jrx";

    // 🧾 Campo personalizado: Número do Processo
    const CAMPO_PROCESSO = "UF_CRM_1758883069045";

    // 🔍 Consulta no Bitrix
    const url =
      `${BITRIX_WEBHOOK}/crm.deal.list.json` +
      `?filter[${CAMPO_PROCESSO}]=${encodeURIComponent(processo)}` +
      `&select[]=ID` +
      `&select[]=TITLE` +
      `&select[]=STAGE_SEMANTIC_ID` +
      `&select[]=CLOSED` +
      `&select[]=UF_CRM_1758883106364` + // Comarca
      `&select[]=UF_CRM_1758883116821` + // Assunto
      `&select[]=UF_CRM_1758883132316` + // Fase processual
      `&select[]=UF_CRM_1758883141020` + // Última movimentação
      `&select[]=UF_CRM_1758883152876`;  // Data última movimentação

    const response = await fetch(url);
    const data = await response.json();

    if (!data.result || data.result.length === 0) {
      return res.status(200).json({
        ok: true,
        total: 0,
        result: []
      });
    }

    // 🔄 Mapeia e normaliza os dados
    const processos = data.result.map(deal => {
      let status = "Em andamento";

      if (deal.STAGE_SEMANTIC_ID === "S") status = "Ganhou";
      else if (deal.STAGE_SEMANTIC_ID === "F") status = "Perdeu";

      return {
        id: deal.ID,
        titulo: deal.TITLE,
        processo,
        status,
        fechado: deal.CLOSED === "Y",
        comarca: deal.UF_CRM_1758883106364 || "",
        assunto: deal.UF_CRM_1758883116821 || "",
        fase: deal.UF_CRM_1758883132316 || "",
        ultima_movimentacao: deal.UF_CRM_1758883141020 || "",
        data_ultima_movimentacao: deal.UF_CRM_1758883152876 || ""
      };
    });

    return res.status(200).json({
      ok: true,
      total: processos.length,
      result: processos
    });

  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: "Erro ao consultar o Bitrix",
      details: err.message
    });
  }
}
