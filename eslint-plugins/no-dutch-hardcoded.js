/**
 * Custom ESLint rule to detect hardcoded Dutch text in JSX
 * This helps enforce the use of UI constants from src/lib/uiTexts.ts
 */

// Common Dutch words and patterns that indicate hardcoded text
const DUTCH_PATTERNS = [
  // Common verbs
  /\b(opslaan|annuleren|verwijderen|bewerken|toevoegen|maken|zoeken|laden|uploaden)\b/i,
  // Common nouns
  /\b(taak|taken|project|projecten|kosten|document|foto|contact|aannemer|gebruiker)\b/i,
  // Common phrases
  /\b(nieuw[e]?|bezig|gereed|te doen|geen|nog geen|selecteer|kies)\b/i,
  // Status/state words
  /\b(succesvol|mislukt|fout|waarschuwing|laden|geladen)\b/i,
  // Action words
  /\b(wijzigen|bijwerken|invoeren|invullen|bekijken|tonen|verbergen)\b/i,
  // Common UI labels
  /\b(naam|titel|beschrijving|datum|status|categorie|type|bedrag|notitie)\b/i,
  // Question/confirmation words
  /\b(weet je zeker|bevestig|akkoord|ja|nee)\b/i,
];

// Whitelist: paths that are allowed to have Dutch text
const ALLOWED_PATHS = [
  'src/lib/uiTexts.ts',
  'src/lib/renovationTemplates.ts',
  'src/lib/builderJokes.ts',
];

// Whitelist: specific strings that are acceptable
const ALLOWED_STRINGS = [
  'nl-NL', // Locale
  'nl', // Language code
];

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow hardcoded Dutch text in JSX - use UI constants instead',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      noHardcodedDutch: 
        'Hardcoded Dutch text "{{text}}" detected. Use UI constants from src/lib/uiTexts.ts instead.',
    },
    schema: [],
  },

  create(context) {
    const filename = context.getFilename();
    
    // Skip whitelisted files
    if (ALLOWED_PATHS.some(path => filename.includes(path))) {
      return {};
    }

    // Skip non-component files
    if (!filename.match(/\.(tsx|jsx)$/)) {
      return {};
    }

    function containsDutchText(text) {
      if (!text || typeof text !== 'string') return false;
      
      const trimmed = text.trim();
      
      // Skip empty or very short strings
      if (trimmed.length < 3) return false;
      
      // Skip whitelisted strings
      if (ALLOWED_STRINGS.includes(trimmed)) return false;
      
      // Skip strings that look like code/technical (camelCase, snake_case, etc.)
      if (/^[a-z]+[A-Z]/.test(trimmed)) return false; // camelCase
      if (/^[a-z_]+$/.test(trimmed)) return false; // snake_case
      if (/^[A-Z_]+$/.test(trimmed)) return false; // SCREAMING_SNAKE
      if (/^[a-z]+-[a-z]+/.test(trimmed)) return false; // kebab-case
      
      // Skip URLs, emails, file paths
      if (/^(https?:|mailto:|\/|\.\/|\.\.)/.test(trimmed)) return false;
      
      // Skip CSS class names and technical strings
      if (/^(w-|h-|p-|m-|text-|bg-|flex|grid|border|rounded)/.test(trimmed)) return false;
      
      // Check against Dutch patterns
      return DUTCH_PATTERNS.some(pattern => pattern.test(trimmed));
    }

    function reportIfDutch(node, text) {
      if (containsDutchText(text)) {
        context.report({
          node,
          messageId: 'noHardcodedDutch',
          data: {
            text: text.length > 50 ? text.substring(0, 50) + '...' : text,
          },
        });
      }
    }

    return {
      // Check JSX text content
      JSXText(node) {
        const text = node.value;
        reportIfDutch(node, text);
      },

      // Check string literals in JSX attributes
      JSXAttribute(node) {
        if (
          node.value &&
          node.value.type === 'Literal' &&
          typeof node.value.value === 'string'
        ) {
          // Skip certain attribute names
          const attrName = node.name.name;
          const skipAttrs = ['className', 'id', 'name', 'type', 'href', 'src', 'alt', 'key', 'data-testid'];
          if (skipAttrs.includes(attrName)) return;
          
          reportIfDutch(node.value, node.value.value);
        }
      },

      // Check template literals in JSX
      TemplateLiteral(node) {
        // Only check if inside JSX
        let parent = node.parent;
        let isInJSX = false;
        while (parent) {
          if (parent.type.startsWith('JSX')) {
            isInJSX = true;
            break;
          }
          parent = parent.parent;
        }
        
        if (isInJSX) {
          node.quasis.forEach(quasi => {
            reportIfDutch(quasi, quasi.value.raw);
          });
        }
      },
    };
  },
};
