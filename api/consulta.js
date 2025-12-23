// backend/todosContatos.js
export default async function handler(req, res) {
  // Habilita CORS
  res.setHeader("Access-Control-Allow-Origin", "*"); 
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Responde a requisições OPTIONS (preflight)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const BITRIX_WEBHOOK = "https://angeliadvogados.bitrix24.com.br/rest/13/rmyrytghiumw6jrx";

    let start = 0;
    const todosContatos = [];
    let batch;

    do {
      // URL da API para listar contatos, 50 por vez
      const url = `${BITRIX_WEBHOOK}/crm.contact.list.json` +
        `?select[]=ID` +
        `&select[]=NAME` +
        `&select[]=LAST_NAME` +
        `&select[]=PHONE` +
        `&select[]=EMAIL` +
        `&select[]=COMMENTS` +
        `&select[]=UF_CRM_*` +
        `&order[ID]=ASC` +
        `&start=${start}`;

      const response = await fetch(url);
      const data = await response.json();

      batch = data.result || [];

      // Organiza cada contato em campo → valor
      const contatosOrganizados = batch.map(contato => {
        const campos = {};
        for (let key in contato) {
          campos[key] = contato[key] || null;
        }
        return campos;
      });

      todosContatos.push(...contatosOrganizados);
      start += 50;
    } while (batch.length === 50); // continua até não ter mais contatos

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
