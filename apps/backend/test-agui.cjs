// Simple test for the AG-UI Protocol endpoint
const http = require('http');

const postData = JSON.stringify({
  threadId: 'test-thread-' + Date.now(),
  runId: 'test-run-' + Date.now(),
  messages: [
    {
      id: 'msg-1',
      role: 'user',
      content: 'Show me a bar chart of Q1 2024 sales: Jan $10k, Feb $15k, Mar $20k'
    }
  ],
  tools: []
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/agui',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Testing AG-UI Protocol endpoint...\n');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  console.log('\nEvents received:\n');

  let eventCount = 0;
  
  res.on('data', (chunk) => {
    const data = chunk.toString();
    const lines = data.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        eventCount++;
        const eventData = line.substring(6);
        try {
          const event = JSON.parse(eventData);
          console.log(`[Event ${eventCount}] Type: ${event.type}`);
          console.log(JSON.stringify(event, null, 2));
          console.log('---');
        } catch (e) {
          console.log(`[Event ${eventCount}] Raw:`, eventData);
        }
      }
    }
  });

  res.on('end', () => {
    console.log(`\n✅ Stream completed. Total events: ${eventCount}`);
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error(`❌ Request error: ${e.message}`);
  process.exit(1);
});

// Write data to request body
req.write(postData);
req.end();

// Timeout after 30 seconds
setTimeout(() => {
  console.log('\n⏱️  Test timeout');
  process.exit(1);
}, 30000);
