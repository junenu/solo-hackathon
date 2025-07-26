#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListResourcesRequestSchema, ListToolsRequestSchema, ReadResourceRequestSchema, ErrorCode, McpError, } from '@modelcontextprotocol/sdk/types.js';
import fetch from 'node-fetch';
const server = new Server({
    name: 'example-mcp-server',
    version: '1.0.0',
}, {
    capabilities: {
        resources: {},
        tools: {},
    },
});
// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'calculate',
                description: 'Perform basic mathematical calculations',
                inputSchema: {
                    type: 'object',
                    properties: {
                        expression: {
                            type: 'string',
                            description: 'Mathematical expression to evaluate (e.g., "2 + 2")',
                        },
                    },
                    required: ['expression'],
                },
            },
            {
                name: 'fetch_url',
                description: 'Fetch content from a URL',
                inputSchema: {
                    type: 'object',
                    properties: {
                        url: {
                            type: 'string',
                            description: 'URL to fetch',
                        },
                    },
                    required: ['url'],
                },
            },
            {
                name: 'uppercase',
                description: 'Convert text to uppercase',
                inputSchema: {
                    type: 'object',
                    properties: {
                        text: {
                            type: 'string',
                            description: 'Text to convert to uppercase',
                        },
                    },
                    required: ['text'],
                },
            },
        ],
    };
});
// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    switch (name) {
        case 'calculate': {
            const expression = args?.expression;
            if (!expression) {
                throw new McpError(ErrorCode.InvalidParams, 'Expression is required');
            }
            try {
                // Simple and safe evaluation for basic math
                const result = evaluateExpression(expression);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `${expression} = ${result}`,
                        },
                    ],
                };
            }
            catch (error) {
                throw new McpError(ErrorCode.InternalError, `Failed to evaluate expression: ${error}`);
            }
        }
        case 'fetch_url': {
            const url = args?.url;
            if (!url) {
                throw new McpError(ErrorCode.InvalidParams, 'URL is required');
            }
            try {
                const response = await fetch(url);
                const text = await response.text();
                return {
                    content: [
                        {
                            type: 'text',
                            text: text.substring(0, 1000), // Limit response size
                        },
                    ],
                };
            }
            catch (error) {
                throw new McpError(ErrorCode.InternalError, `Failed to fetch URL: ${error}`);
            }
        }
        case 'uppercase': {
            const text = args?.text;
            if (!text) {
                throw new McpError(ErrorCode.InvalidParams, 'Text is required');
            }
            return {
                content: [
                    {
                        type: 'text',
                        text: text.toUpperCase(),
                    },
                ],
            };
        }
        default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
});
// Define available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
        resources: [
            {
                uri: 'example://greeting',
                name: 'Greeting Message',
                description: 'A simple greeting message',
                mimeType: 'text/plain',
            },
            {
                uri: 'example://time',
                name: 'Current Time',
                description: 'The current date and time',
                mimeType: 'text/plain',
            },
        ],
    };
});
// Handle resource reads
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    switch (uri) {
        case 'example://greeting':
            return {
                contents: [
                    {
                        uri,
                        mimeType: 'text/plain',
                        text: 'Hello from the MCP server!',
                    },
                ],
            };
        case 'example://time':
            return {
                contents: [
                    {
                        uri,
                        mimeType: 'text/plain',
                        text: new Date().toISOString(),
                    },
                ],
            };
        default:
            throw new McpError(ErrorCode.InvalidParams, `Unknown resource: ${uri}`);
    }
});
// Simple expression evaluator for basic math
function evaluateExpression(expr) {
    // Remove whitespace
    expr = expr.replace(/\s/g, '');
    // Validate expression contains only allowed characters
    if (!/^[\d+\-*/().]+$/.test(expr)) {
        throw new Error('Invalid characters in expression');
    }
    // Use Function constructor with limited scope
    try {
        return new Function('return ' + expr)();
    }
    catch (error) {
        throw new Error('Invalid expression');
    }
}
// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('MCP server running on stdio');
}
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map