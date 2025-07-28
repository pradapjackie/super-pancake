export function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatDuration(ms) {
  if (!ms || ms < 0) return '0ms';
  
  if (ms < 1000) {
    return `${Math.round(ms * 10) / 10}ms`;
  }
  
  const seconds = ms / 1000;
  if (seconds < 60) {
    return `${Math.round(seconds * 10) / 10}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

export function getStatusIcon(status) {
  switch (status) {
    case 'passed': return 'check-circle';
    case 'failed': return 'times-circle';
    case 'skipped': return 'minus-circle';
    default: return 'question-circle';
  }
}

export function getStatusClass(status) {
  switch (status) {
    case 'passed': return 'success';
    case 'failed': return 'danger';
    case 'skipped': return 'warning';
    default: return 'secondary';
  }
}