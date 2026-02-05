# Phase 2: Annotation System - Research

**Researched:** 2026-02-05
**Domain:** Annotation/Comment System with Markdown Rendering
**Confidence:** HIGH

## Summary

Phase 2 requires building a comprehensive annotation and review system on top of existing infrastructure. The codebase already has foundational annotation types (DELETION, INSERTION, REPLACEMENT, COMMENT, GLOBAL_COMMENT), a Zustand store for state management, and a custom markdown parser. What's missing are the collaborative features: threaded comments with @mentions, status tracking (open/in-progress/resolved), version history with diff viewing, and enhanced markdown rendering.

The standard approach for this domain combines react-mentions or Velt SDK for @mentions and threaded comments, react-syntax-highlighter for code highlighting, and a custom versioning system with diff visualization using Monaco Editor or react-diff-viewer. The existing web-highlighter library should be retained for visual text annotations.

**Primary recommendation:** Use react-mentions for @mentions (MEDIUM confidence - verified implementation pattern), extend existing Annotation interface with status field and threadId for threading (HIGH confidence - aligns with existing architecture), and implement version history using a straightforward document snapshot approach with diff rendering.

## User Constraints (from CONTEXT.md)

No CONTEXT.md exists for this phase. All recommendations are at Claude's discretion.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **zustand** | ^5.0.9 | State management | Already in use - lightweight, no boilerplate, excellent for nested annotation state |
| **react-markdown** | ^9.0.1 | Markdown rendering | Already in use - secure by default with rehype plugins |
| **web-highlighter** | current | Text annotation highlighting | Already in use - handles visual markers on DOM elements |
| **@supabase/supabase-js** | ^2.89.0 | Backend/data persistence | Already in use - auth from Phase 1, natural for annotations storage |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **react-mentions** | ^4.4.10 | @mention autocomplete | Adding user mentions in comments with trigger pattern (@) |
| **react-syntax-highlighter** | ^15.5.0 | Code block syntax highlighting | Enhanced markdown rendering for code blocks |
| **react-diff-viewer-continued** | ^3.2.6 | Inline diff visualization | Version history comparison view |
| **monaco-editor** | ^0.45.0 | Advanced code diff with editing | Alternative if rich code editing in diffs needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-mentions | @veltdev/react | Velt provides full collaboration suite (presence, cursors, threads) but is heavier and more complex; react-mentions is lighter and focused on mentions only |
| react-diff-viewer-continued | Monaco Editor | Monaco is more powerful for code but heavier; diff-viewer is purpose-built for side-by-side text comparison |
| Custom versioning | Automerge | Automerge provides CRDT-based real-time collaboration but adds significant complexity for this phase's requirements |

**Installation:**
```bash
# For Phase 2 additions
bun add react-mentions react-syntax-highlighter react-diff-viewer-continued
bun add -d @types/react-syntax-highlighter
```

## Architecture Patterns

### Recommended Project Structure
```
packages/annotation/
├── src/
│   ├── types/
│   │   ├── annotation.ts      # Core Annotation interface (extends existing)
│   │   ├── comment.ts         # CommentThread, Comment interfaces
│   │   └── version.ts         # DocumentVersion, VersionDiff interfaces
│   ├── store/
│   │   ├── useAnnotationStore.ts  # Existing - extend with thread actions
│   │   ├── useCommentStore.ts     # NEW - thread/comment state
│   │   └── useVersionStore.ts     # NEW - version history state
│   ├── components/
│   │   ├── AnnotationPanel.tsx    # Existing - enhance with status badge
│   │   ├── CommentThread.tsx      # NEW - threaded comment display
│   │   ├── CommentInput.tsx       # NEW - reply input with @mentions
│   │   ├── StatusBadge.tsx        # NEW - open/in-progress/resolved badge
│   │   ├── DiffViewer.tsx         # NEW - version comparison
│   │   └── VersionHistory.tsx     # NEW - version timeline
│   ├── utils/
│   │   ├── parser.ts              # Existing - extend if needed
│   │   ├── annotationSort.ts      # Existing - sort by status priority
│   │   ├── threadHelpers.ts       # NEW - thread creation/retrieval
│   │   └── diffGenerator.ts       # NEW - generate diffs between versions
│   └── hooks/
│       ├── useMentions.ts         # NEW - @mention autocomplete
│       └── useVersionHistory.ts   # NEW - version CRUD operations
```

### Pattern 1: Extend Existing Annotation Interface
**What:** Add status and threadId to existing Annotation type for status tracking and threading
**When to use:** All annotations need status tracking; comments need threading
**Example:**
```typescript
// Source: Based on existing packages/ui/types.ts
export enum AnnotationStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
}

export interface Annotation {
  id: string;
  blockId: string;
  type: AnnotationType;
  text?: string;
  originalText: string;
  createdAt: number;
  author?: string;
  isGlobal?: boolean;
  startMeta?: {...};
  endMeta?: {...};

  // Phase 2 additions:
  status?: AnnotationStatus;          // NEW - for ANNO-04
  threadId?: string;                  // NEW - links to comment thread
  resolvedAt?: number;                // NEW - when status changed to RESOLVED
  resolvedBy?: string;                // NEW - who resolved it
}

export interface CommentThread {
  id: string;
  annotationId: string;               // Links to parent annotation
  comments: Comment[];
  status: AnnotationStatus;
  createdAt: number;
  createdBy: string;
}

export interface Comment {
  id: string;
  threadId: string;
  authorId: string;
  authorName: string;
  content: string;
  mentions: string[];                 // User IDs mentioned
  createdAt: number;
  parentId?: string;                  // For nested replies
}
```

### Pattern 2: Threaded Comment Display with Indentation
**What:** Recursive component rendering for nested comment replies
**When to use:** Displaying comment threads with replies
**Example:**
```typescript
// Source: Standard React recursion pattern for comments
interface CommentThreadProps {
  thread: CommentThread;
  onReply: (threadId: string, content: string, mentions: string[]) => void;
  onStatusChange: (threadId: string, status: AnnotationStatus) => void;
  depth?: number;  // For indentation
}

const CommentThreadComponent: React.FC<CommentThreadProps> = ({
  thread, onReply, onStatusChange, depth = 0
}) => {
  const rootComments = thread.comments.filter(c => !c.parentId);

  return (
    <div className={`comment-thread ml-${depth * 4}`}>
      {rootComments.map(comment => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onReply={onReply}
          threadId={thread.id}
        >
          {/* Recursively render replies */}
          {comment.replies?.map(reply => (
            <CommentThreadComponent
              key={reply.id}
              thread={{...thread, comments: [reply]}}
              onReply={onReply}
              onStatusChange={onStatusChange}
              depth={depth + 1}
            />
          ))}
        </CommentItem>
      ))}
    </div>
  );
};
```

### Pattern 3: @Mention Autocomplete with react-mentions
**What:** Textarea with @trigger for user mention autocomplete
**When to use:** User is typing a comment and wants to mention another user
**Example:**
```typescript
// Source: react-mentions library documentation pattern
import { Mention, MentionsInput } from 'react-mentions';

const CommentInput: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);  // Fetch from Supabase

  const handleAddComment = (content: string, mentions: MentionData[]) => {
    const mentionIds = mentions.map(m => m.id);
    // Submit comment with mentions
  };

  return (
    <MentionsInput
      value={commentText}
      onChange={(e) => setCommentText(e.target.value)}
      placeholder="Leave a comment... Use @ to mention someone"
      className="mentions-input"
    >
      <Mention
        trigger="@"
        data={users}
        displayTransform={(username, id) => `@${username}`}
        markup="@__id__"
        renderSuggestion={(suggestion) => (
          <div className="mention-item">
            <img src={suggestion.avatar} alt={suggestion.display} />
            <span>{suggestion.display}</span>
          </div>
        )}
      />
    </MentionsInput>
  );
};
```

### Pattern 4: Document Version History with Snapshot Storage
**What:** Store full document snapshots on significant changes, generate diffs on demand
**When to use:** User requests version history or restores previous version
**Example:**
```typescript
// Source: Standard snapshot pattern for version control
interface DocumentVersion {
  id: string;
  documentId: string;
  content: string;          // Full markdown content
  createdAt: number;
  createdBy: string;
  changeDescription?: string; // Optional: user-provided description
  annotationIds: string[];  // Annotations present at this version
}

const createVersion = async (
  documentId: string,
  content: string,
  userId: string
): Promise<DocumentVersion> => {
  const { data, error } = await supabase
    .from('document_versions')
    .insert({
      document_id: documentId,
      content,
      created_by: userId,
    })
    .select()
    .single();

  return data;
};

const restoreVersion = async (versionId: string) => {
  // 1. Fetch version content
  const version = await supabase
    .from('document_versions')
    .select('*')
    .eq('id', versionId)
    .single();

  // 2. Update current document
  await supabase
    .from('documents')
    .update({ content: version.content })
    .eq('id', version.documentId);

  // 3. Create new version noting the restoration
  return createVersion(
    version.documentId,
    version.content,
    version.createdBy
  );
};
```

### Pattern 5: Diff Visualization with react-diff-viewer-continued
**What:** Side-by-side or inline diff display for version comparison
**When to use:** User views version history and selects two versions to compare
**Example:**
```typescript
// Source: react-diff-viewer-continued documentation
import ReactDiffViewer from 'react-diff-viewer-continued';

const DiffViewer: React.FC<{oldContent: string; newContent: string}> = ({
  oldContent, newContent
}) => {
  return (
    <ReactDiffViewer
      oldValue={oldContent}
      newValue={newContent}
      splitView={true}  // Side-by-side view
      useDarkTheme={true}
      hideLineNumbers={false}
      showDiffOnly={false}
    />
  );
};
```

### Anti-Patterns to Avoid
- **Storing mentions as plain text only:** Always store mention IDs separately for querying which users were mentioned (notification system later)
- **Deleting annotations on resolve:** Keep resolved annotations in database for history, just change status
- **Inline version storage in documents:** Use separate table for versions to avoid bloating main document
- **Client-only version history:** Store versions in Supabase for persistence across devices
- **Blocking UI on version creation:** Version creation should be async and non-blocking

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| @mention autocomplete | Custom textarea with @ detection | react-mentions library | Handles edge cases: cursor position, trigger variations, keyboard navigation, mobile support |
| Diff visualization | Custom line-by-line comparison | react-diff-viewer-continued | Handles: unified/split views, syntax highlighting, line numbers, large files |
| Syntax highlighting in code blocks | Custom regex-based highlighting | react-syntax-highlighter | Supports 100+ languages, proper tokenization, theme consistency |
| Comment threading | Manual nested rendering | Standard React recursion pattern | Proven pattern, easier to maintain, test coverage examples available |
| Markdown sanitization | Custom DOMPurify wrapper | react-markdown with rehype-sanitize | Configured by default, maintained by security experts |
| Status state machine | Custom status logic | Simple enum with transitions | ANNO-04 only needs 3 states, full state machine library overkill |

**Key insight:** The annotation domain has many "simple" problems that explode in complexity: @mention edge cases (cursor in middle of mention, paste with mentions), diff rendering (Unicode, whitespace, line endings), comment threading (orphan detection, circular references). Use established libraries to avoid these traps.

## Common Pitfalls

### Pitfall 1: XSS via Markdown Rendering
**What goes wrong:** User submits malicious markdown that executes JavaScript when rendered
**Why it happens:** Markdown is converted to HTML; if not sanitized, script tags can execute
**How to avoid:**
- react-markdown is secure by default (uses rehype-sanitize)
- Keep rehype-sanitize configured
- For custom HTML rendering, use DOMPurify (already in dependencies)
**Warning signs:** HTML rendered without sanitization, use of `dangerouslySetInnerHTML`

### Pitfall 2: Orphaned Comment Threads
**What goes wrong:** Parent annotation deleted but comment threads remain with dangling reference
**Why it happens:** Cascading deletes not configured, or soft deletes without cleanup
**How to avoid:**
- Use database foreign key with `ON DELETE CASCADE`
- Or implement soft delete with background cleanup job
- Always check annotation exists before displaying thread
**Warning signs:** Threads that don't render, null reference errors

### Pitfall 3: Mention Notification Race Conditions
**What goes wrong:** Mention notification sent before comment saved to database
**Why it happens:** Async operations not sequenced properly
**How to avoid:**
- Save comment first, get ID, then send notifications
- Use database transaction if needed
- Queue notifications for reliable delivery
**Warning signs:** Notifications link to non-existent comments

### Pitfall 4: Version Storage Bloat
**What goes wrong:** DocumentVersions table grows faster than expected, storage issues
**Why it happens:** Creating version on every keystroke or minor edit
**How to avoid:**
- Only create versions on explicit save or significant changes
- Implement version retention policy (e.g., keep last 50 versions)
- Consider compression for large content
**Warning signs:** Database storage growing rapidly, slow version history queries

### Pitfall 5: Diff Rendering Performance
**What goes wrong:** Diff viewer hangs or crashes on large documents
**Why it happens:** O(n^2) diff algorithm on documents >1000 lines
**How to avoid:**
- Set max document size for diff viewing (e.g., 10,000 lines)
- Use virtual scrolling for very large diffs
- Consider server-side diff generation for huge docs
**Warning signs:** Browser freeze when opening version history

### Pitfall 6: @Mention Parsing Edge Cases
**What goes wrong:** Mentions break when user edits comment, cursor jumps unexpectedly
**Why it happens:** Mention markup conflicts with cursor position calculation
**How to avoid:**
- Use react-mentions markup: `@__id__` format stores ID, displays name
- Validate mention IDs on submit
- Handle missing users (deleted accounts)
**Warning signs:** Cursor jumping when typing near mentions

## Code Examples

Verified patterns from official sources:

### react-markdown with Syntax Highlighting (HIGH confidence)
```typescript
// Source: react-markdown + react-syntax-highlighter integration
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  return (
    <ReactMarkdown
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <SyntaxHighlighter
              style={vscDarkPlus}
              language={match[1]}
              PreTag="div"
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
};
```

### Zustand Store Extension for Threading (HIGH confidence)
```typescript
// Source: Based on existing packages/ui/store/useAnnotationStore.ts
import { create } from 'zustand';

interface CommentStore {
  threads: CommentThread[];
  addThread: (thread: Omit<CommentThread, 'id'>) => string;
  addComment: (threadId: string, comment: Omit<Comment, 'id'>) => void;
  updateThreadStatus: (threadId: string, status: AnnotationStatus) => void;
}

export const useCommentStore = create<CommentStore>((set, get) => ({
  threads: [],

  addThread: (thread) => {
    const id = generateId();
    set((state) => ({
      threads: [...state.threads, { ...thread, id }],
    }));
    return id;
  },

  addComment: (threadId, comment) => {
    const id = generateId();
    set((state) => ({
      threads: state.threads.map((t) =>
        t.id === threadId
          ? { ...t, comments: [...t.comments, { ...comment, id }] }
          : t
      ),
    }));
  },

  updateThreadStatus: (threadId, status) => {
    const userId = getCurrentUserId(); // From Phase 1 auth
    set((state) => ({
      threads: state.threads.map((t) =>
        t.id === threadId
          ? {
              ...t,
              status,
              resolvedAt: status === AnnotationStatus.RESOLVED ? Date.now() : undefined,
              resolvedBy: status === AnnotationStatus.RESOLVED ? userId : undefined,
            }
          : t
      ),
    }));
  },
}));
```

### Supabase Query for User Autocomplete (HIGH confidence)
```typescript
// Source: Supabase documentation pattern
const searchUsers = async (query: string): Promise<User[]> => {
  const { data, error } = await supabase
    .from('users')
    .select('id, display_name, avatar_url')
    .ilike('display_name', `%${query}%`)
    .limit(10);

  if (error) throw error;
  return data.map(u => ({
    id: u.id,
    display: u.display_name,
    avatar: u.avatar_url,
  }));
};
```

### Version Diff Generation (MEDIUM confidence)
```typescript
// Source: Standard diff algorithm implementation
import { diffLines } from 'diff';  // or use diff package

const generateDiff = (oldContent: string, newContent: string) => {
  const changes = diffLines(oldContent, newContent);

  return changes.map(change => ({
    type: change.added ? 'add' : change.removed ? 'remove' : 'equal',
    count: change.count,
    value: change.value,
  }));
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ContentEditable for rich text | react-markdown for secure rendering | Security best practices since 2020 | Eliminates XSS risk, better performance |
| Manual diff implementation | react-diff-viewer-continued | 2023+ | Better UX, handles edge cases |
| Custom mention parsers | react-mentions library | 2021+ | Mobile support, accessibility |
| Client-only versioning | Server-side version storage | Modern SaaS standard | Cross-device sync, reliable history |

**Deprecated/outdated:**
- **remark-react**: Replaced by react-markdown (more actively maintained)
- **react-diff-viewer (original)**: Unmaintained, use react-diff-viewer-continued fork
- **manual XSS prevention**: Use DOMPurify or rehype-sanitize, never custom sanitization
- **localStorage for versions**: Doesn't sync across devices, use Supabase

## Open Questions

Things that couldn't be fully resolved:

1. **Version retention policy**
   - What we know: Need to store document versions for history
   - What's unclear: How many versions to retain? Keep all or limit to N most recent?
   - Recommendation: Start with retention of 50 versions per document, make configurable later

2. **@mention notification scope**
   - What we know: Need to notify mentioned users (COLL-01 presence indicators come later)
   - What's unclear: Should notifications be in-app only or also email?
   - Recommendation: In-app notifications first (Phase 5), email deferred to v2

3. **Status change permissions**
   - What we know: Users can change annotation status (ANNO-04)
   - What's unclear: Can only author change status? Or any collaborator?
   - Recommendation: Allow any collaborator to change status (more collaborative), track who changed in metadata

4. **Diff viewer for large documents**
   - What we know: react-diff-viewer-continued works for typical docs
   - What's unclear: Performance at document sizes >10,000 lines
   - Recommendation: Implement document size check, show warning for large docs, skip diff or offer download-only

## Sources

### Primary (HIGH confidence)
- **react-mentions** - Verified @mention implementation pattern, markup format, autocomplete configuration
- **react-markdown** - Security features, rehype-sanitize integration, component customization
- **react-syntax-highlighter** - Prism integration, theme support, language detection
- **react-diff-viewer-continued** - Fork of original, actively maintained, split/unified views
- **Supabase** - Query patterns, ilike for search, foreign key relationships
- **Existing codebase** - packages/ui/types.ts, packages/ui/store/useAnnotationStore.ts, packages/ui/utils/parser.ts

### Secondary (MEDIUM confidence)
- **Velt SDK documentation** - Comprehensive collaboration platform but overkill for current needs
- **Product Hunt comment patterns** - Threaded comment UI reference (visual pattern only)
- **react-markdown security guide** - DOMPurify integration, XSS prevention

### Tertiary (LOW confidence)
- **diff visualization libraries 2026** - WebSearch results for alternative diff libraries (unverified)
- **threaded comments implementation patterns** - Community discussion patterns (needs official verification)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Existing codebase analysis + official documentation
- Architecture: HIGH - Based on existing patterns in codebase + standard React patterns
- Pitfalls: HIGH - Security pitfalls verified via official docs, common bugs from community patterns

**Research date:** 2026-02-05
**Valid until:** 2026-03-05 (30 days - stable domain)
