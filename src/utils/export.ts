import type { StoryState } from '../types';

export function exportToMarkdown(story: StoryState): string {
  const date = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  });

  let md = `# ${story.title}\n\n`;
  md += `**Genre:** ${story.genre}  \n`;
  md += `**Created:** ${date}  \n\n`;
  md += `---\n\n`;

  if (story.characters.length > 0) {
    md += `## Characters\n\n`;
    story.characters.forEach(c => {
      md += `- **${c.name}**: ${c.description}\n`;
    });
    md += `\n---\n\n`;
  }

  md += `## Story\n\n`;
  
  story.segments.forEach(segment => {
    if (segment.role === 'user') {
      md += `> *${segment.content}*\n\n`;
    } else {
      md += `${segment.content}\n\n`;
      if (segment.isRemixed) {
        md += `*[Genre Remix]*\n\n`;
      }
    }
  });

  md += `---\n\n*Written with Story Weaver — AI Collaborative Storytelling*\n`;
  
  return md;
}

export function downloadMarkdown(story: StoryState): void {
  const content = exportToMarkdown(story);
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${story.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
