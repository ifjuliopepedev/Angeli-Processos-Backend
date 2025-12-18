export default function handler(req, res) 
{
  res.status(200).json({
    online: true,
    time: new Date().toISOString()
  });
}
