// /pages/api/contatos.js
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const BITRIX_WEBHOOK = "https://angeliadvogados.bitrix24.com.br/rest/13/rmyrytghiumw6jrx";

    let start = 0;
    const todosContatos = [];
    let batch;

    do {
      const url = `${BITRIX_WEBHOOK}/crm.contact.list.json` +
        `?select[]=ID` +
        `&select[]=NAME` +
        `&select[]=LAST_NAME` +
        `&select[]=UF_CRM_*` + // campos personalizados
        `&order[ID]=ASC` +
        `&start=${start}`;

      const response = await fetch(url);
      const data = await response.json();

      batch = data.result || [];

      // pega apenas o nome + campos personalizados
      const contatosSimplificados = batch.map(contato => {
        const campos = { 
          ID: contato.ID, 
          NOME: contato.NAME 
        };
        // adiciona campos personalizados se existirem
        for (let key in contato) {
          if (key.startsWith("UF_CRM_")) {
            campos[key] = contato[key];
          }
        }
        return campos;
      });

      todosContatos.push(...contatosSimplificados);
      start += 50;
    } while (batch.length === 50);

    return res.status(200).json({
      ok: true,
      total: todosContatos.length,
      result: todosContatos
    });

  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: "Erro ao consultar o Bitrix",
      details: err.message
    });
  }
}
