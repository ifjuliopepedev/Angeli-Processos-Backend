export default async function handler(req, res) {
  const { cpf } = req.query;

  if (!cpf) {
    return res.status(400).json({
      ok: false,
      error: "CPF não informado"
    });
  }

  try {
    const webhook = process.env.BITRIX_WEBHOOK;

    const response = await fetch(
      `${webhook}crm.deal.list`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          filter: {
            UF_CRM_CPF: cpf   // ⚠️ CONFIRMAR NOME DO CAMPO
          },
          select: [
            "ID",
            "TITLE",
            "STAGE_ID"
          ]
        })
      }
    );

    const data = await response.json();

    if (!data.result || data.result.length === 0) {
      return res.status(200).json({
        ok: true,
        cpf,
        encontrado: false
      });
    }

    const p = data.result[0];

    res.status(200).json({
      ok: true,
      cpf,
      encontrado: true,
      processo: {
        id: p.ID,
        titulo: p.TITLE,
        status: p.STAGE_ID
      }
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({
      ok: false,
      error: "Erro ao consultar Bitrix"
    });
  }
}
