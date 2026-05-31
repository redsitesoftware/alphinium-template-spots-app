/**
 * MapWebView.web.js — Web platform implementation using <iframe>.
 * react-native-webview has no web support; this replaces it.
 * Messages use window.parent.postMessage / window.addEventListener.
 */
import React, { useRef, useEffect, forwardRef } from 'react';

const MapWebView = forwardRef(function MapWebView({ source, onMessage, style, onLoad }, _ref) {
  const iframeRef = useRef(null);

  useEffect(() => {
    const handler = (event) => {
      if (!onMessage) return;
      onMessage({ nativeEvent: { data: event.data } });
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onMessage]);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={source?.html}
      onLoad={onLoad}
      style={{
        border: 'none',
        width: '100%',
        height: '100%',
        background: '#0F1A0F',
        ...style,
      }}
      sandbox="allow-scripts allow-same-origin"
    />
  );
});

export default MapWebView;
