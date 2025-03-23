export const useMcpTool = async (
  serverName: string,
  toolName: string,
  args: Record<string, any>
) => {
  try {
    const response = await fetch('http://localhost:3000/api/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        server_name: serverName,
        tool_name: toolName,
        arguments: args
      })
    });

    if (!response.ok) {
      throw new Error(`MCP tool request failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`Error using MCP tool ${serverName}/${toolName}:`, error);
    return null;
  }
};