import 'dotenv/config';
import axios from 'axios';

async function testRedditAPI() {
  try {
    // 1. First test authentication
    console.log('Testing Reddit API connection...');

    const headers = {
      Authorization: `Bearer ${process.env.REDDIT_ACCESS_TOKEN}`,
      'User-Agent': process.env.REDDIT_USER_AGENT,
    };

    // 2. Try to get posts from a public subreddit
    const subreddit = 'programming'; // Using a public subreddit for testing
    const response = await axios.get(
      `https://oauth.reddit.com/r/${subreddit}/new.json?limit=5`,
      { headers }
    );

    // 3. Log the results
    console.log('\nSuccessfully connected to Reddit API!');
    console.log('\nLatest posts:');
    response.data.data.children.forEach((post: any) => {
      console.log(`\nTitle: ${post.data.title}`);
      console.log(`Author: ${post.data.author}`);
      console.log(`Subreddit: ${post.data.subreddit}`);
      console.log('---');
    });
  } catch (error: any) {
    console.error('\nError occurred:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    } else {
      console.error(error.message);
    }

    // Log the current configuration (without sensitive data)
    console.log('\nCurrent configuration:');
    console.log('Access Token exists:', !!process.env.REDDIT_ACCESS_TOKEN);
    console.log('User Agent:', process.env.REDDIT_USER_AGENT);
  }
}

testRedditAPI().catch(console.error);
