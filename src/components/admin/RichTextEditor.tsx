import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import { 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote, Code, Link as LinkIcon, Image as ImageIcon,
  Heading1, Heading2, Heading3, Undo, Redo, Highlighter, Palette,
  FileVideo, FileText, FolderOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useState } from 'react';
import MediaPickerModal from './MediaPickerModal';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const RichTextEditor = ({ content, onChange, placeholder = "Write your content..." }: RichTextEditorProps) => {
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaPickerType, setMediaPickerType] = useState<'image' | 'video' | 'pdf'>('image');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-gold underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full rounded-lg my-4',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none min-h-[200px] p-4 focus:outline-none',
      },
    },
  });

  if (!editor) return null;

  const addLink = () => {
    if (linkUrl) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      setLinkUrl('');
    }
  };

  const addImage = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
    }
  };

  const addVideo = () => {
    if (videoUrl) {
      // Insert video as HTML
      const videoHtml = `<div class="video-embed my-4"><video controls class="w-full rounded-lg max-h-[400px]"><source src="${videoUrl}" type="video/mp4" />Your browser does not support the video tag.</video></div>`;
      editor.chain().focus().insertContent(videoHtml).run();
      setVideoUrl('');
    }
  };

  const addPdf = () => {
    if (pdfUrl) {
      // Insert PDF as download link with preview
      const fileName = pdfUrl.split('/').pop() || 'Document.pdf';
      const pdfHtml = `<div class="pdf-embed my-4 p-4 bg-muted rounded-lg border border-border"><a href="${pdfUrl}" target="_blank" class="flex items-center gap-3 text-gold hover:underline"><span class="text-2xl">📄</span><span>${fileName}</span></a></div>`;
      editor.chain().focus().insertContent(pdfHtml).run();
      setPdfUrl('');
    }
  };

  const openMediaPicker = (type: 'image' | 'video' | 'pdf') => {
    setMediaPickerType(type);
    setShowMediaPicker(true);
  };

  const handleMediaSelect = (url: string) => {
    if (mediaPickerType === 'image') {
      editor.chain().focus().setImage({ src: url }).run();
    } else if (mediaPickerType === 'video') {
      const videoHtml = `<div class="video-embed my-4"><video controls class="w-full rounded-lg max-h-[400px]"><source src="${url}" type="video/mp4" />Your browser does not support the video tag.</video></div>`;
      editor.chain().focus().insertContent(videoHtml).run();
    } else if (mediaPickerType === 'pdf') {
      const fileName = url.split('/').pop() || 'Document.pdf';
      const pdfHtml = `<div class="pdf-embed my-4 p-4 bg-muted rounded-lg border border-border"><a href="${url}" target="_blank" class="flex items-center gap-3 text-gold hover:underline"><span class="text-2xl">📄</span><span>${fileName}</span></a></div>`;
      editor.chain().focus().insertContent(pdfHtml).run();
    }
    setShowMediaPicker(false);
  };

  const ToolButton = ({ 
    onClick, 
    isActive = false, 
    children, 
    title 
  }: { 
    onClick: () => void; 
    isActive?: boolean; 
    children: React.ReactNode; 
    title: string;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={`h-8 w-8 ${isActive ? 'bg-gold/20 text-gold' : 'text-muted-foreground hover:text-foreground'}`}
      onClick={onClick}
      title={title}
    >
      {children}
    </Button>
  );

  const getAcceptType = () => {
    if (mediaPickerType === 'video') return 'video/*';
    if (mediaPickerType === 'pdf') return 'application/pdf';
    return 'image/*';
  };

  return (
    <>
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        {/* Toolbar */}
        <div className="border-b border-border bg-muted/50 p-1 flex flex-wrap gap-0.5">
          {/* History */}
          <ToolButton onClick={() => editor.chain().focus().undo().run()} title="Undo">
            <Undo className="h-4 w-4" />
          </ToolButton>
          <ToolButton onClick={() => editor.chain().focus().redo().run()} title="Redo">
            <Redo className="h-4 w-4" />
          </ToolButton>
          
          <div className="w-px h-6 bg-border mx-1 self-center hidden sm:block" />
          
          {/* Headings */}
          <ToolButton 
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </ToolButton>
          <ToolButton 
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </ToolButton>
          <ToolButton 
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </ToolButton>
          
          <div className="w-px h-6 bg-border mx-1 self-center hidden sm:block" />
          
          {/* Text formatting */}
          <ToolButton 
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </ToolButton>
          <ToolButton 
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </ToolButton>
          <ToolButton 
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="Underline"
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolButton>
          <ToolButton 
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </ToolButton>
          
          {/* Text Color */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Text Color">
                <Palette className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="grid grid-cols-6 gap-1">
                {['#000000', '#ffffff', '#c9a86c', '#ef4444', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'].map(color => (
                  <button
                    key={color}
                    className="w-6 h-6 rounded border border-border"
                    style={{ backgroundColor: color }}
                    onClick={() => editor.chain().focus().setColor(color).run()}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Highlight */}
          <ToolButton 
            onClick={() => editor.chain().focus().toggleHighlight({ color: '#c9a86c' }).run()}
            isActive={editor.isActive('highlight')}
            title="Highlight"
          >
            <Highlighter className="h-4 w-4" />
          </ToolButton>
          
          <div className="w-px h-6 bg-border mx-1 self-center hidden sm:block" />
          
          {/* Alignment */}
          <ToolButton 
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </ToolButton>
          <ToolButton 
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </ToolButton>
          <ToolButton 
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </ToolButton>
          <ToolButton 
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            isActive={editor.isActive({ textAlign: 'justify' })}
            title="Justify"
          >
            <AlignJustify className="h-4 w-4" />
          </ToolButton>
          
          <div className="w-px h-6 bg-border mx-1 self-center hidden sm:block" />
          
          {/* Lists */}
          <ToolButton 
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </ToolButton>
          <ToolButton 
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolButton>
          
          <div className="w-px h-6 bg-border mx-1 self-center hidden sm:block" />
          
          {/* Quote & Code */}
          <ToolButton 
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </ToolButton>
          <ToolButton 
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive('codeBlock')}
            title="Code Block"
          >
            <Code className="h-4 w-4" />
          </ToolButton>
          
          <div className="w-px h-6 bg-border mx-1 self-center hidden sm:block" />
          
          {/* Link */}
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className={`h-8 w-8 ${editor.isActive('link') ? 'bg-gold/20 text-gold' : ''}`}
                title="Insert Link"
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <Input
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={addLink} className="flex-1">Add Link</Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => editor.chain().focus().unsetLink().run()}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Image */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Insert Image">
                <ImageIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={() => openMediaPicker('image')}
                >
                  <FolderOpen className="h-4 w-4" />
                  Select from Media Library
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-popover px-2 text-muted-foreground">Or paste URL</span>
                  </div>
                </div>
                <Input
                  placeholder="Image URL"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
                <Button size="sm" onClick={addImage} className="w-full">Insert Image</Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Video */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Insert Video">
                <FileVideo className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={() => openMediaPicker('video')}
                >
                  <FolderOpen className="h-4 w-4" />
                  Select from Media Library
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-popover px-2 text-muted-foreground">Or paste URL</span>
                  </div>
                </div>
                <Input
                  placeholder="Video URL (MP4, WebM)"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
                <Button size="sm" onClick={addVideo} className="w-full">Insert Video</Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* PDF */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Insert PDF">
                <FileText className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={() => openMediaPicker('pdf')}
                >
                  <FolderOpen className="h-4 w-4" />
                  Select from Media Library
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-popover px-2 text-muted-foreground">Or paste URL</span>
                  </div>
                </div>
                <Input
                  placeholder="PDF URL"
                  value={pdfUrl}
                  onChange={(e) => setPdfUrl(e.target.value)}
                />
                <Button size="sm" onClick={addPdf} className="w-full">Insert PDF</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Editor Content */}
        <EditorContent editor={editor} />
      </div>

      {/* Media Picker Modal */}
      <MediaPickerModal
        open={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={handleMediaSelect}
        accept={getAcceptType()}
        title={`Select ${mediaPickerType === 'image' ? 'Image' : mediaPickerType === 'video' ? 'Video' : 'PDF'}`}
      />
    </>
  );
};

export default RichTextEditor;
