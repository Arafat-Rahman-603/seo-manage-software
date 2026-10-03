import React from 'react';

export function StructuredData({ data }: { data: any }) {
  if (!data) return null;

  try {
    // Force serialization and validation
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
    
    // Validate it's parseable JSON
    const parsed = JSON.parse(jsonString);

    // Security check: ensure no unsafe characters that could break out of a script tag or execute JS
    const safeString = JSON.stringify(parsed).replace(/</g, '\\u003c');

    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeString }}
      />
    );
  } catch (e) {
    console.error("StructuredData: Invalid JSON-LD", e);
    return null;
  }
}
