import ReactMarkdown from 'react-markdown';

const testMarkdown = `
# Test Header
This is a **bold** text with *italic* text.

## Lists work?
- Item 1
- Item 2
- Item 3

### Code blocks?
\`\`\`javascript
console.log("Hello World");
\`\`\`

Normal paragraph with inline \`code\`.
`;

export default function MarkdownTest() {
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
      <h1>Markdown Test Component</h1>
      
      <div style={{ border: '1px solid #f00', padding: '10px', marginBottom: '20px' }}>
        <h3>Raw Markdown:</h3>
        <pre>{testMarkdown}</pre>
      </div>
      
      <div style={{ border: '1px solid #0f0', padding: '10px' }}>
        <h3>Rendered Markdown:</h3>
        <ReactMarkdown>{testMarkdown}</ReactMarkdown>
      </div>
    </div>
  );
}
