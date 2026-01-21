'use client';

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Pilcrow } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import React from 'react';

const EditorToolbar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="border border-input rounded-t-md p-1 flex items-center gap-1 flex-wrap">
      <Toggle
        size="sm"
        pressed={editor.isActive('bold')}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('italic')}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('underline')}
        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="h-4 w-4" />
      </Toggle>
       <Toggle
        size="sm"
        pressed={editor.isActive('paragraph')}
        onPressedChange={() => editor.chain().focus().setParagraph().run()}
      >
        <Pilcrow className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('bulletList')}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('orderedList')}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </Toggle>
    </div>
  );
};

interface TiptapEditorProps {
  content: string;
  onChange: (richText: string) => void;
}

const TiptapEditor = ({ content, onChange }: TiptapEditorProps) => {
  const editor = useEditor({
    extensions: [StarterKit.configure(), Underline],
    content: content,
    editorProps: {
      attributes: {
        class:
          'prose dark:prose-invert max-w-none prose-sm sm:prose-base focus:outline-none min-h-[150px] border-x border-b border-input rounded-b-md p-4',
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  return (
    <div>
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

export default TiptapEditor;
