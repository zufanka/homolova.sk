export default async function handler(req, res) {
  // Enable CORS for your GitHub Pages domain
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, newsletters } = req.body;
  
  // Your API key and publication IDs from environment variables
  const API_KEY = process.env.BEEHIIV_API_KEY;
  const PUBLICATIONS = {
    'ada-essays': process.env.ADA_ESSAYS_PUB_ID,
    'the-pond': process.env.v
  };

  if (!API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const subscriptionPromises = newsletters.map(async (newsletter) => {
      const publicationId = PUBLICATIONS[newsletter];
      
      if (!publicationId) {
        throw new Error(`Unknown newsletter: ${newsletter}`);
      }

      const response = await fetch(`https://api.beehiiv.com/v2/publications/${publicationId}/bulk_subscriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscriptions: [{
            email: email,
            reactivate_existing: false,
            send_welcome_email: true
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to subscribe to ${newsletter}: ${errorData.message || response.statusText}`);
      }
      
      return response.json();
    });

    const results = await Promise.all(subscriptionPromises);
    
    res.status(200).json({ 
      success: true, 
      message: 'Successfully subscribed to newsletters!',
      results: results
    });
    
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ 
      error: 'Subscription failed', 
      details: error.message 
    });
  }
}