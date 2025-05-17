// Simple list of inappropriate words to filter
// Note: In a production app, this would be more comprehensive and possibly fetched from an API
const INAPPROPRIATE_WORDS = [
  'bad', 'stupid', 'dumb', 'idiot', 'hate', 'kill', 'ugly', 'mean',
  'jerk', 'loser', 'butt', 'hell', 'damn', 'crap', 'poop', 'shut up',
  'fart', 'pee', 'piss', 'suck', 'bum'
];

// More severe inappropriate words would include profanity and slurs
// We're omitting those in this demo but would include them in a real app

export function filterMessageForProfanity(text: string): { filtered: string, containsProfanity: boolean } {
  if (!text) return { filtered: '', containsProfanity: false };
  
  // Convert to lowercase for comparison
  const lowerText = text.toLowerCase();
  
  // Check if the message contains any inappropriate words
  let containsProfanity = false;
  
  // Process the message
  let filtered = text;
  
  for (const word of INAPPROPRIATE_WORDS) {
    // Create a regular expression to match the word with word boundaries
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    
    if (regex.test(lowerText)) {
      containsProfanity = true;
      
      // Replace the word with asterisks
      const replacement = '*'.repeat(word.length);
      filtered = filtered.replace(regex, replacement);
    }
  }
  
  return {
    filtered,
    containsProfanity
  };
}
