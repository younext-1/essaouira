'use client';

import { useState, useRef } from 'react';
import { Bold, Italic, Heading2, List, Link as LinkIcon, Eye, Edit3 } from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Write product details, custom care instructions, or materials details in Markdown format...',
  rows = 8,
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selection = textarea.value.substring(start, end);
    const replacement = before + selection + after;

    const newValue =
      textarea.value.substring(0, start) +
      replacement +
      textarea.value.substring(end);

    onChange(newValue);

    // Re-focus and set selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selection.length
      );
    }, 50);
  };

  // Convert markdown to clean, basic HTML elements securely (simple replacement engine)
  const renderMarkdown = (md: string) => {
    if (!md) return '<p class="text-gray-400 italic">Nothing to preview yet.</p>';

    let html = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Headings
    html = html.replace(/^##\s+(.+)$/gm, '<h3 class="text-base font-bold text-gray-900 mt-4 mb-2">$1</h3>');
    html = html.replace(/^###\s+(.+)$/gm, '<h4 class="text-sm font-bold text-gray-800 mt-3 mb-1.5">$1</h4>');

    // Bold & Italics
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Lists
    html = html.replace(/^\s*-\s+(.+)$/gm, '<li class="list-disc ml-5 text-gray-600 my-1">$1</li>');

    // Links
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="text-[#CA8A04] underline">$1</a>');

    // Paragraphs / Newlines
    html = html.split(/\n{2,}/).map(p => {
      if (p.trim().startsWith('<h') || p.trim().startsWith('<li')) return p;
      return `<p class="text-sm text-gray-600 leading-relaxed mb-3">${p.replace(/\n/g, '<br />')}</p>`;
    }).join('');

    return html;
  };

  return (
    <div className="w-full rounded-[16px] border border-[rgba(232,227,216,0.8)] bg-white overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-[#CA8A04]/20 focus-within:border-[#CA8A04] transition-all">
      
      {/* Editor Header / Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-2 select-none">
        
        {/* Short-cut Tools */}
        {activeTab === 'write' ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => insertText('**', '**')}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-150 transition-colors"
              title="Bold text"
            >
              <Bold className="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              onClick={() => insertText('*', '*')}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-150 transition-colors"
              title="Italic text"
            >
              <Italic className="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              onClick={() => insertText('## ')}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-150 transition-colors"
              title="Subheading"
            >
              <Heading2 className="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              onClick={() => insertText('- ')}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-150 transition-colors"
              title="Bullet list"
            >
              <List className="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              onClick={() => insertText('[', '](url)')}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-150 transition-colors"
              title="Insert link"
            >
              <LinkIcon className="h-4.5 w-4.5" />
            </button>
          </div>
        ) : (
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
            Live Preview Area
          </div>
        )}

        {/* View Toggle Tabs */}
        <div className="flex border border-gray-200 rounded-xl p-0.5 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('write')}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'write'
                ? 'bg-[#18181B] text-white shadow-sm'
                : 'text-gray-500 hover:text-[#18181B]'
            }`}
          >
            <Edit3 className="h-3.5 w-3.5" />
            Write
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-[#18181B] text-white shadow-sm'
                : 'text-gray-500 hover:text-[#18181B]'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="p-4 bg-white min-h-[160px]">
        {activeTab === 'write' ? (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className="w-full border-0 p-0 text-sm text-gray-800 placeholder-gray-400 focus:ring-0 focus:outline-none resize-y min-h-[120px]"
          />
        ) : (
          <div
            className="prose prose-sm max-w-none text-gray-700 min-h-[120px]"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
          />
        )}
      </div>

      {/* Footer markdown hints tag */}
      <div className="bg-gray-50 px-4 py-1.5 border-t border-gray-100 flex justify-between text-[9.5px] text-gray-400 select-none">
        <span>Formatting shortcuts active</span>
        <span>Supports bold, lists, and headers</span>
      </div>
    </div>
  );
}
