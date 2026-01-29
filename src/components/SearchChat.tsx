import { useState, useRef, useEffect } from 'react';
import type { Department, Message, SourceInfo } from '../types';
import { DEPARTMENT_ACCESS } from '../types';
import { searchDocuments } from '../api';

interface SearchChatProps {
  currentDepartment: Department;
}

export function SearchChat({ currentDepartment }: SearchChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const accessibleDepartments = DEPARTMENT_ACCESS[currentDepartment];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await searchDocuments(input.trim(), currentDepartment);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  function toggleSource(messageId: string, sourceIndex: number) {
    const key = `${messageId}-${sourceIndex}`;
    setExpandedSources((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function getSourceLocation(source: SourceInfo): string {
    if (source.page) return `Page ${source.page}`;
    if (source.row) return `Row ${source.row}`;
    if (source.section) return source.section;
    return '';
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 md:px-8 py-6 border-b border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-semibold text-gray-900">Search Documents</h1>
          <p className="text-sm text-gray-500 mt-1">
            Searching: {accessibleDepartments.join(', ')}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center px-6 md:px-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              Ask a question
            </h2>
            <p className="text-gray-500 mb-8 text-center max-w-md">
              Search through your {currentDepartment} documents
            </p>
            <div className="flex flex-wrap gap-3 justify-center max-w-lg">
              {[
                'What are the key policies?',
                'Summarise recent updates',
                'Find budget information',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="px-4 py-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-full hover:bg-gray-100 hover:border-gray-300 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-6 md:px-8 py-6 space-y-6 max-w-4xl mx-auto">
            {messages.map((message) => (
              <div key={message.id}>
                {message.role === 'user' ? (
                  <div className="flex justify-end">
                    <div className="bg-black text-white px-5 py-3 rounded-2xl rounded-br-sm max-w-[85%] sm:max-w-[75%]">
                      <p>{message.content}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                    <p className="text-gray-900 whitespace-pre-wrap break-words leading-relaxed">
                      {message.content}
                    </p>

                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-5 pt-4 border-t border-gray-200">
                        <p className="text-xs font-medium text-gray-500 mb-3">
                          Sources ({message.sources.length})
                        </p>
                        <div className="space-y-2">
                          {message.sources.map((source, idx) => {
                            const isExpanded = expandedSources.has(`${message.id}-${idx}`);
                            return (
                              <div key={idx} className="border border-gray-200 rounded-lg bg-white overflow-hidden ">
                                <button
                                  onClick={() => toggleSource(message.id, idx)}
                                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                  <span className="text-sm text-gray-700 font-medium">
                                    {idx + 1}. {source.source}
                                    {getSourceLocation(source) && (
                                      <span className="text-gray-400 font-normal ml-2">
                                        · {getSourceLocation(source)}
                                      </span>
                                    )}
                                  </span>
                                  {/* <span className="text-xs text-gray-400">
                                    {(source.score * 100).toFixed(0)}%
                                  </span> */}
                                </button>
                                {isExpanded && (
                                  <div className="px-4 py-3 text-sm text-gray-600 bg-gray-50 border-t border-gray-200 leading-relaxed">
                                    {source.text}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-6 md:px-8 py-6 border-t border-gray-200 bg-white">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            rows={1}
            className="flex-1 px-5 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 resize-none bg-white"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
