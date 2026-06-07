import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Renders entry bodies. react-markdown does not render raw HTML by default,
// so author markdown is sanitized for free.
export default function Markdown({ children }: { children: string }) {
  return (
    <div className="prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
