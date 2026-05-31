/**
 * AppWebView.web.js — generic WebView shim for web platform.
 */
import React, { useRef, useEffect } from 'react';

export default function AppWebView({ source, onMessage, style, onLoad, onNavigationStateChange, ...rest }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    const handler = (event) => {
      if (onMessage) onMessage({ nativeEvent: { data: event.data } });
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onMessage]);

  const src = source?.uri || undefined;
  const srcDoc = source?.html || undefined;

  const handleLoad = () => {
    if (onLoad) onLoad();
    if (onNavigationStateChange && iframeRef.current) {
      try {
        onNavigationStateChange({ url: iframeRef.current.contentWindow?.location?.href || src || '' });
      } catch (_) {}
    }
  };

  return (
    <iframe
      ref={iframeRef}
      src={src}
      srcDoc={srcDoc}
      onLoad={handleLoad}
      style={{
        border: 'none',
        width: '100%',
        height: '100%',
        background: '#0F1A0F',
        ...style,
      }}
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
    />
  );
}
