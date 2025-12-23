// backend/contatoOrganizado.js
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
    const { contatoId, email, telefone } = req.query;

    if (!contatoId && !email && !telefone) {
      return res.status(400).json({
        ok: false,
        error: "Informe pelo menos um parâmetro: contatoId, email ou telefone"
      });
    }

    const BITRIX_WEBHOOK = "https://angeliadvogados.bitrix24.com.br/rest/13/rmyrytghiumw6jrx";

    // Monta filtro dinâmico
    let filtro = {};
    if (contatoId) filtro.ID = contatoId;
    if (email) filtro.EMAIL = email;
    if (telefone) filtro.PHONE = telefone;

    const queryString = Object.entries(filtro)
      .map(([key, value]) => `filter[${key}]=${encodeURIComponent(value)}`)
      .join("&");

    // Chama a API para listar contatos
    const url = `${BITRIX_WEBHOOK}/crm.contact.list.json?${queryString}` +
      `&select[]=ID` +
      `&select[]=NAME` +
      `&select[]=LAST_NAME` +
      `&select[]=PHONE` +
      `&select[]=EMAIL` +
      `&select[]=COMMENTS` +
      `&select[]=UF_CRM_*`; // todos campos personalizados

    const response = await fetch(url);
    const data = await response.json();

    if (!data.result || data.result.length === 0) {
      return res.status(200).json({ ok: true, result: [] });
    }

    // Organiza os campos de cada contato
    const contatosOrganizados = data.result.map(contato => {
      let campos = {};
      for (let key in contato) {
        campos[key] = contato[key] || null;
      }
      return campos;
    });

    return res.status(200).json({
      ok: true,
      result: contatosOrganizados
    });

  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: "Erro ao consultar o Bitrix",
      details: err.message
    });
  }
}
