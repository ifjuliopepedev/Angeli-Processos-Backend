export default async function handler(req, res) {
  // Habilita CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const BITRIX_WEBHOOK = "https://angeliadvogados.bitrix24.com.br/rest/13/rmyrytghiumw6jrx";

    // 1️⃣ Pega todos os pipelines
    const urlPipelines = `${BITRIX_WEBHOOK}/crm.deal.pipeline.list.json`;
    const responsePipelines = await fetch(urlPipelines);
    const dataPipelines = await responsePipelines.json();

    if (!dataPipelines.result) {
      return res.status(200).json({ ok: true, pipelines: {} });
    }

    const pipelines = dataPipelines.result;

    // 2️⃣ Para cada pipeline, pega todas as fases
    let pipelinesFases = {};

    for (let pipeline of pipelines) {
      const pipelineId = pipeline.ID;
      const urlStages = `${BITRIX_WEBHOOK}/crm.deal.stage.list.json?pipeline_id=${pipelineId}`;
      const responseStages = await fetch(urlStages);
      const dataStages = await responseStages.json();

      if (dataStages.result) {
        // Mapeia ID da fase → nome legível
        let stagesMap = {};
        dataStages.result.forEach(stage => {
          stagesMap[stage.ID] = stage.NAME;
        });

        pipelinesFases[pipelineId] = {
          name: pipeline.NAME,
          stages: stagesMap
        };
      }
    }

    return res.status(200).json({
      ok: true,
      pipelines: pipelinesFases
    });

  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: "Erro ao consultar o Bitrix",
      details: err.message
    });
  }
}
