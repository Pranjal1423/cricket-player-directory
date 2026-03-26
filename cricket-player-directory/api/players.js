export default async function handler(req, res) {
  const response = await fetch(
    `https://cricket.sportmonks.com/api/v2.0/players?api_token=${process.env.SPORTMONKS_KEY}&include=career`
  );
  const data = await response.json();
  res.status(200).json(data);
}
