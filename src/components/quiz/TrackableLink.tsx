interface TrackableLinkProps {
  href?: string;
  children: React.ReactNode;
  sessionId: string;
  className?: string;
}

const TrackableLink = ({ href, children, sessionId, className = "" }: TrackableLinkProps) => {
  if (!href) {
    return <span className={className}>{children}</span>;
  }

  // Check if it's already a tracked link (/go/xxx or edge function)
  const isTrackedLink = href.includes('/go/') || href.includes('/functions/v1/track-click/');
  
  let finalUrl = href;
  if (isTrackedLink && !href.includes('session=')) {
    // Add session and source parameters to tracked links
    const separator = href.includes('?') ? '&' : '?';
    finalUrl = `${href}${separator}session=${sessionId}&source=ai_recommendation`;
  }

  return (
    <a
      href={finalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`text-primary hover:text-primary/80 underline transition-colors ${className}`}
    >
      {children}
    </a>
  );
};

export default TrackableLink;
