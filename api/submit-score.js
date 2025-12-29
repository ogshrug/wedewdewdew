// api/submit-score.js

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const { username, score, timeTaken } = req.body;

  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env;
  const AIRTABLE_TABLE_NAME = 'Scores';

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`
      },
      body: JSON.stringify({
        fields: {
          "Username": username,
          "Score": score,
          "Time Taken": timeTaken
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Airtable API error: ${errorData.error.message}`);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error submitting score to Airtable:', error);
    res.status(500).json({ error: 'Failed to submit score.' });
  }
};
