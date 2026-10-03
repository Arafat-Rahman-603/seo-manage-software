import { Seo } from './index';

export type SeoSeverity = 'ERROR' | 'WARNING' | 'INFO';

export type SeoCategory = 
  | 'METADATA' 
  | 'CANONICAL' 
  | 'INDEXING' 
  | 'STRUCTURED_DATA' 
  | 'CONTENT' 
  | 'HEADINGS' 
  | 'IMAGES' 
  | 'LINKS' 
  | 'SITEMAP' 
  | 'ROBOTS' 
  | 'URL';

export interface SeoDiagnostic {
  code: string;
  severity: SeoSeverity;
  category: SeoCategory;
  page: string;
  message: string;
  path?: string;
  suggestion?: string;
}

function validateJsonLdNode(node: any, issues: SeoDiagnostic[], page: string) {
  if (!node['@type']) {
    issues.push({
      code: 'JSONLD_MISSING_TYPE',
      severity: 'ERROR',
      category: 'STRUCTURED_DATA',
      page,
      message: 'Schema.org object is missing @type',
      path: 'jsonLd.@type'
    });
    return;
  }

  const type = node['@type'];
  
  if (['Organization', 'WebSite', 'WebPage'].includes(type) && !node.name) {
    issues.push({
      code: `JSONLD_MISSING_NAME_${type.toUpperCase()}`,
      severity: 'WARNING',
      category: 'STRUCTURED_DATA',
      page,
      message: `${type} schema should typically include a 'name' property.`,
      path: `jsonLd.name`
    });
  }

  if (type === 'Article' && !node.headline) {
    issues.push({
      code: 'JSONLD_MISSING_HEADLINE_ARTICLE',
      severity: 'WARNING',
      category: 'STRUCTURED_DATA',
      page,
      message: `Article schema should include a 'headline'.`,
      path: `jsonLd.headline`
    });
  }
}

export function validateSeo(
  pageName: string, 
  seo: Seo | Partial<Seo>, 
  pageData?: any
): SeoDiagnostic[] {
  const issues: SeoDiagnostic[] = [];

  // Title
  if (!seo.title || seo.title.trim() === '') {
    issues.push({ 
      code: 'MISSING_TITLE', 
      severity: 'ERROR', 
      category: 'METADATA', 
      page: pageName, 
      message: 'Missing meta title', 
      path: 'title',
      suggestion: 'Provide a unique, descriptive title.'
    });
  } else {
    issues.push({ 
      code: 'TITLE_PRESENT', 
      severity: 'INFO', 
      category: 'METADATA', 
      page: pageName, 
      message: 'Title is present and valid.', 
      path: 'title'
    });
    if (seo.title.length < 30) {
      issues.push({ 
        code: 'TITLE_TOO_SHORT', 
        severity: 'WARNING', 
        category: 'METADATA', 
        page: pageName, 
        message: 'Title is shorter than the recommended minimum of 30 characters', 
        path: 'title'
      });
    }
    if (seo.title.length > 60) {
      issues.push({ 
        code: 'TITLE_TOO_LONG', 
        severity: 'WARNING', 
        category: 'METADATA', 
        page: pageName, 
        message: 'Title is longer than the recommended maximum of 60 characters', 
        path: 'title'
      });
    }
  }

  // Description
  if (!seo.description || seo.description.trim() === '') {
    issues.push({ 
      code: 'MISSING_DESCRIPTION', 
      severity: 'ERROR', 
      category: 'METADATA', 
      page: pageName, 
      message: 'Missing meta description', 
      path: 'description'
    });
  } else {
    if (seo.description.length < 50) {
      issues.push({ 
        code: 'DESCRIPTION_TOO_SHORT', 
        severity: 'WARNING', 
        category: 'METADATA', 
        page: pageName, 
        message: 'Description is shorter than the recommended minimum of 50 characters', 
        path: 'description'
      });
    }
    if (seo.description.length > 160) {
      issues.push({ 
        code: 'DESCRIPTION_TOO_LONG', 
        severity: 'WARNING', 
        category: 'METADATA', 
        page: pageName, 
        message: 'Description is longer than the recommended maximum of 160 characters', 
        path: 'description'
      });
    }
  }

  // Canonical
  if (!seo.canonical) {
    issues.push({ 
      code: 'MISSING_CANONICAL', 
      severity: 'WARNING', 
      category: 'CANONICAL', 
      page: pageName, 
      message: 'Missing explicit canonical URL', 
      path: 'canonical'
    });
  } else {
    try {
      const url = new URL(seo.canonical);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') {
         throw new Error("Invalid protocol");
      }
    } catch {
      issues.push({ 
        code: 'INVALID_CANONICAL', 
        severity: 'ERROR', 
        category: 'CANONICAL', 
        page: pageName, 
        message: 'Canonical URL must be a valid absolute HTTP/HTTPS URL', 
        path: 'canonical'
      });
    }
  }

  // Open Graph
  if (!seo.ogImage) {
    issues.push({ 
      code: 'MISSING_OG_IMAGE', 
      severity: 'WARNING', 
      category: 'METADATA', 
      page: pageName, 
      message: 'Missing Open Graph image', 
      path: 'ogImage'
    });
  } else {
    issues.push({ 
      code: 'OG_IMAGE_PRESENT', 
      severity: 'INFO', 
      category: 'METADATA', 
      page: pageName, 
      message: 'Open Graph image is configured', 
      path: 'ogImage'
    });
  }

  // Structured Data
  if (!seo.jsonLd) {
    issues.push({ 
      code: 'MISSING_JSONLD', 
      severity: 'WARNING', 
      category: 'STRUCTURED_DATA', 
      page: pageName, 
      message: 'Missing structured data (JSON-LD)', 
      path: 'jsonLd'
    });
  } else {
    try {
      const parsed = typeof seo.jsonLd === 'string' ? JSON.parse(seo.jsonLd) : seo.jsonLd;
      
      // Basic security check on string representation
      const strRep = JSON.stringify(parsed);
      if (strRep.includes('<script') || strRep.includes('javascript:')) {
         issues.push({
           code: 'JSONLD_UNSAFE_CONTENT',
           severity: 'ERROR',
           category: 'STRUCTURED_DATA',
           page: pageName,
           message: 'JSON-LD contains unsafe executable constructs',
           path: 'jsonLd'
         });
      }

      if (!parsed['@context'] && !parsed['@graph']) {
        issues.push({ 
          code: 'JSONLD_MISSING_CONTEXT', 
          severity: 'ERROR', 
          category: 'STRUCTURED_DATA', 
          page: pageName, 
          message: 'Invalid JSON-LD: Missing @context', 
          path: 'jsonLd'
        });
      }

      if (parsed['@graph'] && Array.isArray(parsed['@graph'])) {
        parsed['@graph'].forEach((node: any) => validateJsonLdNode(node, issues, pageName));
      } else if (Array.isArray(parsed)) {
        parsed.forEach((node: any) => validateJsonLdNode(node, issues, pageName));
      } else {
        validateJsonLdNode(parsed, issues, pageName);
      }

    } catch {
      issues.push({ 
        code: 'JSONLD_PARSE_ERROR', 
        severity: 'ERROR', 
        category: 'STRUCTURED_DATA', 
        page: pageName, 
        message: 'Invalid JSON-LD: Failed to parse as valid JSON', 
        path: 'jsonLd'
      });
    }
  }

  // Headings, Images, Links Audit based on pageData
  if (pageData && pageData.sections) {
    let h1Count = 0;
    
    // Very rudimentary extraction (assuming sections have string properties that might contain H1s or we inspect structured section data)
    // In a real system, you'd inspect the actual block structure.
    pageData.sections.forEach((section: any) => {
        const dataStr = JSON.stringify(section.data || {});
        // Mock checking for internal links
        if (dataStr.includes('href="/') || dataStr.includes("href='/")) {
           // naive detection of internal links
        }

        // Mock checking for H1 presence if it's a hero
        if (section.type === 'hero' && section.data?.title) {
            h1Count++;
        }
    });

    if (h1Count === 0) {
      issues.push({
        code: 'MISSING_H1',
        severity: 'WARNING',
        category: 'HEADINGS',
        page: pageName,
        message: 'Page content does not appear to contain an H1 heading (based on hero sections).',
      });
    } else if (h1Count > 1) {
      issues.push({
        code: 'MULTIPLE_H1',
        severity: 'WARNING',
        category: 'HEADINGS',
        page: pageName,
        message: 'Page content contains multiple H1 headings.',
      });
    }
  }

  return issues;
}

export function detectDuplicates(allPagesSeo: Record<string, Seo | Partial<Seo>>): SeoDiagnostic[] {
    const issues: SeoDiagnostic[] = [];
    const titles = new Map<string, string[]>();
    const descriptions = new Map<string, string[]>();
    const canonicals = new Map<string, string[]>();

    for (const [page, seo] of Object.entries(allPagesSeo)) {
        if (seo.title) {
            const arr = titles.get(seo.title) || [];
            arr.push(page);
            titles.set(seo.title, arr);
        }
        if (seo.description) {
            const arr = descriptions.get(seo.description) || [];
            arr.push(page);
            descriptions.set(seo.description, arr);
        }
        if (seo.canonical) {
            const arr = canonicals.get(seo.canonical) || [];
            arr.push(page);
            canonicals.set(seo.canonical, arr);
        }
    }

    titles.forEach((pages, title) => {
        if (pages.length > 1) {
            pages.forEach(page => {
                issues.push({
                    code: 'DUPLICATE_TITLE',
                    severity: 'WARNING',
                    category: 'METADATA',
                    page,
                    message: `Title is duplicated across multiple pages: ${pages.join(', ')}`,
                    path: 'title'
                });
            });
        }
    });

    descriptions.forEach((pages, desc) => {
        if (pages.length > 1) {
            pages.forEach(page => {
                issues.push({
                    code: 'DUPLICATE_DESCRIPTION',
                    severity: 'WARNING',
                    category: 'METADATA',
                    page,
                    message: `Description is duplicated across multiple pages: ${pages.join(', ')}`,
                    path: 'description'
                });
            });
        }
    });

    canonicals.forEach((pages, canonical) => {
        if (pages.length > 1) {
            pages.forEach(page => {
                issues.push({
                    code: 'DUPLICATE_CANONICAL',
                    severity: 'ERROR', // Canonical duplicates are usually an error
                    category: 'CANONICAL',
                    page,
                    message: `Canonical URL is duplicated across multiple pages: ${pages.join(', ')}`,
                    path: 'canonical'
                });
            });
        }
    });

    return issues;
}
