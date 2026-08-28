// Utility formatters for UI presentation

export function formatTimeAgo(dateString?: string | Date): string {
  if (!dateString) return 'just now';
  
  // Normalize string to UTC ISO-8601 if no timezone offset is explicitly provided
  let date: Date;
  if (typeof dateString === 'string') {
    let normalized = dateString.trim();
    // If backend returns "YYYY-MM-DDTHH:mm:ss" without trailing Z or +/- offset, append Z for UTC
    if (!normalized.endsWith('Z') && !normalized.includes('+') && !normalized.match(/-\d{2}:\d{2}$/)) {
      normalized = normalized + 'Z';
    }
    date = new Date(normalized);
  } else {
    date = dateString;
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Handle minor clock skews or immediate creation
  if (isNaN(diffInSeconds) || diffInSeconds < 5) return 'just now';
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks}w ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getInitials(name?: string): string {
  if (!name) return 'NX';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function generateAvatarUrl(name: string, background = '6366f1'): string {
  const safeName = encodeURIComponent(name || 'Nexora User');
  return `https://api.dicebear.com/7.x/initials/svg?seed=${safeName}&backgroundColor=${background}&textColor=ffffff&fontWeight=600`;
}

export function formatNumberCompact(num: number): string {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
}

export function truncate(str: string, length = 100): string {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.substring(0, length).trim() + '...';
}
