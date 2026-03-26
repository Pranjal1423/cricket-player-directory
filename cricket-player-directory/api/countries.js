export default async function handler(req, res) {
  const response = await fetch(
    `https://cricket.sportmonks.com/api/v2.0/countries?api_token=${process.env.SPORTMONKS_KEY}`
  );
  const data = await response.json();
  res.status(200).json(data);
}
