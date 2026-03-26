export default async function handler(req, res) {
  const { id } = req.query;
  const response = await fetch(
    `https://cricket.sportmonks.com/api/v2.0/players/${id}?api_token=${process.env.REACT_APP_SPORTMONKS_KEY}&include=career,country`
  );

  if (!response.ok) {
    return res.status(response.status).json({ error: "Failed to fetch from Sportmonks" });
  }

  const data = await response.json();
  res.status(200).json(data);
}
