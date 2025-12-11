// Sample markdown string from user
const sampleMarkdown = `# 穿黃色衣服的人影像報告

## 特約永和中正門市影像資料
在特約永和中正門市中，穿著黃色衣服的顧客影像如下：

| 影像來源 | 影像鏈接 |
| -------- | -------- |
| ECC100-特約竹東長春二-櫃台Camera | 影像1 |
| ECC100-特約竹東長春二-櫃台Camera | 影像2 |
| ECC100-特約竹東長春二-櫃台Camera | 影像3 |
| ECC100-特約永和中正-櫃台Camera | 影像4 |
| ECC100-特約永和中正-櫃台Camera | 影像5 |
| ECC100-特約永和中正-櫃台Camera | 影像6 |

更多影像可供檢視，請參考各鏈接。`;

// DOM Elements
const markdownInput = document.getElementById('markdown-input');
const markdownOutput = document.getElementById('markdown-output');
const parseBtn = document.getElementById('parse-btn');
const clearBtn = document.getElementById('clear-btn');
const sampleBtn = document.getElementById('sample-btn');

// Configure marked options
marked.setOptions({
    gfm: true,           // GitHub Flavored Markdown
    breaks: true,        // Convert \n to <br>
    headerIds: true,     // Add IDs to headers
    mangle: false,       // Don't escape HTML
    sanitize: false      // Allow HTML
});

/**
 * Parse JSON-escaped string to normal string
 * Handles multiple formats:
 * 1. JSON string with quotes: "text\\nmore text"
 * 2. Raw string with escape sequences: text\nmore text
 * 3. Double-escaped sequences: text\\nmore text
 */
function parseJsonString(input) {
    let text = input.trim();

    // Method 1: Try parsing as a complete JSON string (with surrounding quotes)
    // This handles: "# Title\\n\\nContent"
    if (text.startsWith('"') && text.endsWith('"')) {
        try {
            return JSON.parse(text);
        } catch (e) {
            // If JSON.parse fails, try manual unescaping
            text = text.slice(1, -1); // Remove surrounding quotes
        }
    }

    // Method 2: Check if it contains double-escaped sequences (\\n, \\t, etc.)
    // This handles strings like: # Title\\n\\nContent (without surrounding quotes)
    if (text.includes('\\\\') || text.includes('\\n') || text.includes('\\t') || text.includes('\\r')) {
        // First, handle double-escaped backslashes: \\\\ -> (temp marker)
        let parsed = text.replace(/\\\\\\\\/g, '\u0000BACKSLASH\u0000');

        // Handle escaped sequences: \\n -> \n, \\t -> \t, etc.
        parsed = parsed
            .replace(/\\\\n/g, '\n')
            .replace(/\\\\t/g, '\t')
            .replace(/\\\\r/g, '\r')
            .replace(/\\\\"/g, '"')
            .replace(/\\\\'/g, "'");

        // Handle single-escaped sequences: \n -> newline (if still remaining)
        parsed = parsed
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, '\t')
            .replace(/\\r/g, '\r')
            .replace(/\\"/g, '"')
            .replace(/\\'/g, "'");

        // Restore actual backslashes
        parsed = parsed.replace(/\u0000BACKSLASH\u0000/g, '\\');

        return parsed;
    }

    // Method 3: Return as-is if no escape sequences detected
    return text;
}

/**
 * Parse and render markdown content
 */
function parseMarkdown() {
    const rawInput = markdownInput.value.trim();

    if (!rawInput) {
        markdownOutput.innerHTML = `
            <div class="placeholder-text">
                <span class="placeholder-icon">⚠️</span>
                <p>請輸入 Markdown 內容</p>
            </div>
        `;
        return;
    }

    try {
        // Parse the input (handle JSON escape sequences)
        const markdownText = parseJsonString(rawInput);

        // Convert markdown to HTML using marked
        const htmlContent = marked.parse(markdownText);

        // Display the rendered markdown
        markdownOutput.innerHTML = htmlContent;

        // Add animation effect
        markdownOutput.style.animation = 'none';
        markdownOutput.offsetHeight; // Trigger reflow
        markdownOutput.style.animation = 'fadeInUp 0.4s ease-out';

    } catch (error) {
        markdownOutput.innerHTML = `
            <div class="placeholder-text">
                <span class="placeholder-icon">❌</span>
                <p>解析錯誤: ${error.message}</p>
            </div>
        `;
    }
}

/**
 * Clear input and output
 */
function clearContent() {
    markdownInput.value = '';
    markdownOutput.innerHTML = `
        <div class="placeholder-text">
            <span class="placeholder-icon">👆</span>
            <p>請輸入 Markdown 字串並點擊「解析 Markdown」按鈕</p>
        </div>
    `;
    markdownInput.focus();
}

/**
 * Load sample markdown
 */
function loadSample() {
    // Load as escaped string (simulating JSON input)
    markdownInput.value = sampleMarkdown.replace(/\n/g, '\\n');
    parseMarkdown();
}

// Event Listeners
parseBtn.addEventListener('click', parseMarkdown);
clearBtn.addEventListener('click', clearContent);
sampleBtn.addEventListener('click', loadSample);

// Parse on Ctrl+Enter
markdownInput.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        parseMarkdown();
    }
});

// Auto-parse on input (debounced) - optional real-time preview
let debounceTimer;
markdownInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        if (markdownInput.value.trim()) {
            parseMarkdown();
        }
    }, 500);
});

// Initialize with sample on page load
document.addEventListener('DOMContentLoaded', () => {
    // Optionally load sample on start
    // loadSample();
});
