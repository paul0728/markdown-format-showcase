// Sample markdown string from user (serialized format)
const sampleMarkdown = `\"# Report: 永和中正 11/26\\n\\n## Sales Records\\nBelow are the sales transactions recorded:\\n\\n| Sale Item ID | Transaction No | Product ID | Quantity | Amount | Store ID | Sale Date | Receipt No | Sales ID | Total Amount |\\n|--------------|----------------|------------|----------|--------|----------|-----------|------------|----------|--------------|\\n| 2505         | 97013201202511261306351 | B21000000041   | 1        | 0.0    | 970132   | 2025-11-26T07:17:12+00:00   | UC48005179   | 012337   | 33200.0       |\\n| 2506         | 97013201202511261306351 | C50326026002   | 1        | 33200.0    | 970132   | 2025-11-26T07:17:12+00:00   | UC48005179   | 012337   | 33200.0       |\\n\\n## Video Snapshots of Individuals Wearing Black Clothing\\nSnapshots captured by ECC100 cameras:\\n\\n![Snapshot](https://ai-analyze-production-engenius-ai.s3.amazonaws.com/88-dc-97-43-60-df/1764151842455/1764151845.jpg?AWSAccessKeyId=AKIATPOLJJJVPR2JJKUF&Signature=R2TzQI1XALswXhYnosU1cFOe%2Fxg%3D&Expires=1765871407)\\n\"`;

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
 * 1. Serialized JSON string with escaped quotes: \"text\\nmore text\"
 * 2. JSON string with quotes: "text\\nmore text"
 * 3. Raw string with escape sequences: text\nmore text  
 */
function parseJsonString(input) {
    let text = input.trim();

    // Method 1: Handle serialized format with escaped quotes at start/end
    // Format: \"text\\nmore text\"
    if (text.startsWith('\\"') && text.endsWith('\\"')) {
        // Remove the escaped quotes
        text = text.slice(2, -2);
        // Now process the escape sequences
        return processEscapeSequences(text);
    }

    // Method 2: Try parsing as a complete JSON string (with surrounding quotes)
    if (text.startsWith('"') && text.endsWith('"')) {
        try {
            return JSON.parse(text);
        } catch (e) {
            // If JSON.parse fails, remove quotes and continue with manual parsing
            text = text.slice(1, -1);
        }
    }

    // Method 3: Manual escape sequence replacement
    return processEscapeSequences(text);
}

/**
 * Process escape sequences in a string
 * Converts \\n to newline, \\t to tab, \\" to quote, etc.
 */
function processEscapeSequences(text) {
    let result = '';
    let i = 0;

    while (i < text.length) {
        // Check for escape sequences
        if (text[i] === '\\' && i < text.length - 1) {
            const nextChar = text[i + 1];

            switch (nextChar) {
                case 'n':
                    result += '\n';
                    i += 2;
                    break;
                case 't':
                    result += '\t';
                    i += 2;
                    break;
                case 'r':
                    result += '\r';
                    i += 2;
                    break;
                case '"':
                    result += '"';
                    i += 2;
                    break;
                case "'":
                    result += "'";
                    i += 2;
                    break;
                case '\\':
                    result += '\\';
                    i += 2;
                    break;
                default:
                    // Not a recognized escape sequence, keep the backslash
                    result += text[i];
                    i += 1;
                    break;
            }
        } else {
            result += text[i];
            i += 1;
        }
    }

    return result;
}

/**
 * Validate Markdown syntax and structure
 * Returns an object with validation results
 */
function validateMarkdown(text) {
    const issues = [];
    const warnings = [];

    // Check for unclosed code blocks
    const codeBlockMatches = text.match(/```/g);
    if (codeBlockMatches && codeBlockMatches.length % 2 !== 0) {
        issues.push('未閉合的程式碼區塊（``` 數量不匹配）');
    }

    // Check for malformed tables
    const lines = text.split('\n');
    let inTable = false;
    let tableColumnCount = 0;

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();

        // Detect table rows
        if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
            const columns = trimmedLine.split('|').filter(cell => cell.trim() !== '');

            if (!inTable) {
                // First row of table
                inTable = true;
                tableColumnCount = columns.length;
            } else {
                // Check if column count matches
                if (columns.length !== tableColumnCount && !trimmedLine.match(/^[\|\s\-:]+$/)) {
                    warnings.push(`第 ${index + 1} 行：表格欄位數量不一致（預期 ${tableColumnCount}，實際 ${columns.length}）`);
                }
            }
        } else if (inTable && trimmedLine === '') {
            // End of table
            inTable = false;
            tableColumnCount = 0;
        }

        // Check for unclosed brackets in links/images
        const openBrackets = (line.match(/\[/g) || []).length;
        const closeBrackets = (line.match(/\]/g) || []).length;
        const openParens = (line.match(/\(/g) || []).length;
        const closeParens = (line.match(/\)/g) || []).length;

        if (openBrackets !== closeBrackets) {
            warnings.push(`第 ${index + 1} 行：方括號 [] 不匹配`);
        }
        if (openParens !== closeParens) {
            warnings.push(`第 ${index + 1} 行：圓括號 () 不匹配`);
        }
    });

    // Check for broken image/link syntax
    const brokenLinks = text.match(/\[([^\]]*)\]\s*\(/g);
    if (brokenLinks) {
        brokenLinks.forEach(match => {
            if (match.includes('\n')) {
                warnings.push('連結或圖片語法中包含換行符');
            }
        });
    }

    // Check for heading structure
    const headings = text.match(/^#{1,6}\s+.+$/gm);
    if (headings) {
        let prevLevel = 0;
        headings.forEach(heading => {
            const level = heading.match(/^#+/)[0].length;
            if (level - prevLevel > 1) {
                warnings.push(`標題層級跳躍過大：從 H${prevLevel} 跳到 H${level}`);
            }
            prevLevel = level;
        });
    }

    return {
        isValid: issues.length === 0,
        issues,
        warnings,
        hasWarnings: warnings.length > 0
    };
}

/**
 * Display validation results
 */
function displayValidationResults(validation) {
    let html = '';

    if (!validation.isValid) {
        html += '<div class="validation-error">';
        html += '<h3>❌ Markdown 語法錯誤</h3>';
        html += '<ul>';
        validation.issues.forEach(issue => {
            html += `<li>${issue}</li>`;
        });
        html += '</ul>';
        html += '</div>';
    }

    if (validation.hasWarnings) {
        html += '<div class="validation-warning">';
        html += '<h3>⚠️ Markdown 語法警告</h3>';
        html += '<ul>';
        validation.warnings.forEach(warning => {
            html += `<li>${warning}</li>`;
        });
        html += '</ul>';
        html += '</div>';
    }

    return html;
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

        // Validate markdown
        const validation = validateMarkdown(markdownText);

        // Convert markdown to HTML using marked
        const htmlContent = marked.parse(markdownText);

        // Display validation results and rendered markdown
        let outputHtml = '';

        if (!validation.isValid || validation.hasWarnings) {
            outputHtml += displayValidationResults(validation);
        }

        if (validation.isValid) {
            outputHtml += '<div class="validation-success">';
            outputHtml += '<p>✅ Markdown 語法檢查通過</p>';
            outputHtml += '</div>';
        }

        outputHtml += '<hr class="validation-separator">';
        outputHtml += htmlContent;

        markdownOutput.innerHTML = outputHtml;

        // Add animation effect
        markdownOutput.style.animation = 'none';
        markdownOutput.offsetHeight; // Trigger reflow
        markdownOutput.style.animation = 'fadeInUp 0.4s ease-out';

    } catch (error) {
        const errorMsg = String(error.message).replace(/</g, '&lt;').replace(/>/g, '&gt;');
        markdownOutput.innerHTML = `
            <div class="placeholder-text">
                <span class="placeholder-icon">❌</span>
                <p>解析錯誤: ${errorMsg}</p>
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
    // Load the serialized sample directly
    markdownInput.value = sampleMarkdown;
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
